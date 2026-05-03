<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

const safeId = computed(() => props.storageKey.replace(/[^a-zA-Z0-9_-]/g, '_'))

// Đăng ký Style để dùng pt thay vì class
const Size = Quill.import('attributors/style/size');
Size.whitelist = null; 
Quill.register(Size, true);
const Delta = Quill.import('delta');

const quillRef = ref<any>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const editorContent = ref('')
const currentFontSize = ref(14)
const pendingCursorFontSize = ref<string | null>(null)
const lastSelectionRange = ref<QuillSelectionRange | null>(null)
const heldSelectionRects = ref<HeldSelectionRect[]>([])
const heldCaretRect = ref<HeldSelectionRect | null>(null)
let selectionAnimationFrame: number | null = null
let isPointerSelecting = false
let isApplyingCursorFontSize = false
let previewState: PreviewState | null = null

type QuillSelectionRange = {
  index: number
  length: number
}

type HeldSelectionRect = {
  left: number
  top: number
  width: number
  height: number
}

type PreviewState = {
  range: QuillSelectionRange
  contents: any
}

const loadContent = () => {
  editorContent.value = localStorage.getItem(props.storageKey) || ''
}

const getCurrentFontSizeValue = () => `${currentFontSize.value}pt`

const isSameRange = (first: QuillSelectionRange, second: QuillSelectionRange) => {
  return first.index === second.index && first.length === second.length
}

const getCurrentLineRange = (quill: any, range: QuillSelectionRange): QuillSelectionRange => {
  const [line, offset] = quill.getLine(range.index)
  const lineLength = Math.max((line?.length?.() ?? 1) - 1, 0)

  return {
    index: range.index - offset,
    length: lineLength
  }
}

const getActiveFormatRange = (quill: any): QuillSelectionRange | null => {
  const range = lastSelectionRange.value
  if (!range) return null

  return range.length > 0 ? range : getCurrentLineRange(quill, range)
}

const saveEditorContent = (quill: any) => {
  editorContent.value = quill.root.innerHTML
  localStorage.setItem(props.storageKey, editorContent.value)
}

const keepCurrentFontSizeForEmptyEditor = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill || quill.getLength() > 1) return

  const range = quill.getSelection()
  if (!range) return

  quill.format('size', getCurrentFontSizeValue(), Quill.sources.SILENT)
}

const applyPendingCursorFontSize = (quill: any, range: QuillSelectionRange) => {
  if (!pendingCursorFontSize.value || range.length > 0) return

  isApplyingCursorFontSize = true
  try {
    quill.format('size', pendingCursorFontSize.value, Quill.sources.SILENT)
    pendingCursorFontSize.value = null
  } finally {
    isApplyingCursorFontSize = false
  }
}

const resolveLeafPosition = (leaf: any, offset: number, isEnd: boolean) => {
  const node = leaf?.domNode as Node | undefined
  if (!node) return null

  if (node.nodeType === Node.TEXT_NODE) {
    return {
      node,
      offset: Math.min(offset, node.textContent?.length ?? 0)
    }
  }

  return {
    node,
    offset: isEnd ? node.childNodes.length : 0
  }
}

const createDomRangeFromQuillRange = (quill: any, range: QuillSelectionRange) => {
  const [startLeaf, startOffset] = quill.getLeaf(range.index)
  const [endLeaf, endOffset] = quill.getLeaf(range.index + range.length)
  const start = resolveLeafPosition(startLeaf, startOffset, false)
  const end = resolveLeafPosition(endLeaf, endOffset, true)

  if (!start || !end) return null

  const domRange = document.createRange()
  domRange.setStart(start.node, start.offset)
  domRange.setEnd(end.node, end.offset)
  return domRange
}

const getFakeSelectionMetrics = (rect: DOMRect) => {
  const height = Math.ceil(rect.height + 4)

  return {
    centerY: (rect.top + rect.bottom) / 2,
    height
  }
}

const snapPixel = (value: number) => {
  return Math.round(value)
}

