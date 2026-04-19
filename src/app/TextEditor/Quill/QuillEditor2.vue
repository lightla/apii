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
  format: 'color' | 'background'
  value: string | boolean
}

const quillRef = ref<any>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const editorContent = ref('')
const currentFontSize = ref(14)
const lastSelectionRange = ref<QuillSelectionRange | null>(null)
let formatPreviewState: FormatPreviewState | null = null
let isPreviewMutating = false

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

const restoreFormatPreview = () => {
  const quill = quillRef.value?.getQuill()
  if (!quill || !formatPreviewState) return

  const { range, selectionRange, contents } = formatPreviewState
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
}

const beginFormatPreview = (
  quill: any,
  range: QuillSelectionRange,
  selectionRange: QuillSelectionRange,
  format: 'color' | 'background',
  value: string | boolean
) => {
  if (range.length === 0) return

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
    value
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
  formatPreviewState = null
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

const applyInlineFormat = (quill: any, format: 'color' | 'background', value: string | boolean) => {
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
    saveEditorContent(quill)
    return
  }

  const lineRange = getCurrentLineRange(quill, range)
  if (lineRange.length > 0) {
    quill.formatText(lineRange.index, lineRange.length, format, value, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    saveEditorContent(quill)
    return
  }

  quill.format(format, value, Quill.sources.USER)
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

const applyFontSize = () => {
  const quill = quillRef.value?.getQuill()
  const range = lastSelectionRange.value
  if (!quill || !range) return

  const size = getCurrentFontSizeValue()

  if (range.length > 0) {
    quill.formatText(range.index, range.length, 'size', size, Quill.sources.USER)
    quill.setSelection(range.index, range.length, Quill.sources.SILENT)
    saveEditorContent(quill)
    return
  }

  const activeRange = quill.getSelection()
  if (activeRange && activeRange.index === range.index && activeRange.length === 0) {
    quill.format('size', size, Quill.sources.USER)
  }
}

const stopToolbarInputEvent = (event: Event) => {
  event.stopPropagation()
}

const handleFontSizeKeyDown = (event: KeyboardEvent) => {
  event.stopPropagation()
}

const getToolbarColorItem = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return null

  return target.closest('.ql-color .ql-picker-item, .ql-background .ql-picker-item') as HTMLElement | null
}

const handleToolbarMouseOver = (event: MouseEvent) => {
  const item = getToolbarColorItem(event.target)
  if (!item) return

  const quill = quillRef.value?.getQuill()
  if (!quill) return

  const selectionRange = formatPreviewState?.selectionRange || lastSelectionRange.value
  if (!selectionRange) return

  const range = formatPreviewState?.range || (selectionRange.length > 0
    ? selectionRange
    : getCurrentLineRange(quill, selectionRange))
  if (range.length === 0) return

  const format = item.closest('.ql-color') ? 'color' : 'background'
  const value = item.getAttribute('data-value') || false
  beginFormatPreview(quill, range, selectionRange, format, value)
}

const handleToolbarMouseLeave = () => {
  restoreFormatPreview()
}

const handleToolbarClick = (event: MouseEvent) => {
  const item = getToolbarColorItem(event.target)
  if (!item) return

  const quill = quillRef.value?.getQuill()
  if (!quill) return

  if (formatPreviewState) {
    commitFormatPreview(quill, formatPreviewState.selectionRange)
  } else {
    const format = item.closest('.ql-color') ? 'color' : 'background'
    const value = item.getAttribute('data-value') || false
    applyInlineFormat(quill, format, value)
  }

  closeToolbarPickers()
}

const handleDocumentPointerDown = (event: PointerEvent) => {
  if (toolbarRef.value?.contains(event.target as Node)) return
  restoreFormatPreview()
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
  loadContent()
})
</script>

<template>
  <div class="note-quill-final-wrapper">
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

      <span class="ql-formats">
        <input
          v-model="currentFontSize"
          type="number"
          class="fs-input"
          @input="applyFontSize"
          @mousedown="stopToolbarInputEvent"
          @click="stopToolbarInputEvent"
          @keydown="handleFontSizeKeyDown"
          @keyup="stopToolbarInputEvent"
          @focus="stopToolbarInputEvent"
        />
        <span class="fs-unit">pt</span>
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

    .fs-input {
      width: 54px;
      height: 22px;
      border: 1px solid #999;
      border-radius: 2px;
      font-size: 11px;
      padding: 0 4px;
    }

    .fs-unit {
      font-size: 11px;
      color: #666;
      margin-left: 2px;
      font-weight: bold;
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
}
</style>
