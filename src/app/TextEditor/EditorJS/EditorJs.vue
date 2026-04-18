<!-- File: src/app/TextEditor/EditorJS/EditorJs.vue -->
<template>
  <div ref="editorHolder"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CodeTool from '@editorjs/code' // Mặc dù không dùng trực tiếp, giữ lại để tham khảo nếu cần
import InlineCode from '@editorjs/inline-code'
import Table from '@editorjs/table'
import ColorPlugin from 'editorjs-text-color-plugin'
import DragDrop from "editorjs-drag-drop";
import CodeMirror from 'editorjs-codemirror'

// 1. IMPORT PLUGIN MỚI
import Button from 'editorjs-button'

const props = defineProps({
  storageKey: {
    type: String,
    required: true
  }
})

const editorHolder = ref(null)
let editorInstance = null

function loadData() {
  if (!props.storageKey) return getDefaultData();
  const savedData = localStorage.getItem(props.storageKey);
  if (savedData) {
    try { return JSON.parse(savedData); }
    catch (error) {
      console.error(`EditorJS: Lỗi parse dữ liệu cho key "${props.storageKey}"`, error);
      return getDefaultData();
    }
  }
  return getDefaultData();
}

function getDefaultData() {
  return {
    blocks: [
      { type: 'header', data: { text: 'Bắt đầu ghi chú...', level: 2 } },
      { type: 'paragraph', data: { text: 'Nội dung của bạn sẽ được tự động lưu vào đây.' } }
    ]
  }
}

function initializeEditor() {
  if (editorInstance) {
    editorInstance.destroy();
    editorInstance = null;
  }

  if (!editorHolder.value) return;

  editorInstance = new EditorJS({
    holder: editorHolder.value,
    autofocus: true,
    data: loadData(),
    onChange: async (api) => {
      if (!props.storageKey) return;
      const savedData = await api.saver.save();
      localStorage.setItem(props.storageKey, JSON.stringify(savedData));
    },
    onReady: () => {
      new DragDrop(editorInstance);
    },
    tools: {
      // 2. THÊM CÔNG CỤ 'button' VÀO ĐẦU DANH SÁCH
      // Plugin này sẽ tự động vô hiệu hóa menu lệnh gạch chéo (/)
      button: {
        class: Button,
        // Đặt shortcut thành một tổ hợp phím khó bấm để người dùng không vô tình kích hoạt
        shortcut: 'CMD+SHIFT+B'
      },
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

onMounted(() => {
  initializeEditor();
})

onBeforeUnmount(() => {
  if (editorInstance?.destroy) {
    editorInstance.destroy();
    editorInstance = null;
  }
})

watch(() => props.storageKey, (newKey, oldKey) => {
  if (newKey !== oldKey) {
    initializeEditor();
  }
})
</script>

<!-- 3. KHÔNG CẦN THÊM BẤT KỲ CSS NÀO Ở ĐÂY -->
<!-- Plugin đã tự xử lý giao diện và vị trí của menu -->
