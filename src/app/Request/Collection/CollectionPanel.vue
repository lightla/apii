<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { RouteInfo } from '@/types'
import { useCollectionsStorage } from '@/storages'
import {
  IconCopy,
  IconDotsVertical,
  IconFolderPlus,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconX,
} from '@tabler/icons-vue'

const props = defineProps<{
  requests: RouteInfo[]
}>()

const emit = defineEmits<{
  (e: 'select', payload: { requestId: string, storageKey: string }): void
}>()

const store = useCollectionsStorage()

onMounted(() => store.load())

const resolveRequestById = (requestId: string) => {
  return props.requests.find(r => r.id === requestId) || null
}

const selectedItemIds = ref<Set<string>>(new Set())
const activeItemId = ref<string | null>(null)
const requestSearch = ref('')
const requestSearchInput = ref<HTMLInputElement | null>(null)
const panelRef = ref<HTMLDivElement | null>(null)
const addTargetGroup = ref<string | null>(null)
const menuItemId = ref<string | null>(null)
const menuGroup = ref<string | null>(null)
const draggingItemIds = ref<string[]>([])
const draggingGroup = ref<string | null>(null)
const dragOverGroup = ref<string | null>(null)
const dragOverGroupPosition = ref<'before' | 'after' | null>(null)
const dragOverItemId = ref<string | null>(null)
const dragOverZone = ref<string | null>(null)
const suppressNextClick = ref(false)
const editingItemId = ref<string | null>(null)
const editingItemLabel = ref('')
const editingGroupId = ref<string | null>(null)
const editingGroupLabel = ref('')
const editingInput = ref<HTMLInputElement | null>(null)
const editingGroupInput = ref<HTMLInputElement | null>(null)

watch(() => store.activeCollectionId, () => {
  selectedItemIds.value = new Set()
  activeItemId.value = null
  closeMenus()
})

// No longer needed: ID is a stable black box string from the source.
watch(() => props.requests, () => {
  // Logic updated to rely on stable IDs
}, { deep: true })

const activeGroups = computed(() => {
  const active = store.activeCollection
  if (!active) return []

  const knownNames = new Set<string>()
  const ordered = [...(active.groups ?? [])]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(group => {
      knownNames.add(group.name)
      return group.name
    })

  for (const item of active.items) {
    const group = (item.group ?? '').trim()
    if (group && !knownNames.has(group)) {
      ordered.push(group)
      knownNames.add(group)
    }
  }

  return ordered
})

const groupedItems = computed(() => {
  const active = store.activeCollection
  if (!active) return []

  const byGroup = new Map<string, typeof active.items>()
  for (const group of activeGroups.value) byGroup.set(group, [])

  const sortedItems = [...active.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  for (const item of sortedItems) {
    const group = (item.group ?? '').trim() || 'UNGROUPED'
    if (!byGroup.has(group)) byGroup.set(group, [])
    byGroup.get(group)!.push(item)
  }

  if (!byGroup.has('UNGROUPED')) byGroup.set('UNGROUPED', [])

  const orderedGroups = [
    ...activeGroups.value.filter(group => byGroup.has(group)),
    ...Array.from(byGroup.keys()).filter(group => group !== 'UNGROUPED' && !activeGroups.value.includes(group)),
  ]

  if (byGroup.has('UNGROUPED')) orderedGroups.push('UNGROUPED')

  return orderedGroups.map(group => ({ group, items: byGroup.get(group)! }))
})

const filteredRequests = computed(() => {
  const term = requestSearch.value.trim().toLowerCase()
  if (!term) return props.requests

  return props.requests.filter(req => {
    return [req.method, req.route, req.group]
      .some(value => value && String(value).toLowerCase().includes(term))
  })
})

const selectedCount = computed(() => selectedItemIds.value.size)

function closeMenus() {
  menuItemId.value = null
  menuGroup.value = null
}

function getItemById(itemId: string) {
  const active = store.activeCollection
  if (!active) return null
  return active.items.find(item => item.id === itemId) ?? null
}

function getCurrentGroupName() {
  const active = store.activeCollection
  if (!active) return ''
  const fromActive = activeItemId.value ? getItemById(activeItemId.value) : null
  const fromSelected = Array.from(selectedItemIds.value).map(id => getItemById(id)).find(Boolean)
  const source = fromActive ?? fromSelected
  return (source?.group ?? '').trim()
}

function onPanelKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
  if (!e.ctrlKey || e.key.toLowerCase() !== 'a') return
  const active = store.activeCollection
  if (!active) return

  e.preventDefault()
  const targetGroup = getCurrentGroupName()
  const ids = active.items
    .filter(item => (item.group ?? '').trim() === targetGroup)
    .map(item => item.id)

  if (ids.length > 0) {
    selectedItemIds.value = new Set(ids)
    if (activeItemId.value && !ids.includes(activeItemId.value)) activeItemId.value = ids[0]
  }
}

function onPanelMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (target?.closest('.request-popup')) return
  panelRef.value?.focus()
}

function onCreateCollection() {
  const name = window.prompt('Collection name?')
  if (name == null) return
  store.createCollection(name)
}

function onRenameCollection() {
  const active = store.activeCollection
  if (!active || active.isDefault) return
  const name = window.prompt('Rename collection:', active.name)
  if (name == null) return
  store.renameCollection(active.id, name)
}

function onDeleteCollection() {
  const active = store.activeCollection
  if (!active || active.isDefault) return
  if (!window.confirm(`Delete collection "${active.name}"?`)) return
  store.deleteCollection(active.id)
}

function onCreateGroup() {
  const active = store.activeCollection
  if (!active) return
  const name = window.prompt('Group name?')
  if (name == null) return
  store.createGroup(active.id, name)
}

function onRenameGroup(group: string) {
  const active = store.activeCollection
  if (!active || group === 'UNGROUPED') return
  editingGroupLabel.value = group
  editingGroupId.value = group
  closeMenus()
  nextTick(() => editingGroupInput.value?.focus())
}

function applyRenameGroup() {
  if (!editingGroupId.value) return
  const active = store.activeCollection
  if (!active) return
  
  const oldName = editingGroupId.value
  const newName = editingGroupLabel.value.trim()
  
  if (newName && newName !== oldName) {
    store.renameGroup(active.id, oldName, newName)
  }
  editingGroupId.value = null
}

function cancelRenameGroup() {
  editingGroupId.value = null
}

function onDeleteGroup(group: string) {
  const active = store.activeCollection
  if (!active || group === 'UNGROUPED') return
  if (!window.confirm(`Delete group "${group}"? Items move to UNGROUPED.`)) return
  store.deleteGroup(active.id, group)
  closeMenus()
}

function openAddRequest(group: string) {
  addTargetGroup.value = group === 'UNGROUPED' ? '' : group
  requestSearch.value = ''
  closeMenus()
  nextTick(() => requestSearchInput.value?.focus())
}

function closeAddRequest() {
  addTargetGroup.value = null
  requestSearch.value = ''
}

function addRequestToGroup(route: RouteInfo) {
  // Clone editor state from the current request id, but persist a stable request key so items survive refresh.
  store.addRequestToActive(route.id, addTargetGroup.value ?? '')
}

