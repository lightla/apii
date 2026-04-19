<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

const Size = Quill.import('attributors/style/size')
Size.whitelist = null
Quill.register(Size, true)
const Delta = Quill.import('delta')

type QuillSelectionRange = {
  index: number
  length: number
}

type FormatPreviewState = {
  range: QuillSelectionRange
  selectionRange: QuillSelectionRange
  contents: any
  format: PreviewFormat
  value: string | boolean
  previousFontSize: number
}

type PreviewFormat = 'color' | 'background' | 'size'

const quillRef = ref<any>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const editorContent = ref('')
const currentFontSize = ref(14)
const fontSizeInput = ref('14')
const lastSelectionRange = ref<QuillSelectionRange | null>(null)
const isFormatPreviewing = ref(false)
const isFontSizePickerOpen = ref(false)
let formatPreviewState: FormatPreviewState | null = null
let isPreviewMutating = false
const isSelectionSuppressed = computed(() => isFormatPreviewing.value || isFontSizePickerOpen.value)

const fontSizeOptions = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72]

const textColors = [
  '#000000', '#444444', '#666666', '#999999', '#cccccc', '#ffffff',
  '#e03131', '#f08c00', '#f59f00', '#2f9e44', '#0ca678', '#1971c2',
  '#364fc7', '#6741d9', '#9c36b5', '#c2255c',
  '#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#38d9a9', '#4dabf7',
  '#748ffc', '#9775fa', '#da77f2', '#f783ac'
]

const backgroundColors = [
  '#ffffff', '#f1f3f5', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd',
  '#ffe3e3', '#fff4e6', '#fff9db', '#ebfbee', '#e6fcf5', '#e7f5ff',
  '#edf2ff', '#f3f0ff', '#f8f0fc', '#fff0f6',
  '#ffc9c9', '#ffd8a8', '#ffec99', '#b2f2bb', '#96f2d7', '#a5d8ff',
  '#bac8ff', '#d0bfff', '#eebefa', '#fcc2d7'
]

const loadContent = () => {
  editorContent.value = localStorage.getItem(props.storageKey) || ''
}

const getCurrentFontSizeValue = () => `${currentFontSize.value}pt`

const saveEditorContent = (quill: any) => {
  editorContent.value = quill.root.innerHTML
  localStorage.setItem(props.storageKey, editorContent.value)
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
  const range = quill.getSelection() || lastSelectionRange.value
  if (!range) return null

  return range.length > 0 ? range : getCurrentLineRange(quill, range)
}

const isSameRange = (first: QuillSelectionRange, second: QuillSelectionRange) => {
  return first.index === second.index && first.length === second.length
}

const syncFontSizeFromValue = (value: string | boolean) => {
  if (typeof value !== 'string') return

  const sizeValue = parseFloat(value)
  if (!isNaN(sizeValue)) {
    currentFontSize.value = Math.round(sizeValue)
    fontSizeInput.value = String(Math.round(sizeValue))
  }
}

const restoreFormatPreview = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill || !formatPreviewState) return

  const { range, selectionRange, contents, previousFontSize } = formatPreviewState
  isPreviewMutating = true
  try {
    quill.updateContents(
      new Delta().retain(range.index).delete(range.length).concat(contents),
      Quill.sources.SILENT
    )
    quill.setSelection(selectionRange.index, selectionRange.length, Quill.sources.SILENT)
  } finally {
    isPreviewMutating = false
  }
  formatPreviewState = null
  currentFontSize.value = previousFontSize
  fontSizeInput.value = String(previousFontSize)
  isFormatPreviewing.value = false
}

