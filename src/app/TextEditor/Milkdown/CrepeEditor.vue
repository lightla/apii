<template>
  <div>
    <button class="btn" @click="openMenu">Mở Menu Thủ Công</button>
    <div ref="editorRef" class="milkdown-editor"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Crepe, CrepeFeature } from '@milkdown/crepe'

// 🔑 import từ Crepe source
const editorRef = ref<HTMLDivElement>()
let editorInstance: any = null
let openMenu: () => void = () => {}

onMounted(async () => {
  if (!editorRef.value) return

  // 1️⃣ Khởi tạo Crepe editor
  editorInstance = await new Crepe({
    features: {
      [CrepeFeature.BlockEdit]: false, // tắt block edit gốc để tránh menu gốc
      [CrepeFeature.CodeMirror]: true,
      [CrepeFeature.ImageBlock]: true,
    },
    root: editorRef.value,
    defaultValue: '\n\n\n',
  })
      .config((ctx) => {
        // 2️⃣ Gắn menu vào ctx
        configureMenu(ctx)

        // 3️⃣ Lưu API show/hide menu
        const api = ctx.get(menuAPI.key)
        openMenu = () => {
          const view = editorInstance.editor.view
          const pos = view.state.selection.from
          api.show(pos)
        }
      })
      .use(menu) // 4️⃣ Dùng plugin menu
      .create()
})
</script>

<style>
.milkdown-editor {
  border: 1px solid #ddd;
  border-radius: 6px;
  min-height: 300px;
  background: white;
  margin-top: 8px;
}

.btn {
  background: #4f46e5;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}
.btn:hover {
  background: #4338ca;
}
</style>