const mergeSelectionRects = (rects: HeldSelectionRect[]) => {
  const lineTolerance = 3
  const sortedRects = [...rects].sort((first, second) => {
    if (Math.abs(first.top - second.top) > lineTolerance) {
      return first.top - second.top
    }

    return first.left - second.left
  })
  const mergedRects: HeldSelectionRect[] = []

  for (const rect of sortedRects) {
    const previousRect = mergedRects[mergedRects.length - 1]
    const sameLine = previousRect && Math.abs(previousRect.top - rect.top) <= lineTolerance

    if (sameLine && rect.left <= previousRect.left + previousRect.width + 1) {
      const left = Math.min(previousRect.left, rect.left)
      const right = Math.max(previousRect.left + previousRect.width, rect.left + rect.width)
      const top = Math.min(previousRect.top, rect.top)
      const bottom = Math.max(previousRect.top + previousRect.height, rect.top + rect.height)

      previousRect.left = left
      previousRect.top = top
      previousRect.width = right - left
      previousRect.height = bottom - top
      continue
    }

    mergedRects.push({ ...rect })
  }

  return mergedRects
}

const clearHeldSelection = () => {
  heldSelectionRects.value = []
}

const clearHeldCaret = () => {
  heldCaretRect.value = null
}

const restorePreview = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill || !previewState) return

  const { range, contents } = previewState
  quill.updateContents(
    new Delta().retain(range.index).delete(range.length).concat(contents),
    Quill.sources.SILENT
  )
  previewState = null
}

const beginPreview = (quill: any, range: QuillSelectionRange) => {
  if (previewState && isSameRange(previewState.range, range)) {
    const contents = previewState.contents
    quill.updateContents(
      new Delta().retain(range.index).delete(range.length).concat(contents),
      Quill.sources.SILENT
    )
    return
  }

  restorePreview()
  previewState = {
    range: { ...range },
    contents: quill.getContents(range.index, range.length)
  }
}

const commitPreview = (quill: any, range?: QuillSelectionRange) => {
  previewState = null
  saveEditorContent(quill)
  if (range && range.length > 0) {
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    holdSelectionHighlight()
  }
}

const collapseMultilineSelection = (rects: HeldSelectionRect[]) => {
  const lineTolerance = 3
  const lineTops = new Set(rects.map(rect => Math.round(rect.top / lineTolerance)))

  if (lineTops.size <= 1) {
    return rects
  }

  const left = Math.min(...rects.map(rect => rect.left))
  const top = Math.min(...rects.map(rect => rect.top))
  const right = Math.max(...rects.map(rect => rect.left + rect.width))
  const bottom = Math.max(...rects.map(rect => rect.top + rect.height))

  return [{
    left,
    top,
    width: right - left,
    height: bottom - top
  }]
}

const renderHeldSelectionRects = (domRange: Range) => {
  const wrapper = wrapperRef.value
  if (!wrapper) return

  const wrapperRect = wrapper.getBoundingClientRect()
  const nextRects = Array.from(domRange.getClientRects())
    .filter(rect => rect.width > 0 && rect.height > 0)
    .map(rect => {
      const lineMetrics = getFakeSelectionMetrics(rect)

      return {
        left: snapPixel(rect.left - wrapperRect.left),
        top: snapPixel(lineMetrics.centerY - (lineMetrics.height / 2) - wrapperRect.top),
        width: snapPixel(rect.width),
        height: lineMetrics.height
      }
    })

  heldSelectionRects.value = collapseMultilineSelection(mergeSelectionRects(nextRects))
}

const holdSelectionHighlight = () => {
  const quill = quillRef.value?.getQuill()
  const range = lastSelectionRange.value

  if (!quill || !range || range.length === 0) {
    clearHeldSelection()
    return
  }

  const domRange = createDomRangeFromQuillRange(quill, range)
  if (!domRange) return

  renderHeldSelectionRects(domRange)
}

const holdCursorCaret = () => {
  const quill = quillRef.value?.getQuill()
  const wrapper = wrapperRef.value
  const range = lastSelectionRange.value

  if (!quill || !wrapper || !range || range.length > 0) {
    clearHeldCaret()
    return
  }

  const bounds = quill.getBounds(range.index, 0)
  const wrapperRect = wrapper.getBoundingClientRect()
  const containerRect = quill.container.getBoundingClientRect()
  const fontHeight = Math.ceil(currentFontSize.value * (4 / 3) * 1.6)
  const height = Math.max(fontHeight, Math.ceil(bounds.height || 0))
  const centerY = containerRect.top - wrapperRect.top + bounds.top + ((bounds.height || height) / 2)

  heldCaretRect.value = {
    left: snapPixel(containerRect.left - wrapperRect.left + bounds.left),
    top: snapPixel(centerY - (height / 2)),
    width: 1,
    height
  }
}