function toggleSelected(id: string) {
  const next = new Set(selectedItemIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedItemIds.value = next
}

function isSelected(id: string) {
  return selectedItemIds.value.has(id) || (selectedItemIds.value.size > 0 && activeItemId.value === id)
}

function onClickItem(e: MouseEvent, itemId: string, requestId: string) {
  if (suppressNextClick.value) {
    suppressNextClick.value = false
    return
  }

  if (e.ctrlKey) {
    const next = new Set(selectedItemIds.value)
    if (activeItemId.value === itemId) {
      next.delete(itemId)
      selectedItemIds.value = next
      activeItemId.value = null
      return
    }
    if (activeItemId.value && activeItemId.value !== itemId && next.size === 0) {
      next.add(activeItemId.value)
    }
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    selectedItemIds.value = next
    if (activeItemId.value === itemId && !next.has(itemId)) activeItemId.value = null
    if (next.size === 0) activeItemId.value = null
    return
  }
  selectedItemIds.value = new Set()
  activeItemId.value = itemId
  const resolved = resolveRequestById(requestId)
  emit('select', { requestId: (resolved as any)?.id ?? requestId, storageKey: itemId })
}

function onRenameItem(itemId: string) {
  const item = getItemById(itemId)
  if (!item) return
  editingItemLabel.value = itemLabel(item)
  editingItemId.value = itemId
  closeMenus()
  nextTick(() => editingInput.value?.focus())
}

function applyRenameItem() {
  if (!editingItemId.value) return
  const id = editingItemId.value
  const label = editingItemLabel.value.trim()
  store.setItemsLabel(store.activeCollectionId!, [id], label)
  editingItemId.value = null
}

function cancelRenameItem() {
  editingItemId.value = null
}

function removeItems(itemIds: string[]) {
  const active = store.activeCollection
  if (!active) return
  for (const itemId of itemIds) store.removeItem(active.id, itemId)
  selectedItemIds.value = new Set([...selectedItemIds.value].filter(id => !itemIds.includes(id)))
  closeMenus()
}

function duplicateItems(itemIds: string[]) {
  const active = store.activeCollection
  if (!active || itemIds.length === 0) return
  store.duplicateItems(active.id, itemIds)
  selectedItemIds.value = new Set()
  closeMenus()
}

function duplicateGroup(group: string) {
  const active = store.activeCollection
  if (!active || group === 'UNGROUPED') return
  store.duplicateGroup(active.id, group)
  closeMenus()
}

function onItemDragStart(e: DragEvent, itemId: string) {
  suppressNextClick.value = true
  const ids = selectedItemIds.value.size > 0
    ? Array.from(selectedItemIds.value)
    : [itemId]
  draggingItemIds.value = ids
  e.dataTransfer?.setData('text/plain', JSON.stringify({ type: 'collection-items', ids }))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onItemDragOver(e: DragEvent, itemId: string) {
  if (!draggingItemIds.value.length) return
  e.preventDefault()
  dragOverItemId.value = itemId
  dragOverZone.value = null
  dragOverGroup.value = null
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onItemDrop(e: DragEvent, group: string, beforeItemId?: string) {
  e.preventDefault()
  e.stopPropagation()
  const active = store.activeCollection
  if (!active) return

  if (draggingGroup.value) {
    store.reorderGroups(active.id, draggingGroup.value, group, 'before')
    draggingItemIds.value = []
    draggingGroup.value = null
    dragOverGroup.value = null
    dragOverGroupPosition.value = null
    dragOverItemId.value = null
    dragOverZone.value = null
    return
  }

  const ids = selectedItemIds.value.size > 0
    ? Array.from(selectedItemIds.value)
    : [...draggingItemIds.value]
  if (ids.length === 0) return

  const targetGroup = group === 'UNGROUPED' ? '' : group
  store.moveItemsToPosition(active.id, ids, targetGroup, beforeItemId)
  draggingItemIds.value = []
  dragOverItemId.value = null
  dragOverGroup.value = null
  dragOverZone.value = null
}

function onZoneDragOver(e: DragEvent, zoneKey: string) {
  if (!draggingItemIds.value.length) return
  e.preventDefault()
  dragOverZone.value = zoneKey
  dragOverItemId.value = null
  dragOverGroup.value = null
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onGroupDragStart(e: DragEvent, group: string) {
  if (group === 'UNGROUPED') return
  draggingGroup.value = group
  e.dataTransfer?.setData('text/plain', JSON.stringify({ type: 'collection-group', group }))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onGroupDragOver(e: DragEvent, group: string) {
  if (!draggingGroup.value) return
  e.preventDefault()
  dragOverGroupPosition.value = 'before'
  dragOverGroup.value = group
  dragOverItemId.value = null
  dragOverZone.value = null
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onGroupDrop(e: DragEvent, group: string) {
  e.preventDefault()
  const active = store.activeCollection
  if (!active || !draggingGroup.value) return

  store.reorderGroups(active.id, draggingGroup.value, group, 'before')

  draggingItemIds.value = []
  draggingGroup.value = null
  dragOverGroup.value = null
  dragOverGroupPosition.value = null
  dragOverItemId.value = null
  dragOverZone.value = null
}

function onDragEnd() {
  draggingItemIds.value = []
  draggingGroup.value = null
  dragOverGroup.value = null
  dragOverGroupPosition.value = null
  dragOverItemId.value = null
  dragOverZone.value = null
  suppressNextClick.value = false
}

function itemLabel(item: { requestId?: string; requestKey: string; label?: string }) {
  const label = (item.label ?? '').trim()
  if (label) return label
  return resolveRequestById(item.requestId ?? item.requestKey)?.route ?? item.requestKey
}
</script>

<template>
  <div ref="panelRef" class="collection-panel" tabindex="0" @click="closeMenus" @mousedown="onPanelMouseDown" @keydown="onPanelKeydown">
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

      <button class="icon-btn" title="New collection" @click.stop="onCreateCollection">
        <IconFolderPlus />
      </button>
      <button class="icon-btn" title="Rename collection" :disabled="!!store.activeCollection?.isDefault" @click.stop="onRenameCollection">
        <IconPencil />
      </button>
      <button class="icon-btn" title="Delete collection" :disabled="!!store.activeCollection?.isDefault" @click.stop="onDeleteCollection">
        <IconTrash />
      </button>
    </div>

    <div class="collection-toolbar">
      <button class="toolbar-btn" title="New group" @click="onCreateGroup">
        <IconPlus />
        Group
      </button>

      <template v-if="selectedCount > 0">
        <button class="toolbar-btn" title="Remove selected" @click="removeItems(Array.from(selectedItemIds))">
          <IconTrash />
          {{ selectedCount }}
        </button>
        <button class="toolbar-btn" title="Duplicate selected" @click="duplicateItems(Array.from(selectedItemIds))">
          <IconCopy />
          Duplicate
        </button>
      </template>
    </div>

    <div class="collection-list">
      <div
          v-for="block in groupedItems"
          :key="block.group"
          class="group-block"
          :class="{ 'drag-over-before': dragOverGroup === block.group }"
          @dragover="onGroupDragOver($event, block.group)"
          @drop="onGroupDrop($event, block.group)"
      >
        <div
            class="group-title"
            :draggable="block.group !== 'UNGROUPED'"
            @dragstart="onGroupDragStart($event, block.group)"
            @dragend="onDragEnd"
            @dblclick="block.group !== 'UNGROUPED' && onRenameGroup(block.group)"
            @contextmenu.prevent.stop="menuGroup = block.group; menuItemId = null"
        >
          <span class="group-name" v-if="editingGroupId !== block.group">
            <IconGripVertical v-if="block.group !== 'UNGROUPED'" />
            {{ block.group }}
          </span>

          <input
              v-else
              ref="editingGroupInput"
              v-model="editingGroupLabel"
              class="inline-rename-input group-rename-input"
              @keydown.enter="applyRenameGroup"
              @keydown.esc="cancelRenameGroup"
              @blur="applyRenameGroup"
              @click.stop
          />

          <div class="group-actions">
            <button class="mini-icon" title="Add request" @click="openAddRequest(block.group)">
              <IconPlus />
            </button>
            <button class="mini-icon" title="Group menu" @click.stop="menuGroup = menuGroup === block.group ? null : block.group; menuItemId = null">
              <IconDotsVertical />
            </button>
          </div>

          <div v-if="menuGroup === block.group" class="context-menu" @click.stop>
            <button @click="openAddRequest(block.group)">Add request</button>
            <button :disabled="block.group === 'UNGROUPED'" @click="duplicateGroup(block.group)">Duplicate group</button>
            <button :disabled="block.group === 'UNGROUPED'" @click="onRenameGroup(block.group)">Rename group</button>
            <button :disabled="block.group === 'UNGROUPED'" @click="onDeleteGroup(block.group)">Delete group</button>
          </div>
        </div>

        <div
            v-if="block.items.length === 0"
            class="empty-group"
            :class="{ active: dragOverZone === `${block.group}:empty` }"
            @dragover="onZoneDragOver($event, `${block.group}:empty`)"
            @drop="onItemDrop($event, block.group)"
        >
          <button class="empty-add" title="Add request" @click="openAddRequest(block.group)">
            <IconPlus />
          </button>
        </div>

        <div
            v-for="item in block.items"
            :key="item.id"
            class="collection-item"
            :class="{ active: activeItemId === item.id, selected: isSelected(item.id), 'drag-over-item': dragOverItemId === item.id, 'is-editing': editingItemId === item.id }"
            draggable="true"
            @click="onClickItem($event, item.id, item.requestId ?? item.requestKey)"
            @dblclick="onRenameItem(item.id)"
            @dragstart="onItemDragStart($event, item.id)"
            @dragover="onItemDragOver($event, item.id)"
            @drop="onItemDrop($event, block.group, item.id)"
            @dragend="onDragEnd"
            @contextmenu.prevent.stop="menuItemId = item.id; menuGroup = null"
        >
          <span class="method" v-if="editingItemId !== item.id">{{ resolveRequestById(item.requestId ?? item.requestKey)?.method ?? '??' }}</span>
          <span class="route" v-if="editingItemId !== item.id" :title="resolveRequestById(item.requestId ?? item.requestKey)?.route ?? item.requestKey">
            {{ itemLabel(item) }}
          </span>

          <input
              v-else
              ref="editingInput"
              v-model="editingItemLabel"
              class="inline-rename-input"
              @keydown.enter="applyRenameItem"
              @keydown.esc="cancelRenameItem"
              @blur="applyRenameItem"
              @click.stop
          />

          <button class="mini-icon item-menu-btn" title="Request menu" @click.stop="menuItemId = menuItemId === item.id ? null : item.id; menuGroup = null">
            <IconDotsVertical />
          </button>

          <div v-if="menuItemId === item.id" class="context-menu item-context" @click.stop>
            <button @click="onRenameItem(item.id)">Rename</button>
            <button @click="duplicateItems([item.id])">Duplicate</button>
            <button @click="removeItems([item.id])">Remove</button>
          </div>
        </div>

        <div
            v-if="block.items.length > 0"
            class="drop-zone bottom"
            :class="{ active: dragOverZone === `${block.group}:bottom` }"
            @dragover="onZoneDragOver($event, `${block.group}:bottom`)"
            @drop="onItemDrop($event, block.group)"
        ></div>
      </div>
    </div>

    <div v-if="addTargetGroup !== null" class="request-popup-backdrop" @click="closeAddRequest">
      <div class="request-popup" @click.stop>
        <div class="popup-header">
          <div class="popup-search">
            <IconSearch />
            <input ref="requestSearchInput" v-model="requestSearch" placeholder="Search request..." />
          </div>
          <button class="icon-btn" title="Close" @click="closeAddRequest">
            <IconX />
          </button>
        </div>

        <div class="popup-list">
          <button
              v-for="request in filteredRequests"
              :key="request.id"
              class="popup-request"
              @click="addRequestToGroup(request)"
          >
            <span class="method">{{ request.method || 'POST' }}</span>
            <span class="route">{{ request.route }}</span>
          </button>
        </div>
      </div>
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
  position: relative;
}

.collection-header {
  display: grid;
  grid-template-columns: 1fr 30px 30px 30px;
  align-items: center;
  gap: 6px;
}

.collection-select,
.compact-select {
  height: 30px;
  padding: 0 8px;
  border: 1px solid #888888;
  background: #f8f9fa;
  color: inherit;
  outline: none;
  min-width: 0;
}

.icon-btn,
.toolbar-btn,
.mini-btn,
.mini-icon {
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
}

.icon-btn:hover,
.toolbar-btn:hover:not(:disabled),
.mini-btn:hover:not(:disabled),
.mini-icon:hover:not(:disabled) {
  background: #e9ecef;
}

.icon-btn:disabled,
.toolbar-btn:disabled,
.mini-btn:disabled,
.mini-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn :deep(svg),
.toolbar-btn :deep(svg),
.mini-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.collection-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
}

.toolbar-btn {
  height: 30px;
  padding: 0 9px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.compact-select {
  max-width: 150px;
}

.collection-list {
  flex: 1;
  overflow: auto;
  min-height: 0;
  border-top: 1px solid #eeeeee;
  padding-top: 6px;
}

.group-block {
  position: relative;
  margin-bottom: 8px;
}

.group-block.drag-over-before::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-top: 2px solid #007bff;
}

.group-title {
  min-height: 28px;
  padding: 3px 4px 3px 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eeeeee;
  font-weight: bold;
  position: relative;
}

.group-title[draggable="true"] {
  cursor: grab;
}

.group-title[draggable="true"]:active {
  cursor: grabbing;
}

.group-name {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.group-name :deep(svg) {
  width: 15px;
  height: 15px;
  color: #777777;
}

.group-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.mini-btn {
  height: 24px;
  padding: 0 7px;
}

.mini-icon {
  width: 24px;
  height: 24px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.empty-group {
  padding: 0;
  border-top: 2px solid transparent;
}

.empty-group.active {
  border-top-color: #007bff;
}

.empty-add {
  width: 100%;
  min-height: 30px;
  padding: 4px 5px 4px 8px;
  border: 1px dashed #bbbbbb;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.empty-add:hover {
  background: #e9ecef;
}

.empty-add :deep(svg) {
  width: 16px;
  height: 16px;
  color: #495057;
}

.collection-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 4px 5px 4px 8px;
  cursor: pointer;
}

.collection-item:hover,
.collection-item.selected {
  background: #e2e2e2;
}

.collection-item.selected {
  background: #e9ecef;
  border-left: 3px solid #007bff;
  padding-left: 5px;
}

.collection-item.drag-over-item {
  border-top: 2px solid #007bff;
  padding-top: 2px;
}

.collection-item.active {
  background: #e9ecef;
  border-left: 3px solid #007bff;
  padding-left: 5px;
}

.collection-item.active.selected {
  background: #e9ecef;
}

.drop-zone {
  height: 4px;
  margin: 0;
  border-top: 2px solid transparent;
}

.drop-zone.bottom {
  min-height: 4px;
}

.drop-zone.active {
  border-top-color: #007bff;
}

.method {
  color: blue;
  flex-shrink: 0;
}

.route {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inline-rename-input {
  flex: 1;
  height: 22px;
  padding: 0 4px;
  border: 1px solid #007bff;
  background: white;
  outline: none;
  font-size: inherit;
  font-family: inherit;
}

.group-rename-input {
  height: 24px;
  margin-right: 8px;
}

.item-menu-btn {
  opacity: 0;
}

.collection-item:hover .item-menu-btn,
.item-menu-btn:focus,
.collection-item.active .item-menu-btn {
  opacity: 1;
}

.context-menu {
  position: absolute;
  top: 28px;
  right: 4px;
  z-index: 40;
  min-width: 130px;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
  box-shadow: 0 3px 8px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
}

.item-context {
  top: 26px;
}

.context-menu button {
  height: 28px;
  padding: 0 9px;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.context-menu button:hover:not(:disabled) {
  background: #e9ecef;
}

.context-menu button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.request-popup-backdrop {
  position: absolute;
  inset: 0;
  z-index: 80;
  background: rgba(244,244,244,0.82);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 44px 12px 12px;
}

.request-popup {
  width: min(520px, 100%);
  max-height: 78%;
  display: flex;
  flex-direction: column;
  border: 1px solid #888888;
  background: var(--app-bg-color);
  box-shadow: 0 6px 18px rgba(0,0,0,0.16);
}

.popup-header {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #eeeeee;
}

.popup-search {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border: 1px solid #aaaaaa;
  background: #f8f9fa;
}

.popup-search :deep(svg) {
  width: 16px;
  height: 16px;
  color: #777777;
}

.popup-search input {
  width: 100%;
  border: 0;
  outline: none;
  background: transparent;
}

.popup-list {
  overflow: auto;
  padding: 6px;
}

.popup-request {
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.popup-request:hover {
  background: #e2e2e2;
}
</style>
