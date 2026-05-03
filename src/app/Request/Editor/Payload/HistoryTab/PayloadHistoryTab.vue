<script setup lang="ts">
import { useHistoryStorage, type HistoryItem } from '@/storages/history.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { computed, ref, nextTick } from 'vue'
import { IconHistory, IconTrash, IconBookmark, IconBookmarkOff, IconPlayerPlay, IconPackage, IconShield } from '@tabler/icons-vue'

const props = defineProps<{
  storageKey: string
}>()

const historyStore = useHistoryStorage()
const payloadStore = useRequestParamsStorage()

const recentItems = computed(() => historyStore.recent[props.storageKey] || [])
const savedItems = computed(() => historyStore.saved[props.storageKey] || [])

// Renaming state
const editingId = ref<string | null>(null)
const editingName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)

// Clear confirmation state
const isConfirmingClear = ref(false)

const startRename = (item: HistoryItem) => {
  editingId.value = item.id
  editingName.value = item.name || 'Noname'
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

const applyRename = () => {
  if (editingId.value) {
    historyStore.renameSaved(props.storageKey, editingId.value, editingName.value)
  }
  editingId.value = null
}

const cancelRename = () => {
  editingId.value = null
}

const formatDate = (ts: number) => {
  const d = new Date(ts)
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return 'status-success'
  if (status >= 400) return 'status-error'
  if (status === 0) return 'status-error'
  return 'status-info'
}

const loadHistory = (item: HistoryItem) => {
  payloadStore.applyHistory(item.requestData)
}

const runHistory = (item: HistoryItem) => {
  payloadStore.applyHistory(item.requestData)
  payloadStore.triggerSendCount++
}

const toggleSave = (item: HistoryItem, isSaved: boolean) => {
  if (isSaved) {
    historyStore.removeSaved(props.storageKey, item.id)
  } else {
    historyStore.saveHistory(props.storageKey, item.id)
  }
}

const clearRecent = () => {
  if (!isConfirmingClear.value) {
    isConfirmingClear.value = true
    // Auto reset after 3 seconds if not clicked again
    setTimeout(() => {
      isConfirmingClear.value = false
    }, 3000)
    return
  }
  
  historyStore.clearRecent(props.storageKey)
  isConfirmingClear.value = false
}
</script>

<template>
  <div class="history-tab">
    <div class="unified-history-table">
      <!-- Saved History Section -->
      <div class="history-section">
        <div class="section-header">
          <div class="title-wrap">
            <IconBookmark size="16" />
            <span>Saved History</span>
          </div>
        </div>
        
        <div v-if="savedItems.length === 0" class="empty-state mini">
          No saved history yet. Bookmark an item to keep it.
        </div>

        <div v-else class="history-list">
          <div v-for="item in savedItems" :key="item.id" class="history-item saved-item">
            <div class="item-content" @click="loadHistory(item)" @dblclick="startRename(item)">
              <!-- Line 1: Name [Time] -->
              <div class="item-title-row">
                <input 
                  v-if="editingId === item.id"
                  ref="nameInput"
                  v-model="editingName"
                  class="name-edit-input"
                  @blur="applyRename"
                  @keydown.enter="applyRename"
                  @keydown.esc="cancelRename"
                  @click.stop
                />
                <span v-else class="item-name">{{ item.name || 'Noname' }}</span>
                <span class="time-bracket">[{{ formatDate(item.timestamp) }}]</span>
              </div>
              
              <!-- Line 2: Status Method URL -->
              <div class="item-details-row">
                <span :class="['status-badge', getStatusClass(item.status)]">{{ item.status || 'ERR' }}</span>
                <span class="method">{{ item.method }}</span>
                <span class="item-url">{{ item.url }}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="action-btn run" @click.stop="runHistory(item)" title="Run this history">
                <IconPlayerPlay size="14" />
              </button>
              <button class="action-btn delete" @click.stop="toggleSave(item, true)" title="Unsave">
                <IconBookmarkOff size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Divider (Optional, but helps with 50/50 split visual) -->
      <div class="section-divider"></div>

      <!-- Recent History Section -->
      <div class="history-section">
        <div class="section-header">
          <div class="title-wrap">
            <IconHistory size="16" />
            <span>Recent Execution (Max 10)</span>
          </div>
          <button v-if="recentItems.length > 0" class="clear-btn" :class="{ 'is-confirming': isConfirmingClear }" @click="clearRecent">
            <IconShield v-if="isConfirmingClear" size="14" />
            <IconTrash v-else size="14" />
          </button>
        </div>

        <div v-if="recentItems.length === 0" class="empty-state">
          <IconPackage size="32" stroke-width="1" />
          <p>No recent history for this request.</p>
        </div>

        <div v-else class="history-list">
          <div v-for="item in recentItems" :key="item.id" class="history-item">
            <div class="item-content" @click="loadHistory(item)">
              <!-- Line 1: [Time] Duration -->
              <div class="item-title-row">
                <span class="time-bracket">[{{ formatDate(item.timestamp) }}]</span>
                <span class="duration">{{ item.duration }}ms</span>
              </div>

              <!-- Line 2: Status Method URL -->
              <div class="item-details-row">
                <span :class="['status-badge', getStatusClass(item.status)]">{{ item.status || 'ERR' }}</span>
                <span class="method">{{ item.method }}</span>
                <span class="item-url">{{ item.url }}</span>
              </div>
            </div>
            <div class="item-actions">
              <button class="action-btn run" @click.stop="runHistory(item)" title="Run this history">
                <IconPlayerPlay size="14" />
              </button>
              <button class="action-btn save" @click.stop="toggleSave(item, false)" title="Save permanently">
                <IconBookmark size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.history-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--app-bg-color);
  padding: 0;
  @include elements.scrollbar-hidden;
}

