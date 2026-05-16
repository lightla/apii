<script setup lang="ts">
import { ref, inject, onMounted, onUnmounted, watch, computed } from 'vue'
import type { Ref } from 'vue'
import type { RouteInfo } from '@/types'

import PayloadParamTab from '@/app/Request/Editor/Payload/ParamTab/PayloadParamTab.vue'
import PayloadHeaderTab from '@/app/Request/Editor/Payload/HeaderTab/PayloadHeaderTab.vue'
import PayloadBodyTab from '@/app/Request/Editor/Payload/BodyTab/PayloadBodyTab.vue'
import PayloadScriptTab from '@/app/Request/Editor/Payload/ScriptTab/PayloadScriptTab.vue'
import PayloadPresetTab from '@/app/Request/Editor/Payload/PresetTab/PresetTab.vue'
import ToggleLeftIcon from '@/assets/svg/feathericons/toggle-left.svg'
import ToggleRightIcon from '@/assets/svg/feathericons/toggle-right.svg'
import ToggleMenuItemDetail from '@/app/Generals/ToggleMenu/ToggleMenuItemDetail.vue'
import ToggleMenuItemAction from '@/app/Generals/ToggleMenu/ToggleMenuItemAction.vue'
import SwitchableTabs from '@/app/Generals/SwitchableTab/SwitchableTabs.vue'
import SwitchableTab from '@/app/Generals/SwitchableTab/SwitchableTab.vue'
import ScrollContainer from "@/app/Generals/ScrollContainer/ScrollContainer.vue";
import { useHistoryStorage, type HistoryItem } from '@/storages/history.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { useResponseStorage } from '@/storages/response.ts'
import { IconEye } from '@tabler/icons-vue'

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()
const historyStore = useHistoryStorage()
const payloadStore = useRequestParamsStorage()
const responseStore = useResponseStorage()
const selectedHistoryKey = ref('')
const isPreviewOpen = ref(false)
const isHistoryDropdownOpen = ref(false)
const historyDropdownRef = ref<HTMLElement | null>(null)
const historyDropdownStyle = ref<Record<string, string>>({})

// --- Logic Toggle (Giữ nguyên) ---
const toggleStates = inject<Ref<Map<string, boolean>>>('toggleStates')!
const toggleMenuItemIdRef = inject<Ref<string>>('toggleMenuItemIdRef')!
const toggleActive = ref(true)
onMounted(() => {
  toggleActive.value = toggleStates.value.get(toggleMenuItemIdRef.value) ?? true
})
watch(() => toggleStates.value.get(toggleMenuItemIdRef.value), (val) => {
  toggleActive.value = val ?? true
})

// --- Định nghĩa danh sách Tabs ---
const tabs = [
  { id: 'params', name: 'Params', component: PayloadParamTab },
  { id: 'headers', name: 'Headers', component: PayloadHeaderTab },
  { id: 'body', name: 'Body', component: PayloadBodyTab },
  { id: 'script', name: 'Script', component: PayloadScriptTab },
  { id: 'presets', name: 'Presets', component: PayloadPresetTab },
]

const recentItems = computed(() => historyStore.recent[props.storageKey ?? props.route.id] || [])
const savedItems = computed(() => historyStore.saved[props.storageKey ?? props.route.id] || [])
const selectedHistoryItem = computed<HistoryItem | null>(() => {
  if (!selectedHistoryKey.value) return null
  const [kind, id] = selectedHistoryKey.value.split(':')
  const source = kind === 'saved' ? savedItems.value : recentItems.value
  return source.find(item => item.id === id) || null
})
const selectedHistoryLabel = computed(() => {
  const item = selectedHistoryItem.value
  if (!item) return 'Apply history...'
  return `${item.method} ${item.url}`
})
const hasAnyHistory = computed(() => savedItems.value.length > 0 || recentItems.value.length > 0)

const restoreResponseFromHistory = (item: HistoryItem) => {
  responseStore.requestMethod = item.method
  responseStore.requestUrl = item.url
  responseStore.status = item.status
  responseStore.statusText = item.statusText
  responseStore.responseTime = item.duration
  responseStore.responseHeaders = item.responseHeaders || {}
  responseStore.error = item.error || ''
  responseStore.loading = false
  if (typeof item.response === 'string') {
    responseStore.rawBody = item.response
    responseStore.data = item.response
    return
  }
  responseStore.data = item.response
  responseStore.rawBody = item.response == null ? '' : JSON.stringify(item.response, null, 2)
}

