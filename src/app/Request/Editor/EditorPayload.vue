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
import { IconBookmark, IconTrash } from '@tabler/icons-vue'
import { SquareX } from 'lucide-vue-next'

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()
const historyStore = useHistoryStorage()
const payloadStore = useRequestParamsStorage()
const responseStore = useResponseStorage()
const selectedHistoryKey = ref('')
const isPreviewOpen = ref(false)
const isHistoryDropdownOpen = ref(false)
const historyDropdownRef = ref<HTMLElement | null>(null)
const historyDropdownPanelRef = ref<HTMLElement | null>(null)
const historyDropdownStyle = ref<Record<string, string>>({})
const lastPointerDownInsideDropdown = ref(false)
const suppressNextHistorySelect = ref(false)

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
  return item.name || item.url
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

const removeHistoryItem = (key: string) => {
  const [kind, id] = key.split(':')
  const requestId = props.storageKey ?? props.route.id
  if (kind === 'saved') {
    historyStore.removeSaved(requestId, id)
  } else {
    historyStore.removeRecent(requestId, id)
  }
  if (selectedHistoryKey.value === key) {
    selectedHistoryKey.value = ''
  }
}

const clearAllSavedHistory = () => {
  const requestId = props.storageKey ?? props.route.id
  historyStore.clearSaved(requestId)
}

const clearAllRecentHistory = () => {
  const requestId = props.storageKey ?? props.route.id
  historyStore.clearRecent(requestId)
}

const saveRecentHistoryItem = (itemId: string) => {
  const requestId = props.storageKey ?? props.route.id
  historyStore.saveHistory(requestId, itemId)
}

const editingSavedItemId = ref<string | null>(null)
const editingSavedName = ref('')

const getSavedDisplayName = (item: HistoryItem) => item.name || item.url

const startRenameSavedHistoryItem = (item: HistoryItem) => {
  editingSavedItemId.value = item.id
  editingSavedName.value = getSavedDisplayName(item)
}

const saveRenameSavedHistoryItem = () => {
  const itemId = editingSavedItemId.value
  if (!itemId) return
  const requestId = props.storageKey ?? props.route.id
  const trimmed = editingSavedName.value.trim()
  if (trimmed) {
    historyStore.renameSaved(requestId, itemId, trimmed)
  }
  editingSavedItemId.value = null
}

const onRenameInputBlur = () => {
  if (lastPointerDownInsideDropdown.value) {
    saveRenameSavedHistoryItem()
  }
}

const onHistoryDropdownPanelMouseDown = (event: MouseEvent) => {
  if (!editingSavedItemId.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  const isInput = target.closest('.history-item-input')
  const isEdit = target.closest('.history-item-edit')
  if (!isInput && !isEdit) {
    suppressNextHistorySelect.value = true
    saveRenameSavedHistoryItem()
  }
}

const handleHistoryItemClick = (key: string) => {
  if (suppressNextHistorySelect.value) {
    suppressNextHistorySelect.value = false
    return
  }
  if (editingSavedItemId.value) return
  selectHistory(key)
}

const trackPointerDownArea = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target) {
    lastPointerDownInsideDropdown.value = false
    return
  }
  const isInTrigger = !!historyDropdownRef.value?.contains(target)
  const isInPanel = !!historyDropdownPanelRef.value?.contains(target)
  lastPointerDownInsideDropdown.value = isInTrigger || isInPanel
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

const saveCurrentSnapshot = () => {
  const method = (payloadStore.method || 'GET').toUpperCase()
  const url = payloadStore.urlPreview || payloadStore.baseUrl || ''
  historyStore.saveSnapshot(props.storageKey ?? props.route.id, {
    requestId: props.storageKey ?? props.route.id,
    timestamp: Date.now(),
    method,
    url,
    status: responseStore.status || 0,
    statusText: responseStore.statusText || 'Snapshot',
    duration: responseStore.responseTime || 0,
    response: responseStore.data || responseStore.rawBody || null,
    responseType: responseStore.responseHeaders?.['content-type'] || 'application/json',
    responseHeaders: { ...(responseStore.responseHeaders || {}) },
    error: responseStore.error || '',
    requestData: {
      baseUrl: payloadStore.baseUrl,
      method: payloadStore.method,
      headers: [...payloadStore.headers],
      queryParams: [...payloadStore.queryParams],
      uriParameters: [...payloadStore.uriParameters],
      body: payloadStore.body,
      bodyType: payloadStore.bodyType,
      selectedHeaderPresetIds: [...payloadStore.selectedHeaderPresetIds],
      selectedQueryPresetIds: [...payloadStore.selectedQueryPresetIds],
      selectedBodyPresetIds: [...payloadStore.selectedBodyPresetIds],
      preRequestScript: payloadStore.preRequestScript,
      postRequestScript: payloadStore.postRequestScript,
    }
  })
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
  const isInTrigger = !!historyDropdownRef.value?.contains(target)
  const isInPanel = !!historyDropdownPanelRef.value?.contains(target)
  if (!isInTrigger && !isInPanel) {
    isHistoryDropdownOpen.value = false
  }
}