const isRangeInsideEditor = (range: Range) => {
  const quill = quillRef.value?.getQuill()
  const root = quill?.root as HTMLElement | undefined

  return !!root && root.contains(range.startContainer) && root.contains(range.endContainer)
}

const updateNativeSelectionHighlight = () => {
  selectionAnimationFrame = null
  const selection = window.getSelection()
  const activeElement = document.activeElement

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    if (wrapperRef.value?.contains(activeElement)) return
    clearHeldSelection()
    return
  }

  const domRange = selection.getRangeAt(0)
  if (!isRangeInsideEditor(domRange)) {
    if (wrapperRef.value?.contains(activeElement)) return
    clearHeldSelection()
    return
  }

  renderHeldSelectionRects(domRange)
}

const scheduleNativeSelectionHighlight = () => {
  if (selectionAnimationFrame !== null) return
  selectionAnimationFrame = requestAnimationFrame(updateNativeSelectionHighlight)
}

const onUpdate = () => {
  previewState = null
  clearHeldSelection()
  clearHeldCaret()
  const quill = quillRef.value?.getQuill()
  if (quill) {
    saveEditorContent(quill)
    keepCurrentFontSizeForEmptyEditor()
  }
}

const previewInlineFormat = (format: string, value: string | boolean) => {
  const quill = quillRef.value?.getQuill()
  const range = lastSelectionRange.value
  if (!quill || !range || range.length === 0) return

  beginPreview(quill, range)
  clearHeldSelection()
  clearHeldCaret()
  quill.formatText(range.index, range.length, format, value, Quill.sources.SILENT)
}

const commitInlineFormat = (quill: any, format: string, value: string | boolean) => {
  const targetRange = getActiveFormatRange(quill)
  if (!targetRange) return

  if (targetRange.length > 0) {
    if (!previewState) {
      quill.formatText(targetRange.index, targetRange.length, format, value, Quill.sources.USER)
    }
    commitPreview(quill, lastSelectionRange.value?.length ? lastSelectionRange.value : undefined)
    return
  }

  pendingCursorFontSize.value = null
  quill.format(format, value, Quill.sources.USER)
  saveEditorContent(quill)
}

const toolbarOptions = computed(() => ({
  container: `#toolbar-${safeId.value}`,
  handlers: {
    color(this: { quill: any }, value: string) {
      commitInlineFormat(this.quill, 'color', value || false)
    },
    background(this: { quill: any }, value: string) {
      commitInlineFormat(this.quill, 'background', value || false)
    },
    clean(this: { quill: any }) {
      const range = this.quill.getSelection()
      if (!range) return
      const inlineFormatsToClear = {
        bold: null,
        italic: null,
        underline: null,
        strike: null,
        color: null,
        background: null,
        link: null
      }

      if (range.length > 0) {
        this.quill.updateContents(
          new Delta().retain(range.index).retain(range.length, inlineFormatsToClear),
          Quill.sources.USER
        )
        this.quill.formatLine(range.index, range.length, {
          header: false,
          list: false,
          blockquote: false,
          'code-block': false
        }, Quill.sources.USER)
        this.quill.setSelection(range.index, range.length, Quill.sources.SILENT)
      } else {
        this.quill.format('bold', false, Quill.sources.USER)
        this.quill.format('italic', false, Quill.sources.USER)
        this.quill.format('underline', false, Quill.sources.USER)
        this.quill.format('strike', false, Quill.sources.USER)
        this.quill.format('color', false, Quill.sources.USER)
        this.quill.format('background', false, Quill.sources.USER)
        this.quill.format('link', false, Quill.sources.USER)
        this.quill.format('header', false, Quill.sources.USER)
        this.quill.format('list', false, Quill.sources.USER)
        this.quill.format('blockquote', false, Quill.sources.USER)
        this.quill.format('code-block', false, Quill.sources.USER)
      }

      editorContent.value = this.quill.root.innerHTML
      localStorage.setItem(props.storageKey, editorContent.value)
    }
  }
}))

