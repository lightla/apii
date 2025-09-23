<template>
  <div ref="editorHolder" class="editorjs-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import CodeTool from '@editorjs/code'
import InlineCode from '@editorjs/inline-code'
import Table from '@editorjs/table'
import ColorPlugin from 'editorjs-text-color-plugin'
import DragDrop from "editorjs-drag-drop";
import CodeMirror from 'editorjs-codemirror'

const editorHolder = ref(null)
let editorInstance = null

onMounted(() => {
  editorInstance = new EditorJS({
    onReady: () => {
      new DragDrop(editorInstance, '1px solid black');
    },
    holder: editorHolder.value,
    autofocus: true,
    tools: {
      header: { class: Header, inlineToolbar: ['Color', 'Marker', 'bold', 'italic'] },
      list: { class: List, inlineToolbar: true },
      codeMirror: {
        class: CodeMirror,
        config: {
          languages: [
            {
              name: 'Javascript',
              mode: "text/javascript"
            }, {
              name: 'HTML',
              mode: "text/html"
            }, {
              name: 'CSS',
              mode: "text/css"
            },
            {
              name: 'Shell',
              mode: "application/x-sh"
            }, {
              name: 'JSX',
              mode: "text/typescript-jsx"
            }, {
              name: 'Vue',
              mode: "text/x-vue"
            }, {
              name: 'MarkDown',
              mode: "text/x-markdown"
            }, {
              name: 'SASS',
              mode: "text/x-sass"
            }
          ],
          codeMirrorConfig: {
            tabSize: 2,
            fontSize: 12,
            styleActiveLine: { nonEmpty: true },
            styleActiveSelected: true,
            line: false,
            foldGutter: true,
            autofocus: true,
            styleSelectedText: true,
            showCursorWhenSelecting: true,
            dragDrop: true,
            lint: true,
            theme: 'default',
            extraKeys: { 'Ctrl': 'autocomplete' },
            hintOptions: {
              completeSingle: false
            },
            lineNumbers: true,
            matchBrackets: true,
            autoCloseTags: true,
            keyMap: "sublime",
          }
        }
      },
      inlineCode: InlineCode,
      table: Table,
      Color: {
        class: ColorPlugin,
        config: {
          colorCollections: [
            '#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4',
            '#00BCD4','#4CAF50','#8BC34A','#CDDC39','#FFF'
          ],
          defaultColor: '#FF1300',
          type: 'text',
        }
      },
      Marker: {
        class: ColorPlugin,
        config: {
          defaultColor: '#FFBF00',
          type: 'marker',
        }
      },
    },
    data: {
      blocks: [
        { type: 'header', data: { text: 'Editor.js với Color/Marker', level: 2 } },
        { type: 'paragraph', data: { text: 'Bôi đen text để đổi màu hoặc highlight.' } }
      ]
    }
  })
})

onBeforeUnmount(() => {
  if (editorInstance?.destroy) editorInstance.destroy()
})
</script>

<style scoped>
.editorjs-container {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 16px;
  background: #fff;
}

.custom-drag-icon {
  position: absolute;
  left: -20px;
  top: 8px;
  cursor: grab;
  opacity: 0;
  transition: opacity 0.15s ease;
  user-select: none;
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