onMounted(() => {
  window.addEventListener('mousedown', trackPointerDownArea, true)
  window.addEventListener('click', closeHistoryDropdownOnOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', trackPointerDownArea, true)
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
                <span class="history-select-content">
                  <span v-if="selectedHistoryItem" class="history-select-method">{{ selectedHistoryItem.method }}</span>
                  <span class="history-select-label">{{ selectedHistoryLabel }}</span>
                </span>
                <span class="history-select-arrow">▾</span>
              </button>
            </div>
            <Teleport to="body">
              <div
                v-if="isHistoryDropdownOpen"
                ref="historyDropdownPanelRef"
                class="history-dropdown-panel"
                :style="historyDropdownStyle"
                @mousedown="onHistoryDropdownPanelMouseDown"
              >
                <div class="history-dropdown-group-title">
                  <span>Saved</span>
                  <button class="history-group-clear-btn" title="Delete all saved" @click.stop="clearAllSavedHistory">
                    <IconTrash size="12" />
                  </button>
                </div>
                <div v-if="savedItems.length > 0" class="history-dropdown-group-items">
                  <button
                    v-for="item in savedItems"
                    :key="`saved:${item.id}`"
                    class="history-dropdown-item"
                    @click.stop="handleHistoryItemClick(`saved:${item.id}`)"
                  >
                    <span class="history-item-method">{{ item.method }}</span>
                    <input
                      v-if="editingSavedItemId === item.id"
                      v-model="editingSavedName"
                      class="history-item-input"
                      @click.stop
                      @blur="onRenameInputBlur"
                      @keydown.enter.prevent="saveRenameSavedHistoryItem"
                    />
                    <span v-else class="history-item-text">{{ getSavedDisplayName(item) }}</span>
                    <span class="history-item-edit" title="Rename saved item" @click.stop="startRenameSavedHistoryItem(item)">✎</span>
                    <span class="history-item-remove" @click.stop="removeHistoryItem(`saved:${item.id}`)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="delete-x-svg">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </span>
                  </button>
                </div>
                <div v-else class="history-dropdown-empty">No saved history yet.</div>
                <div class="history-dropdown-group-title">
                  <span>Recent</span>
                  <button class="history-group-clear-btn" title="Delete all recent" @click.stop="clearAllRecentHistory">
                    <IconTrash size="12" />
                  </button>
                </div>
                <div v-if="recentItems.length > 0" class="history-dropdown-group-items">
                  <button
                    v-for="item in recentItems"
                    :key="`recent:${item.id}`"
                    class="history-dropdown-item"
                    @click.stop="handleHistoryItemClick(`recent:${item.id}`)"
                  >
                    <span class="history-item-method">{{ item.method }}</span>
                    <span class="history-item-text">{{ item.name || item.url }}</span>
                    <span class="history-item-save" title="Save to Saved" @click.stop="saveRecentHistoryItem(item.id)">
                      <IconBookmark size="10" />
                    </span>
                    <span class="history-item-remove" @click.stop="removeHistoryItem(`recent:${item.id}`)">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="delete-x-svg">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </span>
                  </button>
                </div>
                <div v-else class="history-dropdown-empty">No recent history yet.</div>
              </div>
            </Teleport>
            <button class="preview-btn" :disabled="!selectedHistoryItem" title="Save snapshot" @click="saveCurrentSnapshot">
              <IconBookmark size="16" stroke-width="1.6" />
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

.history-select-content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
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
  min-width: 0;
  flex: 1;
}

.history-select-method {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
  min-width: 20px;
  margin-right: 0;
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

<style lang="scss">
.history-dropdown-panel {
  position: fixed;
  width: max-content;
  max-width: min(480px, 85vw);
  max-height: 260px;
  overflow-y: auto;
  overflow-x: hidden;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: #666;
  padding: 6px 8px 4px;
  text-transform: uppercase;
}

.history-group-clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #aaa;
  background: #efefef;
  width: 18px;
  height: 18px;
  line-height: 1;
  padding: 0;
  text-transform: none;
  cursor: pointer;
}

.history-dropdown-group-items {
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
}

.history-dropdown-empty {
  padding: 6px 8px 8px;
  font-size: 12px;
  color: #888;
}

.history-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
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

.history-item-text {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-method {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
  color: #1d4ed8;
  min-width: 20px;
  margin-right: 0;
}

.history-item-input {
  flex: 1;
  min-width: 0;
  height: 22px;
  border: 1px solid #9ca3af;
  padding: 0 6px;
  font-size: 12px;
}

.history-item-remove, .history-item-edit, .history-item-save {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: center !important;
  width: 18px !important;
  height: 18px !important;
  border: 1px solid #999 !important;
  border-radius: 4px !important;
  line-height: 0 !important;
  cursor: pointer !important;
  box-sizing: border-box !important;
  transition: all 0.15s ease !important;
  background: #fdfdfd !important;
  flex-shrink: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.history-item-remove {
  color: #666 !important;
  
  &:hover {
    background: #fee2e2 !important;
    color: #ef4444 !important;
    border-color: #fca5a5 !important;
  }

  .delete-x-svg, svg {
    width: 10px !important;
    height: 10px !important;
    display: block !important;
    pointer-events: none;
  }
}

.history-item-edit {
  color: #666 !important;
  font-size: 11px !important;

  &:hover {
    background: #dbeafe !important;
    color: #1d4ed8 !important;
    border-color: #93c5fd !important;
  }
}

.history-item-save {
  color: #666 !important;

  &:hover {
    background: #fef9c3 !important;
    color: #ca8a04 !important;
    border-color: #fde047 !important;
  }

  svg {
    width: 10px !important;
    height: 10px !important;
    display: block !important;
  }
}
</style>