const applyFontSize = () => {
  const quill = quillRef.value?.getQuill()
  const targetRange = quill ? getActiveFormatRange(quill) : null
  if (!quill || !targetRange) return

  const size = getCurrentFontSizeValue()

  if (targetRange.length > 0) {
    if (lastSelectionRange.value?.length) {
      beginPreview(quill, lastSelectionRange.value)
      clearHeldSelection()
      clearHeldCaret()
      quill.formatText(lastSelectionRange.value.index, lastSelectionRange.value.length, 'size', size, Quill.sources.SILENT)
      return
    }

    pendingCursorFontSize.value = null
    clearHeldSelection()
    clearHeldCaret()
    quill.formatText(targetRange.index, targetRange.length, 'size', size, Quill.sources.USER)
    saveEditorContent(quill)
    return
  }

  pendingCursorFontSize.value = size
  holdCursorCaret()
}

const commitFontSize = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill || !previewState) return

  commitPreview(quill, lastSelectionRange.value?.length ? lastSelectionRange.value : undefined)
}

const stopToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
}

const handleFontSizeKeyDown = (event: KeyboardEvent) => {
  event.stopPropagation()
  if (event.key === 'Enter') {
    commitFontSize()
  }
}

const handleToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
  holdSelectionHighlight()
  holdCursorCaret()
}

const getToolbarPickerItem = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return null
  return target.closest('.ql-color .ql-picker-item, .ql-background .ql-picker-item') as HTMLElement | null
}

const handleToolbarMouseOver = (event: MouseEvent) => {
  const item = getToolbarPickerItem(event.target)
  if (!item) return

  const format = item.closest('.ql-color') ? 'color' : 'background'
  const value = item.getAttribute('data-value') || false
  previewInlineFormat(format, value)
}

const handleToolbarMouseLeave = () => {
  if (!previewState) return
  restorePreview()
  holdSelectionHighlight()
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!wrapperRef.value?.contains(event.target as Node)) {
    restorePreview()
    clearHeldSelection()
    clearHeldCaret()
    pendingCursorFontSize.value = null
  }
}

const handleDocumentPointerMove = () => {
  if (isPointerSelecting) {
    scheduleNativeSelectionHighlight()
  }
}

const handleDocumentPointerUp = () => {
  if (isPointerSelecting) {
    isPointerSelecting = false
    scheduleNativeSelectionHighlight()
  }
}

const handleEditorPointerDown = () => {
  isPointerSelecting = true
  clearHeldCaret()
  scheduleNativeSelectionHighlight()
}

const handleSelectionChange = (event: { range: QuillSelectionRange | null }) => {
  if (!event.range) {
    if (wrapperRef.value?.contains(document.activeElement)) return
    clearHeldSelection()
    clearHeldCaret()
    return
  }

  lastSelectionRange.value = event.range
  if (event.range.length > 0) {
    clearHeldCaret()
    holdSelectionHighlight()
  } else {
    clearHeldSelection()
    clearHeldCaret()
  }

  const quill = quillRef.value?.getQuill()
  if (quill) {
    applyPendingCursorFontSize(quill, event.range)
    if (!isApplyingCursorFontSize) {
      const format = quill.getFormat(event.range.index, event.range.length)
      if (format.size) {
        const sizeText = String(format.size)
        const sizeValue = parseFloat(sizeText)
        const sizeNum = sizeText.endsWith('px')
          ? Math.round(sizeValue * 0.75)
          : Math.round(sizeValue)
        if (!isNaN(sizeNum)) currentFontSize.value = sizeNum
      }
    }
    keepCurrentFontSizeForEmptyEditor()
  }
}

onMounted(() => {
  loadContent()
  document.addEventListener('selectionchange', scheduleNativeSelectionHighlight)
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
  document.addEventListener('pointermove', handleDocumentPointerMove, true)
  document.addEventListener('pointerup', handleDocumentPointerUp, true)
})

onBeforeUnmount(() => {
  clearHeldSelection()
  if (selectionAnimationFrame !== null) {
    cancelAnimationFrame(selectionAnimationFrame)
  }
  document.removeEventListener('selectionchange', scheduleNativeSelectionHighlight)
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
  document.removeEventListener('pointermove', handleDocumentPointerMove, true)
  document.removeEventListener('pointerup', handleDocumentPointerUp, true)
})

watch(() => props.storageKey, () => {
  loadContent()
})
</script>

