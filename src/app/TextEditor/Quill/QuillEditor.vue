<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

// Đăng ký Style để dùng pt thay vì class
const Size = Quill.import('attributors/style/size');
Size.whitelist = null; 
Quill.register(Size, true);
const Delta = Quill.import('delta');

const quillRef = ref<any>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const editorContent = ref('')
const currentFontSize = ref(14)
const lastSelectionRange = ref<QuillSelectionRange | null>(null)
const heldSelectionRects = ref<HeldSelectionRect[]>([])
let selectionAnimationFrame: number | null = null
let isPointerSelecting = false

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

const loadContent = () => {
  editorContent.value = localStorage.getItem(props.storageKey) || ''
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
  clearHeldSelection()
  const quill = quillRef.value?.getQuill()
  if (quill) {
    editorContent.value = quill.root.innerHTML
  }
  localStorage.setItem(props.storageKey, editorContent.value)
}

const toolbarOptions = computed(() => ({
  container: `#toolbar-${props.storageKey}`,
  handlers: {
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
  if (quill && lastSelectionRange.value) {
    const range = lastSelectionRange.value
    const size = `${currentFontSize.value}pt`

    clearHeldSelection()
    if (range.length > 0) {
      quill.formatText(range.index, range.length, 'size', size, Quill.sources.USER)
    } else {
      quill.formatText(range.index, 1, 'size', size, Quill.sources.USER)
    }

    editorContent.value = quill.root.innerHTML
    localStorage.setItem(props.storageKey, editorContent.value)
    holdSelectionHighlight()
  }
}

const stopToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
}

const handleToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
  holdSelectionHighlight()
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (!wrapperRef.value?.contains(event.target as Node)) {
    clearHeldSelection()
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
  scheduleNativeSelectionHighlight()
}

const handleSelectionChange = (event: { range: QuillSelectionRange | null }) => {
  if (!event.range) {
    clearHeldSelection()
    return
  }

  lastSelectionRange.value = event.range
  if (event.range.length > 0) {
    holdSelectionHighlight()
  } else {
    clearHeldSelection()
  }

  const quill = quillRef.value?.getQuill()
  if (quill) {
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
    <div :id="'toolbar-' + props.storageKey" class="custom-note-toolbar">
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
          @mousedown="handleToolbarInputEvent"
          @click="handleToolbarInputEvent"
          @keydown="stopToolbarInputEvent"
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
    border-bottom: var(--table-border);
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
}

</style>
