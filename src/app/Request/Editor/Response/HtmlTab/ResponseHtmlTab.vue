<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'
import { useResponseStorage } from '@/storages/response.ts'

const props = defineProps<{
  route: RouteInfo | null
}>()

const response = useResponseStorage()

const htmlContent = computed(() => {
  if (!response.data) return ''
  if (typeof response.data === 'string') return response.data
  return `<pre>${JSON.stringify(response.data, null, 2)}</pre>`
})

function copyHtml() {
  if (htmlContent.value) {
    navigator.clipboard.writeText(htmlContent.value)
  }
}
</script>

<template>
  <div class="html-preview">
    <div v-if="!response.data" class="empty-state">
      No response data to preview.
    </div>
    <div v-else class="html-container">
      <button class="btn-copy-html" title="Copy HTML" @click="copyHtml">
        <svg class="copy-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <iframe
        :srcdoc="htmlContent"
        class="preview-iframe"
        sandbox="allow-same-origin"
      ></iframe>
    </div>
  </div>
</template>

<style scoped lang="scss">
.html-preview {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.html-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.btn-copy-html {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #cfe2ff; /* Màu xanh đồng bộ RAW */
  border: 1px solid #007bff;
  border-radius: 4px;
  padding: 0;
  transition: all 0.2s ease;
  &:hover { 
    background: #b6d4fe; 
    border-color: #0056b3;
  }
}

.copy-icon-svg {
  width: 16px;
  height: 16px;
  stroke: #007bff;
}

.preview-iframe {
  flex: 1;
  margin: 0;
  border: var(--table-border); /* Đồng bộ viền với Path Variables */
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.empty-state {
  padding: 20px;
  color: #888;
  text-align: center;
}
</style>