const applySelectedHistory = () => {
  const item = selectedHistoryItem.value
  if (!item) return
  payloadStore.applyHistory(item.requestData)
  restoreResponseFromHistory(item)
}
const selectHistory = (key: string) => {
  selectedHistoryKey.value = key
  applySelectedHistory()
  isHistoryDropdownOpen.value = false
}
const toggleHistoryDropdown = () => {
  if (isHistoryDropdownOpen.value) {
    isHistoryDropdownOpen.value = false
    return
  }
  const rect = historyDropdownRef.value?.getBoundingClientRect()
  if (rect) {
    const minWidth = Math.round(rect.width)
    const right = Math.max(8, window.innerWidth - rect.right)
    historyDropdownStyle.value = {
      top: `${rect.bottom + 2}px`,
      right: `${right}px`,
      minWidth: `${minWidth}px`,
    }
  }
  isHistoryDropdownOpen.value = true
}

const openPreview = () => {
  if (!selectedHistoryItem.value) return
  isPreviewOpen.value = true
}

const closePreview = () => {
  isPreviewOpen.value = false
}

const formatPreview = (value: unknown) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

const closeHistoryDropdownOnOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) return
  if (historyDropdownRef.value && !historyDropdownRef.value.contains(target)) {
    isHistoryDropdownOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('click', closeHistoryDropdownOnOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('click', closeHistoryDropdownOnOutsideClick)
})
</script>