const beginFormatPreview = (
  quill: any,
  range: QuillSelectionRange,
  selectionRange: QuillSelectionRange,
  format: PreviewFormat,
  value: string | boolean
) => {
  if (range.length === 0) return

  const previousFontSize = formatPreviewState?.previousFontSize ?? currentFontSize.value
  if (formatPreviewState) {
    const { range: previewRange, contents } = formatPreviewState
    isPreviewMutating = true
    try {
      quill.updateContents(
        new Delta().retain(previewRange.index).delete(previewRange.length).concat(contents),
        Quill.sources.SILENT
      )
      quill.setSelection(
        formatPreviewState.selectionRange.index,
        formatPreviewState.selectionRange.length,
        Quill.sources.SILENT
      )
    } finally {
      isPreviewMutating = false
    }
  }

  formatPreviewState = {
    range: { ...range },
    selectionRange: { ...selectionRange },
    contents: quill.getContents(range.index, range.length),
    format,
    value,
    previousFontSize
  }
  isFormatPreviewing.value = true
  if (format === 'size') {
    syncFontSizeFromValue(value)
  }

  isPreviewMutating = true
  try {
    quill.formatText(range.index, range.length, format, value, Quill.sources.SILENT)
    quill.setSelection(selectionRange.index, selectionRange.length, Quill.sources.SILENT)
  } finally {
    isPreviewMutating = false
  }
}

const commitFormatPreview = (quill: any, selectionRange: QuillSelectionRange) => {
  if (formatPreviewState?.format === 'size') {
    syncFontSizeFromValue(formatPreviewState.value)
  }
  formatPreviewState = null
  isFormatPreviewing.value = false
  saveEditorContent(quill)
  quill.setSelection(selectionRange.index, selectionRange.length, Quill.sources.SILENT)
}

const closeToolbarPickers = () => {
  toolbarRef.value
    ?.querySelectorAll('.ql-picker.ql-expanded')
    .forEach(picker => picker.classList.remove('ql-expanded'))
}

