<template>
  <div ref="editorHolder" class="editorjs-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CodeTool from '@editorjs/code'
import InlineCode from '@editorjs/inline-code'
import Table from '@editorjs/table'
import ColorPlugin from 'editorjs-text-color-plugin'
import DragDrop from "editorjs-drag-drop";
import CodeMirror from 'editorjs-codemirror'

// 🔥 SỬA 1: Định nghĩa props để nhận 'storageKey' từ component cha
const props = defineProps({
  storageKey: {
    type: String,
    required: true
  }
})

const editorHolder = ref(null)
let editorInstance = null

// --- CÁC HÀM XỬ LÝ DỮ LIỆU ---

// Tải dữ liệu từ localStorage dựa trên key được cung cấp.
function loadData() {
  if (!props.storageKey) return getDefaultData(); // An toàn nếu không có key
  const savedData = localStorage.getItem(props.storageKey);
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (error) {
      console.error(`EditorJS: Lỗi parse dữ liệu cho key "${props.storageKey}"`, error);
      return getDefaultData();
    }
  }
  return getDefaultData();
}

// Trả về dữ liệu mặc định khi không có gì trong localStorage.
function getDefaultData() {
  return {
    blocks: [
      { type: 'header', data: { text: 'Bắt đầu ghi chú...', level: 2 } },
      { type: 'paragraph', data: { text: 'Nội dung của bạn sẽ được tự động lưu vào đây.' } }
    ]
  }
}

// Khởi tạo editor.
function initializeEditor() {
  if (editorInstance) {
    editorInstance.destroy();
    editorInstance = null;
  }

  if (!editorHolder.value) return;

  editorInstance = new EditorJS({
    holder: editorHolder.value,
    autofocus: true,

    // 🔥 SỬA 2: Tải dữ liệu ngay khi khởi tạo
    data: loadData(),

    // 🔥 SỬA 3: Tự động lưu mỗi khi nội dung thay đổi.
    onChange: async (api) => {
      if (!props.storageKey) return;
      const savedData = await api.saver.save();
      localStorage.setItem(props.storageKey, JSON.stringify(savedData));
    },

    onReady: () => {
      new DragDrop(editorInstance);
    },

    // Các tool của bạn (giữ nguyên)
    tools: {
      header: { class: Header, inlineToolbar: ['Color', 'Marker', 'bold', 'italic'] },
      list: { class: List, inlineToolbar: true },
      codeMirror: {
        class: CodeMirror,
        config: {
          languages: [
            { name: 'Javascript', mode: "text/javascript" }, { name: 'HTML', mode: "text/html" },
            { name: 'CSS', mode: "text/css" }, { name: 'Shell', mode: "application/x-sh" },
            { name: 'JSX', mode: "text/typescript-jsx" }, { name: 'Vue', mode: "text/x-vue" },
            { name: 'MarkDown', mode: "text/x-markdown" }, { name: 'SASS', mode: "text/x-sass" }
          ],
          codeMirrorConfig: {
            tabSize: 2, fontSize: 12, styleActiveLine: { nonEmpty: true }, styleActiveSelected: true,
            line: false, foldGutter: true, autofocus: true, styleSelectedText: true,
            showCursorWhenSelecting: true, dragDrop: true, lint: true, theme: 'default',
            extraKeys: { 'Ctrl': 'autocomplete' }, hintOptions: { completeSingle: false },
            lineNumbers: true, matchBrackets: true, autoCloseTags: true, keyMap: "sublime",
          }
        }
      },
      inlineCode: InlineCode,
      table: Table,
      Color: {
        class: ColorPlugin,
        config: {
          colorCollections: ['#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4','#00BCD4','#4CAF50','#8BC34A','#CDDC39','#FFF'],
          defaultColor: '#FF1300', type: 'text',
        }
      },
      Marker: {
        class: ColorPlugin,
        config: { defaultColor: '#FFBF00', type: 'marker' }
      },
    },
  })
}

// --- VÒNG ĐỜI COMPONENT (LIFECYCLE) ---

onMounted(() => {
  initializeEditor();
})

onBeforeUnmount(() => {
  if (editorInstance?.destroy) {
    editorInstance.destroy();
    editorInstance = null;
  }
})

// 🔥 SỬA 4: Theo dõi sự thay đổi của storageKey.
// Nếu key thay đổi (ví dụ: người dùng click sang route khác),
// chúng ta phải khởi tạo lại editor với nội dung mới.
watch(() => props.storageKey, (newKey, oldKey) => {
  if (newKey !== oldKey) {
    initializeEditor();
  }
})
</script>

<style scoped>
.editorjs-container {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
  min-height: 480px; /* Đảm bảo có chiều cao tối thiểu */
}
.custom-drag-icon.visible {
  opacity: 1;
}
.custom-context-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  z-index: 10;
}
.custom-context-menu button {
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 4px 8px;
  text-align: left;
  cursor: pointer;
}
.custom-context-menu button:hover {
  background: #f5f5f5;
}
</style>
