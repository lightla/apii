<template>
  <div class="milkdown-editor-wrapper">
    <div ref="editorRef" class="milkdown-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import type { OffsetOptions } from '@floating-ui/dom'


import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/frame.css'
import {oneDark} from "@codemirror/theme-one-dark";
import {languages} from "@codemirror/language-data";


const editorRef = ref(null)

const markdown = ``

import { SlashProvider } from '@milkdown/kit/plugin/slash'

const content = document.createElement('div')
document.body.appendChild(content)

const provider = new SlashProvider({
  content,
  trigger: '/', // hoặc '@', ':', v.v.
})

import { slashFactory } from '@milkdown/kit/plugin/slash'

const slash = slashFactory('slashMenu')

const handleClick = () => {
  if (!editorInstance) return
  const ctx = (editorInstance as any).editor?.ctx
  if (ctx) {
    ctx.update(slash.key, (prev: any) => ({ ...prev, opened: true }))
  }
}

let editorInstance: any | null = null

onMounted(async () => {
  if (editorRef.value) {

    editorInstance  = await new Crepe({
      features: {
        [Crepe.Feature.CodeMirror]: true,
        [Crepe.Feature.Table]: false,
        [Crepe.Feature.BlockEdit]: true, // slash command kiểu Notion
        [Crepe.Feature.ImageBlock]: true,
      },

      // ✅ Tuỳ chỉnh giao diện và hành vi
      featureConfigs: {
        [Crepe.Feature.LinkTooltip]: {
          inputPlaceholder: 'Nhập URL tại đây...',
        },
        [CrepeFeature.BlockEdit]: {
          blockHandle: {
            getOffset: (_ctx) => ({
              mainAxis: +10, // lệch trái/phải 40px
              crossAxis: 0,
            }),
          },
        },
      },

      root: editorRef.value, // <--- mount trực tiếp vào phần tử
      defaultValue: markdown,
    }).create()
  }

  // <p><br class="ProseMirror-trailingBreak"></p>
  // <div contenteditable="true" translate="no" class="ProseMirror virtual-cursor-enabled editor" role="textbox" data-dragging="false"><div contenteditable="false" class="prosemirror-virtual-cursor prosemirror-virtual-cursor-animation" style="height: 24px; left: 70px; top: 130px;"></div><p><br class="ProseMirror-trailingBreak"></p><p><br class="ProseMirror-trailingBreak"></p><p><br class="ProseMirror-trailingBreak"></p><p data-placeholder="Please enter..." class="crepe-placeholder"><br class="ProseMirror-trailingBreak"></p></div>

})


document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.milkdown-block-handle').forEach(el => {
    el.addEventListener('click', (e) => {

      let ctx = editorInstance.editor?.ctx

      console.log('drag - clicked');
      console.log('editorInstance', editorInstance);
      console.log('ctx', ctx)
      console.log('slashKey', slash.key)

      if (ctx) {
        ctx.update(slash.key.id, (prev) => ({ ...prev, opened: true }))
      }

      editorInstance.editor.ctx.update(slash.key.id, (prev) => ({ ...prev, opened: true }))
      // editorInstance.action(slash.key.id, { opened: true })
      // editorInstance.update(slash.key.id, { opened: true })

      handleClick();


    })
  })
})
</script>

<style lang="scss">
.milkdown-editor .cm-gutterElement.cm-activeLineGutter {
  background-color: #d4deef !important;
}

.milkdown-editor .milkdown .ProseMirror {
  padding: 30px 70px;
}

.milkdown .milkdown-block-handle .operation-item svg {
  width: 24px;
  height: 24px;
  padding: 4px;
}

.milkdown .milkdown-block-handle {
  border: 1px solid #369a6e !important;
}

.milkdown .milkdown-block-handle .operation-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 20px;
}



.milkdown .milkdown-slash-menu {
  transform: scale(0.8);
  transform-origin: left top;
}

.milkdown .milkdown-toolbar {
  transform: scale(0.8);
  transform-origin: right bottom;
}

//.milkdown .milkdown-block-handle .operation-item:nth-child(1) {
//  display: none !important;
//}

/*
.milkdown .milkdown-block-handle .operation-item svg {
  width: 32px;
  height: 32px;
  padding: 4px;
}

.milkdown .milkdown-block-handle .operation-item {
  width: 32px;
  height: 32px;
  padding: 4px;
}
*/
</style>

<style scoped>
.milkdown-editor {
  display: block;
  width: 100%;       /* chiếm hết chiều rộng container */
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  margin-top: 8px;
  box-sizing: border-box;
}
</style>