const toggleInlineFormat = (quill: any, format: 'bold' | 'italic' | 'underline') => {
  const range = quill.getSelection() || lastSelectionRange.value
  if (!range) return

  const currentFormat = quill.getFormat(range.index, range.length)
  const nextValue = !currentFormat[format]

  if (range.length > 0) {
    quill.format(format, nextValue, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    saveEditorContent(quill)
    return
  }

  const lineRange = getCurrentLineRange(quill, range)
  if (lineRange.length > 0) {
    quill.formatText(lineRange.index, lineRange.length, format, nextValue, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    saveEditorContent(quill)
    return
  }

  quill.format(format, nextValue, Quill.sources.USER)
}

const applyInlineFormat = (quill: any, format: PreviewFormat, value: string | boolean) => {
  const range = quill.getSelection() || lastSelectionRange.value
  if (!range) return

  const targetRange = range.length > 0 ? range : getCurrentLineRange(quill, range)

  if (
    formatPreviewState &&
    formatPreviewState.format === format &&
    formatPreviewState.value === value &&
    isSameRange(formatPreviewState.range, targetRange)
  ) {
    commitFormatPreview(quill, range)
    return
  }

  restoreFormatPreview()

  if (range.length > 0) {
    quill.format(format, value, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    if (format === 'size') {
      syncFontSizeFromValue(value)
    }
    saveEditorContent(quill)
    return
  }

  const lineRange = getCurrentLineRange(quill, range)
  if (lineRange.length > 0) {
    quill.formatText(lineRange.index, lineRange.length, format, value, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    if (format === 'size') {
      syncFontSizeFromValue(value)
    }
    saveEditorContent(quill)
    return
  }

  quill.format(format, value, Quill.sources.USER)
  if (format === 'size') {
    syncFontSizeFromValue(value)
  }
}

const keepCurrentFontSizeForEmptyEditor = (quill: any) => {
  if (quill.getLength() > 1) return

  const range = quill.getSelection()
  if (!range) return

  quill.format('size', getCurrentFontSizeValue(), Quill.sources.SILENT)
}

const toolbarOptions = computed(() => ({
  container: `#toolbar-${props.storageKey}`,
  handlers: {
    color(this: { quill: any }, value: string) {
      applyInlineFormat(this.quill, 'color', value || false)
    },
    background(this: { quill: any }, value: string) {
      applyInlineFormat(this.quill, 'background', value || false)
    },
    bold(this: { quill: any }) {
      toggleInlineFormat(this.quill, 'bold')
    },
    italic(this: { quill: any }) {
      toggleInlineFormat(this.quill, 'italic')
    },
    underline(this: { quill: any }) {
      toggleInlineFormat(this.quill, 'underline')
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

      saveEditorContent(this.quill)
    }
  }
}))

const stopToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
}

const handleFontSizeInput = (event: Event) => {
  event.stopPropagation()
  restoreFormatPreview()
  const input = event.target as HTMLInputElement
  fontSizeInput.value = input.value
}

const applyTypedFontSize = () => {
  const size = parseFloat(fontSizeInput.value)
  if (isNaN(size) || size <= 0) {
    fontSizeInput.value = String(currentFontSize.value)
    return
  }

  const quill = quillRef.value?.getQuill()
  if (!quill) return

  applyInlineFormat(quill, 'size', `${Math.round(size)}pt`)
  isFontSizePickerOpen.value = false
}

const handleToolbarKeyDown = (event: KeyboardEvent) => {
  event.stopPropagation()
  if (event.key === 'Enter') {
    applyTypedFontSize()
    return
  }
  if (event.key === 'Escape') {
    restoreFormatPreview()
    fontSizeInput.value = String(currentFontSize.value)
    isFontSizePickerOpen.value = false
  }
}

const getToolbarPreviewItem = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return null

  return target.closest('.ql-color .ql-picker-item, .ql-background .ql-picker-item, .fs-picker-option') as HTMLElement | null
}

const resolvePreviewFormat = (item: HTMLElement): PreviewFormat => {
  if (item.classList.contains('fs-picker-option')) return 'size'
  return item.closest('.ql-color') ? 'color' : 'background'
}

const resolvePreviewValue = (item: HTMLElement) => {
  if (item.classList.contains('fs-picker-option')) {
    return `${item.dataset.size}pt`
  }

  return item.getAttribute('data-value') || false
}

const toggleFontSizePicker = (event: MouseEvent) => {
  event.stopPropagation()
  isFontSizePickerOpen.value = !isFontSizePickerOpen.value
}

const handleToolbarMouseOver = (event: MouseEvent) => {
  const item = getToolbarPreviewItem(event.target)
  if (!item) return

  const quill = quillRef.value?.getQuill()
  if (!quill) return

  const selectionRange = formatPreviewState?.selectionRange || lastSelectionRange.value
  if (!selectionRange) return

  const range = formatPreviewState?.range || (selectionRange.length > 0
    ? selectionRange
    : getCurrentLineRange(quill, selectionRange))
  if (range.length === 0) return

  const format = resolvePreviewFormat(item)
  const value = resolvePreviewValue(item)
  beginFormatPreview(quill, range, selectionRange, format, value)
}

const handleToolbarMouseLeave = () => {
  restoreFormatPreview()
}

const handleToolbarClick = (event: MouseEvent) => {
  const item = getToolbarPreviewItem(event.target)
  if (!item) return

  const quill = quillRef.value?.getQuill()
  if (!quill) return

  if (formatPreviewState) {
    commitFormatPreview(quill, formatPreviewState.selectionRange)
  } else {
    const format = resolvePreviewFormat(item)
    const value = resolvePreviewValue(item)
    applyInlineFormat(quill, format, value)
  }

  closeToolbarPickers()
  isFontSizePickerOpen.value = false
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (toolbarRef.value?.contains(event.target as Node)) return
  restoreFormatPreview()
  isFontSizePickerOpen.value = false
}

const handleSelectionChange = (event: { range: QuillSelectionRange | null }) => {
  if (isPreviewMutating) return
  if (!event.range) return

  lastSelectionRange.value = event.range
  const quill = quillRef.value?.getQuill()
  if (!quill) return

  const format = quill.getFormat(event.range.index, event.range.length)
  if (format.size) {
    const sizeText = String(format.size)
    const sizeValue = parseFloat(sizeText)
    const sizeNum = sizeText.endsWith('px')
      ? Math.round(sizeValue * 0.75)
      : Math.round(sizeValue)
    if (!isNaN(sizeNum)) currentFontSize.value = sizeNum
    if (!isNaN(sizeNum)) fontSizeInput.value = String(sizeNum)
  }

  keepCurrentFontSizeForEmptyEditor(quill)
}

const onUpdate = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill) return

  saveEditorContent(quill)
  keepCurrentFontSizeForEmptyEditor(quill)
}

onMounted(() => {
  loadContent()
  document.addEventListener('pointerdown', handleDocumentPointerDown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleDocumentPointerDown, true)
})

