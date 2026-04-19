<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Quill, QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'

const props = defineProps<{
  storageKey: string
}>()

// Đăng ký Style Attributor để hỗ trợ font-size tự do (inline style)
const fontSizeStyle = Quill.import('attributors/style/size');
fontSizeStyle.whitelist = null; // Cho phép mọi giá trị
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

// Hàm áp dụng cỡ chữ
const applyFontSize = () => {
  const quill = quillRef.value?.getQuill()
  if (quill) {
    quill.format('size', `${currentFontSize.value}px`)
  }
}

// Đồng bộ ô số khi người dùng chọn đoạn văn bản khác
const handleSelectionChange = () => {
  const quill = quillRef.value?.getQuill()
  if (quill) {
    const format = quill.getFormat()
    if (format.size) {
      const sizeValue = String(format.size).replace('px', '')
      const size = parseInt(sizeValue)
      if (!isNaN(size)) {
        currentFontSize.value = size
      }
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
    <div id="custom-toolbar">
      <span class="ql-formats">
        <select class="ql-header">
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
          <option selected>P</option>
        </select>
      </span>
      
      <!-- Ô NHẬP SỐ - ĐÃ FIX LỖI ĐƠ -->
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
  background-color: transparent !important;

  #custom-toolbar {
    border: none;
    border-bottom: 1px solid #dee2e6;
    background-color: rgba(0, 0, 0, 0.02);
    padding: 4px 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;

    .ql-formats {
      margin-right: 10px;
      display: flex;
      align-items: center;
      padding: 0;
      border: none;
    }

    .custom-size-input-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      .unit { font-size: 11px; color: #888; font-weight: bold; }
    }

    .font-size-input {
      width: 48px;
      height: 24px;
      border: 1px solid #bbb;
      border-radius: 3px;
      padding: 0 4px;
      font-size: 12px;
      background: white;
      color: #333;
      outline: none;
      &:focus { border-color: #007bff; }
    }

    /* Thu nhỏ các dropdown mặc định của Quill */
    .ql-header.ql-picker { width: 55px; }
    .ql-color.ql-picker, .ql-background.ql-picker { width: 28px; }
  }

  .ql-container.ql-snow {
    border: none !important;
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .ql-editor {
    min-height: 180px;
    background-color: transparent !important;
    padding: 15px;
    font-size: 14px;
    line-height: 1.6;
    
    &.ql-blank::before {
      color: #aaa;
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
