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
    <div v-else class="network-container">
      <div class="network-scroll-content">
        <!-- Request section -->
        <div class="section">
          <div class="section-header">Request</div>
          <div class="section-body">
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
        </div>

        <!-- Response section -->
        <div class="section">
          <div class="section-header">Response</div>
          <div class="section-body">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.network-tab {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
}

.network-container {
  flex: 1;
  margin: 0;
  border: var(--table-border);
  background-color: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.network-scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  @include elements.scrollbar-hidden;
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

.section {
  margin-bottom: 20px;
  &:last-child { margin-bottom: 0; }
}

.section-header {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #ddd;
}

.section-body {
  font-size: 13px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.sub-section {
  margin-top: 12px;
  padding-left: 10px;
  border-left: 2px solid #bbb; /* Giảm nhẹ độ đậm */
}

.sub-title {
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.row {
  display: flex;
  gap: 10px;
  padding: 3px 0;
  align-items: baseline;
}

.label {
  flex-shrink: 0;
  min-width: 100px;
  color: #888;
  font-size: 12px;
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
}

.error-value {
  color: #f44336;
}

.code-block {
  margin: 6px 0 0;
  padding: 10px;
  background: #eeeeee;
  border: 1px solid #ddd;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
  color: #333;
}
</style>
