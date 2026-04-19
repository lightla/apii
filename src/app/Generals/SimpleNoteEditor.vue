<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  storageKey: string
  placeholder?: string
}>()

const noteRef = ref<HTMLDivElement | null>(null)

const loadContent = () => {
  if (noteRef.value) {
    noteRef.value.innerText = localStorage.getItem(props.storageKey) || ''
  }
}

const saveContent = () => {
  if (noteRef.value) {
    localStorage.setItem(props.storageKey, noteRef.value.innerText)
  }
}

onMounted(() => {
  loadContent()
})

watch(() => props.storageKey, () => {
  loadContent()
})

const onInput = () => {
  saveContent()
}
</script>

<template>
  <div class="simple-note-editor">
    <div
      ref="noteRef"
      contenteditable="true"
      class="note-content"
      :data-placeholder="props.placeholder || 'Write your notes here...'"
      @input="onInput"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.simple-note-editor {
  width: 100%;
  min-height: 150px;
  background-color: transparent !important;
}

.note-content {
  width: 100%;
  height: 100%;
  min-height: 150px;
  padding: 10px;
  outline: none;
  border: none;
  background-color: transparent !important;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;

  &:empty:before {
    content: attr(data-placeholder);
    color: #aaa;
    pointer-events: none;
    display: block;
  }
}
</style>
