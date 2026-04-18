<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RouteInfo } from '@/types'
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue'
import { useResponseStorage } from '@/storages/response.ts'

const props = defineProps<{ route: RouteInfo }>()

const response = useResponseStorage()
const theme = ref('one-dark')

const jsonText = computed(() => {
  if (response.data === null) return ''
  if (typeof response.data === 'string') return response.data
  return JSON.stringify(response.data, null, 2)
})
</script>

<template>
  <div class="json-tab">
    <!-- Loading -->
    <div v-if="response.loading" class="state-msg">
      <span class="dot-loader"></span>
      Sending request...
    </div>

    <!-- Network error -->
    <div v-else-if="response.error" class="state-msg error">
      {{ response.error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="response.status === null" class="state-msg muted">
      Press the send button to execute the request.
    </div>

    <!-- Response -->
    <div v-else class="editor-wrap">
      <CodeMirrorContainer2
        :model-value="jsonText"
        :theme="theme"
        :is-read-only="true"
        @update:theme="t => theme = t"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.state-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: #888;

  &.error { color: #f44336; }
  &.muted { color: #aaa; }
}

.dot-loader {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #888;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}

.editor-wrap {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>
