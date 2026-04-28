<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { RouteInfo } from '@/types'
import { useCollectionsStorage } from '@/storages'
import { IconCopy, IconFolderPlus, IconPencil, IconTrash, IconLayersSelected } from '@tabler/icons-vue'

const props = defineProps<{
  requests: RouteInfo[]
}>()

const emit = defineEmits<{
  (e: 'select', requestKey: string): void
}>()

const store = useCollectionsStorage()

onMounted(() => store.load())

const requestKeyOf = (req: RouteInfo) => `${req.method}::${req.route}`

const requestMap = computed(() => {
  const m = new Map<string, RouteInfo>()
  for (const r of props.requests) m.set(requestKeyOf(r), r)
  return m
})

const resolveRequest = (requestKey: string) => {
  const byComposite = requestMap.value.get(requestKey)
  if (byComposite) return { request: byComposite, compositeKey: requestKey }

  // Backward compatibility: older stored items might have been saved by unstable `id`
  const byId = props.requests.find(r => (r as any).id === requestKey)
  if (byId) {
    const compositeKey = requestKeyOf(byId)
    return { request: byId, compositeKey }
  }

  return null
}

const selectedItemIds = ref<Set<string>>(new Set())
const activeItemId = ref<string | null>(null)
watch(() => store.activeCollectionId, () => selectedItemIds.value = new Set())

const otherCollections = computed(() => store.collections.filter(c => c.id !== store.activeCollectionId))
const copyTargetId = ref<string>('')

watch(otherCollections, (list) => {
  if (!list.some(c => c.id === copyTargetId.value)) copyTargetId.value = list[0]?.id ?? ''
}, { immediate: true })

const onCreateCollection = () => {
  const name = window.prompt('Collection name?')
  if (name == null) return
  store.createCollection(name)
}

const onRenameCollection = () => {
  const active = store.activeCollection
  if (!active) return
  if (active.isDefault) return
  const name = window.prompt('Rename collection:', active.name)
  if (name == null) return
  store.renameCollection(active.id, name)
}

const onDeleteCollection = () => {
  const active = store.activeCollection
  if (!active) return
  if (active.isDefault) return
  if (!window.confirm(`Delete collection "${active.name}"?`)) return
  store.deleteCollection(active.id)
}