<template>
  <div ref="wrapperRef" class="note-quill-final-wrapper">
    <!-- Toolbar -->
    <div
      :id="'toolbar-' + safeId"
      class="custom-note-toolbar"
      @mouseover="handleToolbarMouseOver"
      @mouseleave="handleToolbarMouseLeave"
    >
      <span class="ql-formats">
        <select class="ql-header">
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option selected>P</option>
        </select>
      </span>
      
      <span class="ql-formats">
        <input 
          type="number" 
          v-model="currentFontSize" 
          @input="applyFontSize"
          @change="commitFontSize"
          @blur="commitFontSize"
          @mousedown="handleToolbarInputEvent"
          @click="handleToolbarInputEvent"
          @keydown="handleFontSizeKeyDown"
          @keyup="stopToolbarInputEvent"
          @focus="handleToolbarInputEvent"
          class="fs-input"
        />
        <span class="fs-unit">pt</span>
      </span>

      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
      </span>
      
      <span class="ql-formats">
        <select class="ql-color"></select>
        <select class="ql-background"></select>
      </span>

      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
      </span>

      <span class="ql-formats">
        <button class="ql-clean"></button>
      </span>
    </div>

    <!-- Editor -->
    <BaseQuillEditor
      ref="quillRef"
      theme="snow"
      :toolbar="toolbarOptions"
      v-model:content="editorContent"
      contentType="html"
      @pointerdown="handleEditorPointerDown"
      @update:content="onUpdate"
      @selectionChange="handleSelectionChange"
      placeholder="Ghi chú tại đây..."
    />
    <div class="held-selection-layer">
      <div
        v-for="(rect, index) in heldSelectionRects"
        :key="index"
        class="held-selection-rect"
        :style="{
          transform: `translate(${rect.left}px, ${rect.top}px)`,
          width: `${rect.width}px`,
          height: `${rect.height}px`
        }"
      />
      <div
        v-if="heldCaretRect"
        class="held-caret-rect"
        :style="{
          transform: `translate(${heldCaretRect.left}px, ${heldCaretRect.top}px)`,
          width: `${heldCaretRect.width}px`,
          height: `${heldCaretRect.height}px`
        }"
      />
    </div>
  </div>
</template>

<style lang="scss">
.note-quill-final-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  border: var(--table-border);
  background-color: #f5f5f5;

  .custom-note-toolbar {
    position: relative;
    z-index: 3;
    height: 36px;
    background-color: var(--table-header-bg-color);
    border: none;
    border-bottom: 1px solid rgba(170, 170, 170, 0.55);
    display: flex;
    align-items: center;
    padding: 0 10px;

    .ql-formats {
      margin-right: 12px;
      display: flex;
      align-items: center;
    }

    .fs-input {
      width: 54px;
      height: 22px;
      border: 1px solid #999;
      border-radius: 2px;
      font-size: 11px;
      padding: 0 4px;
    }
    .fs-unit { font-size: 11px; color: #666; margin-left: 2px; font-weight: bold; }
    
    .ql-stroke { stroke: #444; }
    .ql-fill { fill: #444; }
    .ql-picker { color: #444; font-size: 12px; }
    .ql-header.ql-picker { width: 50px; }
  }

  .ql-container.ql-snow {
    position: relative;
    z-index: 1;
    border: none !important;
    background-color: transparent !important;
    font-family: inherit;
  }

  .ql-editor {
    min-height: 150px;
    padding: 12px 15px;
    line-height: 1.6;
    color: #333;

    &::selection,
    *::selection {
      background: transparent;
      color: inherit;
    }

    &::-moz-selection,
    *::-moz-selection {
      background: transparent;
      color: inherit;
    }

    em,
    i {
      font-style: italic !important;
    }

    u {
      text-decoration: underline !important;
      text-decoration-skip-ink: none;
    }
    
    &.ql-blank::before {
      color: #999;
      font-size: 14pt;
      line-height: 1.6;
      font-style: normal;
      pointer-events: none;
    }
  }
  
  .ql-tooltip { display: none !important; }

  .held-selection-layer {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
  }

  .held-selection-rect {
    position: absolute;
    left: 0;
    top: 0;
    background-color: rgba(0, 123, 255, 0.14);
  }

  .held-caret-rect {
    position: absolute;
    left: 0;
    top: 0;
    background-color: #333;
  }
}

</style>