watch(() => props.storageKey, () => {
  restoreFormatPreview()
  fontSizeInput.value = String(currentFontSize.value)
  loadContent()
})
</script>

<template>
  <div
    class="note-quill-final-wrapper"
    :class="{ 'is-format-previewing': isSelectionSuppressed }"
  >
    <div
      :id="'toolbar-' + props.storageKey"
      ref="toolbarRef"
      class="custom-note-toolbar"
      @mouseover="handleToolbarMouseOver"
      @click="handleToolbarClick"
      @mouseleave="handleToolbarMouseLeave"
    >
      <span class="ql-formats">
        <select class="ql-header">
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option selected>P</option>
        </select>
      </span>

      <span class="ql-formats fs-picker">
        <div class="fs-picker-control">
          <input
            :value="fontSizeInput"
            type="text"
            inputmode="numeric"
            class="fs-picker-input"
            @mousedown="stopToolbarInputEvent"
            @input="handleFontSizeInput"
            @keydown="handleToolbarKeyDown"
          />
          <button
            type="button"
            class="fs-picker-toggle"
            @mousedown="stopToolbarInputEvent"
            @click="toggleFontSizePicker"
          >
            <span class="fs-picker-caret"></span>
          </button>
        </div>
        <div
          v-if="isFontSizePickerOpen"
          class="fs-picker-menu"
        >
          <button
            v-for="size in fontSizeOptions"
            :key="size"
            type="button"
            class="fs-picker-option"
            :class="{ 'is-active': currentFontSize === size }"
            :data-size="size"
          >
            {{ size }}pt
          </button>
        </div>
      </span>

      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
      </span>

      <span class="ql-formats">
        <select class="ql-color">
          <option selected></option>
          <option
            v-for="color in textColors"
            :key="color"
            :value="color"
          ></option>
        </select>
        <select class="ql-background">
          <option selected></option>
          <option
            v-for="color in backgroundColors"
            :key="color"
            :value="color"
          ></option>
        </select>
      </span>

      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
      </span>

      <span class="ql-formats">
        <button class="ql-clean"></button>
      </span>
    </div>

    <BaseQuillEditor
      ref="quillRef"
      v-model:content="editorContent"
      theme="snow"
      :toolbar="toolbarOptions"
      contentType="html"
      placeholder="Ghi chú tại đây..."
      @update:content="onUpdate"
      @selectionChange="handleSelectionChange"
    />
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

    .fs-picker {
      position: relative;
    }

    .fs-picker-control {
      display: flex;
      align-items: center;
      width: 66px;
      height: 24px;
      border: 1px solid #999;
      border-radius: 2px;
      background: #fff;
      overflow: hidden;
    }

    .fs-picker-input {
      width: 100%;
      height: 100%;
      border: 0;
      outline: none;
      color: #333;
      font-size: 12px;
      line-height: 22px;
      padding: 0 6px;
      text-align: left;
      background: transparent;
    }

    .fs-picker-toggle {
      width: 18px;
      height: 100%;
      border: 0;
      border-left: 1px solid #bbb;
      border-radius: 0;
      background: #f6f6f6;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fs-picker-caret {
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 5px solid #555;
    }

    .fs-picker-menu {
      position: absolute;
      left: 0;
      top: 28px;
      z-index: 10;
      width: 82px;
      max-height: 240px;
      overflow-y: auto;
      background: #fff;
      border: 1px solid #999;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
      padding: 3px 0;
    }

    .fs-picker-option {
      display: block;
      width: 100%;
      height: 24px;
      border: 0;
      border-radius: 0;
      background: #fff;
      color: #333;
      font-size: 12px;
      line-height: 24px;
      padding: 0 8px;
      text-align: left;
    }

    .fs-picker-option:hover,
    .fs-picker-option.is-active {
      background: #e9ecef;
    }

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
      background: rgba(120, 120, 120, 0.28);
      color: inherit;
    }

    &::-moz-selection,
    *::-moz-selection {
      background: rgba(120, 120, 120, 0.28);
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

  &.is-format-previewing {
    .ql-editor {
      caret-color: transparent;

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
    }
  }
}
</style>
