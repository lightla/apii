<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

// Đăng ký Style Attributor để hỗ trợ font-size tự do (inline style)
const fontSizeStyle = Quill.import('attributors/style/size');
fontSizeStyle.whitelist = null; 
Quill.register(fontSizeStyle, true);

const quillRef = ref<any>(null)
const editorContent = ref('')
const currentFontSize = ref(14)

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

const handleSelectionChange = () => {
  const quill = quillRef.value?.getQuill()
  if (quill) {
    const format = quill.getFormat()
    if (format.size) {
      const sizeValue = String(format.size).replace('px', '')
      const size = parseInt(sizeValue)
      if (!isNaN(size)) currentFontSize.value = size
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
  <div class="note-quill-wrapper">
    <!-- Toolbar thiết kế giống Header của Table (36px) -->
    <div id="custom-toolbar">
      <span class="ql-formats">
        <select class="ql-header">
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option selected>P</option>
        </select>
      </span>
      
      <span class="ql-formats custom-size-input-wrap">
        <input 
          type="number" 
          v-model="currentFontSize" 
          @input="applyFontSize"
          @mousedown.stop 
          @keydown.stop
          class="font-size-input"
          min="8" max="100"
        />
        <span class="unit">px</span>
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
      theme="snow"
      toolbar="#custom-toolbar"
      v-model:content="editorContent"
      contentType="html"
      @update:content="onUpdate"
      @selectionChange="handleSelectionChange"
      placeholder="Bắt đầu ghi chú tại đây..."
    />
  </div>
</template>

<style lang="scss">
.note-quill-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background-color: transparent;

  #custom-toolbar {
    height: 36px; /* Khớp với Header Table */
    border: var(--table-border);
    background-color: var(--table-header-bg-color);
    padding: 0 10px;
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    box-sizing: border-box;

    .ql-formats {
      margin-right: 12px;
      display: flex;
      align-items: center;
      padding: 0;
      border: none;
      
      &:last-child { margin-right: 0; }
    }

    .custom-size-input-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      .unit { font-size: 11px; color: #666; font-weight: 600; }
    }

    .font-size-input {
      width: 42px;
      height: 22px;
      border: 1px solid #999;
      border-radius: 2px;
      padding: 0 4px;
      font-size: 11px;
      background: white;
      outline: none;
    }

    /* Đưa các icon về màu xám giống table header */
    .ql-stroke { stroke: #444; }
    .ql-fill { fill: #444; }
    .ql-picker { color: #444; font-size: 12px; font-weight: 500; }
    
    .ql-header.ql-picker { width: 50px; }
    .ql-color.ql-picker, .ql-background.ql-picker { width: 28px; }
  }

  .ql-container.ql-snow {
    border: var(--table-border) !important;
    border-top: none !important;
    background-color: #f5f5f5 !important; /* Giống màu nền các tab */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .ql-editor {
    min-height: 180px;
    padding: 10px 15px;
    font-size: 14px;
    line-height: 1.6;
    color: #333;
    
    &.ql-blank::before {
      color: #999;
      font-style: normal;
      left: 15px;
    }

    em, i { font-style: italic !important; }
    ol { padding-left: 1.5em !important; list-style-type: decimal !important; }
    ul { padding-left: 1.5em !important; list-style-type: disc !important; }
    li { padding-left: 0.3em !important; }
  }
}
</style>
