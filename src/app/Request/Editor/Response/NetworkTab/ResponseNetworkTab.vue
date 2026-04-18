<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'
import { useResponseStorage } from '@/storages/response.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()

const response = useResponseStorage()
const requestParams = useRequestParamsStorage()

const hasBody = computed(() =>
  ['POST', 'PUT', 'PATCH'].includes(response.requestMethod)
)

const requestHeadersDisplay = computed(() => {
  const headers: Record<string, string> = {}
  if (hasBody.value && requestParams.body) {
    headers['Content-Type'] = 'application/json'
  }
  return headers
})

const statusColor = computed(() => {
  const s = response.status
  if (!s) return '#888'
  if (s < 300) return '#4caf50'
  if (s < 400) return '#ff9800'
  return '#f44336'
})

const prettyBody = computed(() => {
  if (!requestParams.body) return ''
  try {
    return JSON.stringify(JSON.parse(requestParams.body), null, 2)
  } catch {
    return requestParams.body
  }
})
</script>

<template>
  <div class="network-tab">
    <!-- Empty state -->
    <div v-if="response.status === null && !response.loading && !response.error" class="state-msg muted">
      Press the send button to execute the request.
    </div>

    <!-- Loading -->
    <div v-else-if="response.loading" class="state-msg">
      <span class="dot-loader"></span>
      Sending request...
    </div>

    <!-- Content -->
    <div v-else class="network-content">

      <!-- Request section -->
      <div class="section">
        <div class="section-title">Request</div>

        <div class="row">
          <span class="label">URL</span>
          <span class="value url-value">{{ response.requestUrl }}</span>
        </div>
        <div class="row">
          <span class="label">Method</span>
          <span class="value method-value">{{ response.requestMethod }}</span>
        </div>

        <div v-if="Object.keys(requestHeadersDisplay).length" class="sub-section">
          <div class="sub-title">Request Headers</div>
          <div class="row" v-for="(val, key) in requestHeadersDisplay" :key="String(key)">
            <span class="label">{{ key }}</span>
            <span class="value">{{ val }}</span>
          </div>
        </div>

        <div v-if="hasBody && prettyBody" class="sub-section">
          <div class="sub-title">Request Body</div>
          <pre class="code-block">{{ prettyBody }}</pre>
        </div>
      </div>

      <!-- Response section -->
      <div class="section">
        <div class="section-title">Response</div>

        <div v-if="response.error" class="row">
          <span class="label">Error</span>
          <span class="value error-value">{{ response.error }}</span>
        </div>

        <template v-else>
          <div class="row">
            <span class="label">Status</span>
            <span class="value" :style="{ color: statusColor, fontWeight: 700 }">
              {{ response.status }} {{ response.statusText }}
            </span>
          </div>
          <div class="row" v-if="response.responseTime !== null">
            <span class="label">Time</span>
            <span class="value">{{ response.responseTime }} ms</span>
          </div>

          <div v-if="Object.keys(response.responseHeaders).length" class="sub-section">
            <div class="sub-title">Response Headers</div>
            <div class="row" v-for="(val, key) in response.responseHeaders" :key="String(key)">
              <span class="label">{{ key }}</span>
              <span class="value">{{ val }}</span>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
.network-tab {
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #555; border-radius: 3px; }
}

.state-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  font-size: 13px;
  color: #888;
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

.network-content {
  padding: 10px 0;
  font-size: 12px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.section {
  margin-bottom: 16px;
  padding: 0 12px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #999;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
}

.sub-section {
  margin-top: 8px;
}

.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: #bbb;
  margin-bottom: 4px;
  margin-top: 8px;
}

.row {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  align-items: baseline;
  line-height: 1.6;
}

.label {
  flex-shrink: 0;
  min-width: 80px;
  color: #999;
  font-size: 11px;
}

.value {
  color: #333;
  word-break: break-all;
}

.url-value {
  color: #007bff;
}

.method-value {
  font-weight: 700;
  color: #333;
}

.error-value {
  color: #f44336;
}

.code-block {
  margin: 4px 0 0;
  padding: 8px 10px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  color: #333;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}
</style>