const toggleSelected = (id: string) => {
  const next = new Set(selectedItemIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedItemIds.value = next
}

const toggleSelectedOnly = (id: string) => {
  toggleSelected(id)
}

const onRemoveSelected = () => {
  const active = store.activeCollection
  if (!active) return
  const ids = Array.from(selectedItemIds.value)
  for (const itemId of ids) store.removeItem(active.id, itemId)
  selectedItemIds.value = new Set()
}

const onCopySelected = () => {
  const active = store.activeCollection
  if (!active) return
  if (!copyTargetId.value) return
  const ids = Array.from(selectedItemIds.value)
  if (ids.length === 0) return
  store.copyItems(active.id, copyTargetId.value, ids)
  selectedItemIds.value = new Set()
}

const onClickItem = (e: MouseEvent, itemId: string, requestKey: string) => {
  if (e.ctrlKey) {
    toggleSelectedOnly(itemId)
    return
  }
  activeItemId.value = itemId
  const resolved = resolveRequest(requestKey)
  emit('select', resolved?.compositeKey ?? requestKey)
}

const onRenameItem = (itemId: string) => {
  const active = store.activeCollection
  if (!active) return
  const item = active.items.find(i => i.id === itemId)
  if (!item) return
  const current = (item.label ?? '').trim()
  const name = window.prompt('Request name (does not change URL):', current)
  if (name == null) return
  store.setItemsLabel(active.id, [itemId], name)
}

watch(requestMap, () => {
  // Opportunistic migration: if a stored item matches by current request id, rewrite to composite key
  const active = store.activeCollection
  if (!active) return
  for (const item of active.items) {
    if (item.requestKey.includes('::')) continue
    const byId = props.requests.find(r => (r as any).id === item.requestKey)
    if (byId) item.requestKey = requestKeyOf(byId)
  }
})

const activeGroups = computed(() => {
  const active = store.activeCollection
  if (!active) return []
  const groups = new Set<string>()
  for (const item of active.items) {
    const g = (item.group ?? '').trim()
    if (g) groups.add(g)
  }
  return Array.from(groups).sort((a, b) => a.localeCompare(b))
})

const groupTarget = ref<string>('')
watch(activeGroups, (groups) => {
  if (groupTarget.value && groups.includes(groupTarget.value)) return
  groupTarget.value = groups[0] ?? ''
}, { immediate: true })

const onCreateGroup = () => {
  const name = window.prompt('Group name?')
  if (name == null) return
  const trimmed = name.trim()
  if (!trimmed) return
  groupTarget.value = trimmed
  onApplyGroup()
}

const onApplyGroup = () => {
  const active = store.activeCollection
  if (!active) return
  const ids = Array.from(selectedItemIds.value)
  if (ids.length === 0) return
  store.setItemsGroup(active.id, ids, groupTarget.value)
  selectedItemIds.value = new Set()
}

const groupedItems = computed(() => {
  const active = store.activeCollection
  if (!active) return []

  const byGroup = new Map<string, typeof active.items>()
  for (const item of active.items) {
    const group = (item.group ?? '').trim() || 'UNGROUPED'
    if (!byGroup.has(group)) byGroup.set(group, [])
    byGroup.get(group)!.push(item)
  }

  const orderedGroups = Array.from(byGroup.keys()).sort((a, b) => {
    if (a === 'UNGROUPED') return 1
    if (b === 'UNGROUPED') return -1
    return a.localeCompare(b)
  })

  return orderedGroups.map(group => ({ group, items: byGroup.get(group)! }))
})
</script>

<template>
  <div class="collection-panel">
    <div class="collection-header">
      <select
          class="collection-select"
          :value="store.activeCollectionId ?? ''"
          @change="store.setActiveCollection(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="c in store.collections" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>

      <div class="header-actions">
        <button class="icon-btn" title="New collection" @click="onCreateCollection">
          <IconFolderPlus />
        </button>
        <button class="icon-btn" title="Rename collection" :disabled="!!store.activeCollection?.isDefault" @click="onRenameCollection">
          <IconPencil />
        </button>
        <button class="icon-btn" title="Delete collection" :disabled="!!store.activeCollection?.isDefault" @click="onDeleteCollection">
          <IconTrash />
        </button>
      </div>
    </div>

    <div class="collection-actions">
      <button class="action-btn" :disabled="selectedItemIds.size === 0" @click="onRemoveSelected">
        Remove
      </button>

      <div class="group-row">
        <select class="group-select" v-model="groupTarget">
          <option value="">(no group)</option>
          <option v-for="g in activeGroups" :key="g" :value="g">{{ g }}</option>
        </select>
        <button class="action-btn" :disabled="selectedItemIds.size === 0" @click="onApplyGroup" title="Assign group to selected">
          <IconLayersSelected />
          Group
        </button>
        <button class="action-btn" :disabled="selectedItemIds.size === 0" @click="onCreateGroup" title="Create new group + assign selected">
          + New
        </button>
      </div>

      <div class="copy-row">
        <select class="copy-select" v-model="copyTargetId" :disabled="otherCollections.length === 0">
          <option v-for="c in otherCollections" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button class="action-btn" :disabled="selectedItemIds.size === 0 || !copyTargetId" @click="onCopySelected" title="Copy selected to collection">
          <IconCopy />
          Copy
        </button>
      </div>
    </div>

    <div class="collection-list">
      <div v-if="!store.activeCollection || store.activeCollection.items.length === 0" class="empty">
        Empty collection. Use + on the request list to add items.
      </div>

      <template v-else>
        <div v-for="block in groupedItems" :key="block.group" class="group-block">
          <div class="group-title">{{ block.group }}</div>
          <div
              v-for="item in block.items"
              :key="item.id"
              class="collection-item"
              :class="{ active: activeItemId === item.id }"
              @click="onClickItem($event, item.id, item.requestKey)"
          >
            <input
                class="item-checkbox"
                type="checkbox"
                :checked="selectedItemIds.has(item.id)"
                title="Ctrl + Click"
                @click.stop
                @change="toggleSelected(item.id)"
            />
            <div class="item-text">
              <div class="item-title">
                <span class="method">{{ resolveRequest(item.requestKey)?.request.method ?? '??' }}</span>
                <span class="route" :title="resolveRequest(item.requestKey)?.request.route ?? item.requestKey">
                  {{
                    (item.label && item.label.trim())
                      ? item.label
                      : (resolveRequest(item.requestKey)?.request.route ?? item.requestKey)
                  }}
                </span>
              </div>
            </div>
            <button class="item-rename" title="Rename (does not change URL)" @click.stop="onRenameItem(item.id)">
              <IconPencil />
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collection-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 8px;
  border: 1px solid #888888;
  background: transparent;
  color: inherit;
  min-height: 0;
}

.collection-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collection-select {
  flex: 1;
  height: 30px;
  border: 1px solid #888888;
  background: #f8f9fa;
  color: inherit;
  outline: none;
}

.header-actions { display: flex; gap: 6px; }
.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
}
.icon-btn:hover { background: #e9ecef; }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon-btn:hover:disabled { background: #f8f9fa; }
.icon-btn :deep(svg) { width: 16px; height: 16px; }

.collection-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.action-btn {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.action-btn:hover:not(:disabled) { background: #e9ecef; }
.action-btn :deep(svg) { width: 16px; height: 16px; }

.copy-row { display: flex; gap: 6px; align-items: center; }
.group-row { display: flex; gap: 6px; align-items: center; }
.group-select {
  flex: 1;
  height: 30px;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  color: inherit;
}
.copy-select {
  height: 30px;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  color: inherit;
}

.collection-list { flex: 1; overflow: auto; min-height: 0; border-top: 1px solid #eeeeee; padding-top: 8px; }
.empty { padding: 12px; opacity: 0.8; }

.group-block { margin-bottom: 10px; }
.group-title { font-weight: bold; padding: 4px 6px; border-bottom: 1px solid #eee; margin-bottom: 4px; }

.collection-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  cursor: pointer;
}
.collection-item:hover { background: #e2e2e2; }
.collection-item.active { background: #e9ecef; border-left: 3px solid #007bff; padding-left: 7px; }
.item-checkbox { flex-shrink: 0; }
.item-text { min-width: 0; flex: 1; }
.item-title { display: flex; gap: 4px; min-width: 0; }
.method { color: blue; flex-shrink: 0; }
.route { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.item-rename {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  background: #f8f9fa;
  cursor: pointer;
  opacity: 0.9;
}
.collection-item:hover .item-rename { opacity: 1; }
.item-rename:hover { background: #e9ecef; }
.item-rename :deep(svg) { width: 14px; height: 14px; color: #495057; }
</style>
