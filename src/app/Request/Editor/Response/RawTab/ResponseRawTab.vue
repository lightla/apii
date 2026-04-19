<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'
import { useResponseStorage } from '@/storages/response.ts'

const props = defineProps<{ route: RouteInfo }>()
const response = useResponseStorage()

const rawContent = computed(() => {
  return response.rawBody || ''
})

function copyRaw() {
  if (rawContent.value) {
    navigator.clipboard.writeText(rawContent.value)
  }
}
</script>

<template>
  <div class="response-raw-tab">
    <div v-if="!response.rawBody" class="empty-state">
      No response data to display.
    </div>
    <div v-else class="raw-container">
      <button class="btn-copy-raw" title="Copy RAW" @click="copyRaw">
        <svg class="copy-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
      </button>
      <pre class="raw-text">{{ rawContent }}</pre>
    </div>
  </div>
</template>

<style scoped lang="scss">
.response-raw-tab {
  height: 100%;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.raw-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.btn-copy-raw {
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
  background: #cfe2ff; /* Màu xanh đậm thêm 1 xíu */
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
  stroke: #007bff; /* Icon màu xanh đồng bộ */
}

.raw-text {
  flex: 1;
  margin: 0;
  padding: 15px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  background-color: transparent;
  border: var(--table-border); /* Đồng bộ viền với Uri Parameters */
}

.empty-state {
  padding: 20px;
  color: #888;
  text-align: center;
}
</style>
