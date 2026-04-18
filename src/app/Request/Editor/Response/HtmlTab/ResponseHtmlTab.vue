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
</script>

<template>
  <div class="html-preview">
    <div v-if="!response.data" class="empty-state">
      No response data to preview.
    </div>
    <iframe
      v-else
      :srcdoc="htmlContent"
      class="preview-iframe"
      sandbox="allow-same-origin"
    ></iframe>
  </div>
</template>

<style scoped>
.html-preview {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.preview-iframe {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
}

.empty-state {
  padding: 20px;
  color: #888;
  text-align: center;
}
</style>
