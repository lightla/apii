<script setup>
import { NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'

const props = defineProps({
  // props được Tiptap tự động truyền vào
  node: { type: Object, required: true },
  editor: { type: Object, required: true },
  getPos: { type: Function, required: true },
  selected: { type: Boolean },
})
</script>

<template>
  <!-- NodeViewWrapper là component đặc biệt của Tiptap để tạo Node View -->
  <NodeViewWrapper class="block-wrapper">
    <!-- Nút kéo thả -->
    <div class="drag-handle" contenteditable="false" draggable="true" data-drag-handle>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle>
      </svg>
    </div>

    <!-- Nơi nội dung của khối (văn bản, tiêu đề,... ) sẽ được render -->
    <NodeViewContent class="block-content" />
  </NodeViewWrapper>
</template>

<!-- Style đã được chuyển vào Shadow DOM của TiptapEditor.vue -->