.unified-history-table {
  display: flex;
  flex-direction: column;
  border: var(--tab-border);
  background: var(--app-bg-color);
  width: 100%; /* Đảm bảo bằng độ rộng container cha */
}

.history-section {
  display: flex;
  flex-direction: column;
  flex: 1; /* Chia 50/50 */
  min-height: 150px;
}

.section-divider {
  height: 8px;
  background: var(--app-bg-color);
  border-top: var(--tab-border);
  border-bottom: var(--tab-border);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--tab-bg-color);
  border-bottom: var(--tab-border);
  font-size: 11px;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #ccc;
  border: 1px solid #999;
  color: #444;
  cursor: pointer;
  font-size: 10px;
  padding: 2px;
  border-radius: 0;
  font-weight: 600;

  &:hover {
    background: #bbb;
  }

  &.is-confirming {
    background: #ffcdd2;
    color: #c62828;
    border-color: #c62828;
    
    &:hover {
      background: #ef9a9a;
    }
  }
}

.history-list {
  display: flex;
  flex-direction: column;
  padding: 2px;
  gap: 2px;
  flex: 1; /* Chiếm hết phần còn lại của section */
  max-height: 202px; /* Vẫn giữ tối đa 4 dòng */
  overflow-y: auto;
  @include elements.scrollbar-hidden;
}

.history-item {
  display: flex;
  align-items: stretch;
  height: 48px;
  border: 1px solid #ccc;
  transition: background 0.1s;
  background: var(--app-bg-color);
  box-sizing: border-box;

  &:hover {
    background: var(--tab-bg-color-active);
    border-color: #999;
  }

  .item-content {
    flex: 1;
    padding: 4px 10px;
    cursor: pointer;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .item-name {
    font-weight: 700;
    color: #444;
  }

  .name-edit-input {
    font-size: 12px;
    font-weight: 700;
    border: 1px solid #007bff;
    background: #fff;
    outline: none;
    padding: 0 4px;
    height: 18px;
    width: 150px;
  }

  .time-bracket {
    font-size: 11px;
    color: #888;
  }

  .item-details-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 0 4px;
    border-radius: 0;
    min-width: 30px;
    text-align: center;
    border: 1px solid rgba(0,0,0,0.1);
    line-height: 14px;
  }

  .status-success { background: #c8e6c9; color: #2e7d32; }
  .status-error { background: #ffcdd2; color: #c62828; }
  .status-info { background: #bbdefb; color: #1565c0; }

  .method {
    font-size: 10px;
    font-weight: 800;
    color: #666;
  }

  .duration {
    font-size: 11px;
    color: #999;
  }

  .item-url {
    font-size: 11px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Menlo, Monaco, Consolas, monospace;
    flex: 1;
  }

  .item-actions {
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.1s;
    background: rgba(200, 200, 200, 0.2);
  }

  &:hover .item-actions {
    opacity: 1;
  }
}

.action-btn {
  background: #ddd;
  border: 1px solid #999;
  border-radius: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;

  &:hover {
    background: #ccc;
    color: #007bff;
    border-color: #888;
  }

  &.delete:hover {
    color: #c62828;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #888;
  text-align: center;
  background: var(--app-bg-color);
  flex: 1;

  &.mini {
    padding: 10px;
    font-size: 11px;
  }

  p {
    font-size: 12px;
    margin-top: 10px;
  }
}
</style>
