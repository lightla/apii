<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

// Đăng ký Style để dùng px thay vì class
const Size = Quill.import('attributors/style/size');
Size.whitelist = null; 
Quill.register(Size, true);

const quillRef = ref<any>(null)
const editorContent = ref('')
const currentFontSize = ref(14)

type QuillSelectionRange = {
  index: number
  length: number
}

const loadContent = () => {
  editorContent.value = localStorage.getItem(props.storageKey) || ''
}

const onUpdate = () => {
  localStorage.setItem(props.storageKey, editorContent.value)
}

const applyFontSize = () => {
  const quill = quillRef.value?.getQuill()
  if (quill) {
    quill.format('size', `${currentFontSize.value}px`)
  }
}

const handleSelectionChange = (event: { range: QuillSelectionRange | null }) => {
  if (!event.range) {
    return
  }

  const quill = quillRef.value?.getQuill()
  if (quill) {
    const format = quill.getFormat(event.range.index, event.range.length)
    if (format.size) {
      const sizeStr = String(format.size).replace('px', '')
      const sizeNum = parseInt(sizeStr)
      if (!isNaN(sizeNum)) currentFontSize.value = sizeNum
    }
  }
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
          @mousedown.stop 
          @keydown.stop
          class="fs-input"
        />
        <span class="fs-unit">px</span>
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
    </div>

    <!-- Editor -->
    <BaseQuillEditor
      ref="quillRef"
      theme="snow"
      :toolbar="'#toolbar-' + props.storageKey"
      v-model:content="editorContent"
      contentType="html"
      @update:content="onUpdate"
      @selectionChange="handleSelectionChange"
      placeholder="Ghi chú tại đây..."
    />
  </div>
</template>

<style lang="scss">
.note-quill-final-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: var(--table-border);
  background-color: #f5f5f5;

  .custom-note-toolbar {
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
      width: 42px;
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
    border: none !important;
    background-color: transparent !important;
    font-family: inherit;
  }

  .ql-editor {
    min-height: 150px;
    padding: 12px 15px;
    line-height: 1.6;
    color: #333;
    
    &.ql-blank::before {
      color: #999;
      font-style: normal;
      pointer-events: none;
    }
  }
  
  .ql-tooltip { display: none !important; }
}
</style>