<template>
  <div class="payload" :data-tab-detail-active="toggleActive">
    <SwitchableTabs :tabs="tabs" :default-active-tab-index="0">

      <template #actions>
        <div class="tab-bar-right">
          <div class="history-quick-actions">
            <div ref="historyDropdownRef" class="history-select-wrap">
              <button class="history-select" @click.stop="toggleHistoryDropdown" :disabled="!hasAnyHistory">
                <span class="history-select-label">{{ selectedHistoryLabel }}</span>
                <span class="history-select-arrow">▾</span>
              </button>
            </div>
            <Teleport to="body">
              <div v-if="isHistoryDropdownOpen" class="history-dropdown-panel" :style="historyDropdownStyle">
                <div v-if="savedItems.length > 0" class="history-dropdown-group-title">Saved</div>
                <button
                  v-for="item in savedItems"
                  :key="`saved:${item.id}`"
                  class="history-dropdown-item"
                  @click.stop="selectHistory(`saved:${item.id}`)"
                >
                  {{ item.method }} {{ item.url }}
                </button>
                <div v-if="recentItems.length > 0" class="history-dropdown-group-title">Recent</div>
                <button
                  v-for="item in recentItems"
                  :key="`recent:${item.id}`"
                  class="history-dropdown-item"
                  @click.stop="selectHistory(`recent:${item.id}`)"
                >
                  {{ item.method }} {{ item.url }}
                </button>
              </div>
            </Teleport>
            <button class="preview-btn" :disabled="!selectedHistoryItem" title="Preview snapshot" @click="openPreview">
              <IconEye size="16" />
            </button>
          </div>
          <ToggleMenuItemAction class="tab-toggle">
            <ToggleRightIcon v-if="toggleActive" class="env-action-svg" />
            <ToggleLeftIcon v-else class="env-action-svg" />
          </ToggleMenuItemAction>
        </div>
      </template>

      <ToggleMenuItemDetail>
        <div class="tab-detail">
          <div class="tab-detail-content-wrap">
            <SwitchableTab v-for="(tab, index) in tabs" :key="tab.id" :index="index">
              <component :is="tab.component" :route="props.route" :storage-key="props.storageKey ?? props.route.id" />
            </SwitchableTab>
          </div>
        </div>
      </ToggleMenuItemDetail>
    </SwitchableTabs>
    <div v-if="isPreviewOpen && selectedHistoryItem" class="history-preview-overlay" @click.self="closePreview">
      <div class="history-preview">
        <div class="preview-header">
          <strong>{{ selectedHistoryItem.method }} {{ selectedHistoryItem.url }}</strong>
          <button class="preview-close" @click="closePreview">×</button>
        </div>
        <div class="preview-section">
          <div class="preview-label">Request Meta</div>
          <pre>{{ formatPreview({
            method: selectedHistoryItem.requestData.method,
            baseUrl: selectedHistoryItem.requestData.baseUrl,
            url: selectedHistoryItem.url,
            bodyType: selectedHistoryItem.requestData.bodyType,
            status: selectedHistoryItem.status,
            statusText: selectedHistoryItem.statusText,
            duration: selectedHistoryItem.duration
          }) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">URI Parameters</div>
          <pre>{{ formatPreview(selectedHistoryItem.requestData.uriParameters) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Query Parameters</div>
          <pre>{{ formatPreview(selectedHistoryItem.requestData.queryParams) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Request Headers</div>
          <pre>{{ formatPreview(selectedHistoryItem.requestData.headers) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Selected Presets</div>
          <pre>{{ formatPreview({
            headerPresetIds: selectedHistoryItem.requestData.selectedHeaderPresetIds,
            queryPresetIds: selectedHistoryItem.requestData.selectedQueryPresetIds,
            bodyPresetIds: selectedHistoryItem.requestData.selectedBodyPresetIds
          }) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Request Body</div>
          <pre>{{ formatPreview(selectedHistoryItem.requestData.body) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Response Headers</div>
          <pre>{{ formatPreview(selectedHistoryItem.responseHeaders || {}) }}</pre>
        </div>
        <div class="preview-section">
          <div class="preview-label">Response ({{ selectedHistoryItem.status }})</div>
          <pre>{{ formatPreview(selectedHistoryItem.response) }}</pre>
        </div>
        <div class="preview-section" v-if="selectedHistoryItem.error">
          <div class="preview-label">Error</div>
          <pre>{{ selectedHistoryItem.error }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.payload {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  gap: 10px;

  &[data-tab-detail-active="false"] {
    height: auto;
    min-height: auto;
  }
}

.tab-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 4px;
  flex: 0 0 auto;
  margin-left: auto;

  :deep(.toggle-menu-item-action) {
    position: relative;
    top: auto;
    right: auto;
  }
}

.history-quick-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  min-width: 0;
}

.history-select {
  height: 26px;
  width: 170px;
  min-width: 170px;
  max-width: 170px;
  flex: 0 0 170px;
  border: 1px solid #888;
  background: #efefef;
  font-size: 12px;
  padding: 0 28px 0 8px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.history-select-wrap {
  position: relative;
  width: 170px;
  min-width: 170px;
  max-width: 170px;
  flex: 0 0 170px;
}

.history-select-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  width: 100%;
}

.history-select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #444;
  font-size: 12px;
}

.history-dropdown-panel {
  position: fixed;
  width: max-content;
  max-width: min(480px, 85vw);
  max-height: 260px;
  overflow: auto;
  border: 1px solid #888;
  background: #efefef;
  z-index: 30000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.history-dropdown-panel::-webkit-scrollbar {
  display: none;
}

.history-dropdown-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #666;
  padding: 6px 8px 4px;
  text-transform: uppercase;
}

.history-dropdown-item {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  line-height: 1.3;
  padding: 6px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: #ddd;
  }
}

.preview-btn {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #888;
  background: #efefef;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.env-action-svg {
  cursor: pointer;
  display: block;
  height: 32px;
  width: auto;
  stroke-width: 1;
  transform: scale(1.1, 1.0);

  &:hover {
    fill: #cccccc;
  }
}

.tab-detail {
  overflow: hidden;
  padding: 0;
  flex: 1;
  display: flex;
  min-height: 0;
}

.tab-detail-content-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;

  & > :deep(div) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}

.history-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.28);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-preview {
  width: min(860px, 92vw);
  max-height: 82vh;
  overflow: auto;
  background: #f4f4f4;
  border: 1px solid #777;
  padding: 10px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f4f4f4;
  padding: 2px 0 6px;
}

.preview-close {
  border: 1px solid #777;
  background: #ececec;
  cursor: pointer;
  width: 28px;
  height: 24px;
}

.preview-section {
  margin-bottom: 8px;

  pre {
    margin: 4px 0 0;
    background: #fff;
    border: 1px solid #ccc;
    padding: 8px;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
  }
}

.preview-label {
  font-size: 12px;
  font-weight: 700;
}
</style>
