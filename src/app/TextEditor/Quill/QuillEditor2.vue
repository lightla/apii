<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
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

const quillRef = ref<any>(null)
const editorContent = ref('')
const currentFontSize = ref(14)
const lastSelectionRange = ref<QuillSelectionRange | null>(null)

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

const keepCurrentFontSizeForEmptyEditor = (quill: any) => {
  if (quill.getLength() > 1) return

  const range = quill.getSelection()
  if (!range) return

  quill.format('size', getCurrentFontSizeValue(), Quill.sources.SILENT)
}

const toolbarOptions = computed(() => ({
  container: `#toolbar-${props.storageKey}`,
  handlers: {
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

const handleSelectionChange = (event: { range: QuillSelectionRange | null }) => {
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
})

watch(() => props.storageKey, () => {
  loadContent()
})
</script>

<template>
  <div class="note-quill-final-wrapper">
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
