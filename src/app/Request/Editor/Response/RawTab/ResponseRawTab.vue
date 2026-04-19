<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'
import { useResponseStorage } from '@/storages/response.ts'
import FileCopy from '@/assets/svg/svgrepo/file-copy.svg'

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
      <div class="raw-actions">
        <button class="btn-copy-raw" title="Copy RAW" @click="copyRaw">
          <FileCopy class="copy-icon-svg" />
        </button>
      </div>
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
  background-color: #f5f5f5; /* Màu xám dịu đồng bộ style */
}

.raw-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #f5f5f5;
}

.raw-actions {
  padding: 0;
  display: flex;
  justify-content: flex-end;
  background-color: transparent;
}

.btn-copy-raw {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #fff;
  border: 1px solid #888888;
  border-radius: 2px;
  padding: 0;
  &:hover { background: #e0e0e0; }
}

.copy-icon-svg {
  width: 18px;
  height: 18px;
  fill: transparent;
  stroke: #333;
  stroke-width: 1px;
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
}

.empty-state {
  padding: 20px;
  color: #888;
  text-align: center;
}
</style>
