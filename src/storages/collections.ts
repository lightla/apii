import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { cloneRequestData, deleteRequestData } from '@/utils/storage-clone'

export type CollectionItem = {
  id: string
  requestId?: string
  requestKey: string
  label?: string
  group?: string
  sortOrder?: number
  addedAt: number
}

export type CollectionGroup = {
  id: string
  name: string
  sortOrder: number
}

export type RequestCollection = {
  id: string
  name: string
  isDefault?: boolean
  groups?: CollectionGroup[]
  items: CollectionItem[]
  createdAt: number
}

const STORAGE_KEY_COLLECTIONS = 'requestCollections:v1'
const STORAGE_KEY_ACTIVE_COLLECTION_ID = 'requestCollections:activeId:v1'

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function nextSortOrder(values: Array<{ sortOrder?: number }>) {
  const max = values.reduce((result, item) => Math.max(result, item.sortOrder ?? 0), 0)
  return max + 1000
}

function normalizeCollection(collection: RequestCollection) {
  const rawGroups = (Array.isArray(collection.groups) ? collection.groups : []) as Array<string | CollectionGroup>
  const normalizedGroups: CollectionGroup[] = []

  rawGroups.forEach((group, index) => {
    if (typeof group === 'string') {
      const name = group.trim()
      if (!name) return
      normalizedGroups.push({ id: nanoid(), name, sortOrder: (index + 1) * 1000 })
      return
    }

    if (group && typeof group === 'object') {
      const name = String((group as CollectionGroup).name ?? '').trim()
      if (!name) return
      normalizedGroups.push({
        id: (group as CollectionGroup).id || nanoid(),
        name,
        sortOrder: Number((group as CollectionGroup).sortOrder ?? (index + 1) * 1000),
      })
    }
  })

  collection.groups = normalizedGroups

  collection.items.forEach((item, index) => {
    if (item.sortOrder == null) item.sortOrder = (index + 1) * 1000
    if (!item.requestId) item.requestId = item.requestKey
    const group = (item.group ?? '').trim()
    if (group && !collection.groups!.some(g => g.name === group)) {
      collection.groups!.push({ id: nanoid(), name: group, sortOrder: nextSortOrder(collection.groups!) })
    }
  })
}

export const useCollectionsStorage = defineStore('request-collections', () => {
  const collections = ref<RequestCollection[]>([])
  const activeCollectionId = ref<string | null>(null)

  const activeCollection = computed(() => {
    if (!activeCollectionId.value) return null
    return collections.value.find(c => c.id === activeCollectionId.value) ?? null
  })

  const ensureDefaultCollection = () => {
    if (collections.value.length > 0) {
      const hasDefault = collections.value.some(c => c.isDefault)
      for (const collection of collections.value) {
        normalizeCollection(collection)
      }
      if (!hasDefault) {
        // Backward compatibility: mark the first "Default" (or first item) as default
        const maybeDefault = collections.value.find(c => c.name === 'Default') ?? collections.value[0]
        if (maybeDefault) maybeDefault.isDefault = true
      }
      return
    }
    const defaultCollection: RequestCollection = {
      id: nanoid(),
      name: 'Default',
      isDefault: true,
      groups: [],
      items: [],
      createdAt: Date.now(),
    }
    collections.value = [defaultCollection]
    activeCollectionId.value = defaultCollection.id
  }

  const load = () => {
    const loadedCollections = safeParseJson<RequestCollection[]>(localStorage.getItem(STORAGE_KEY_COLLECTIONS))
    const loadedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE_COLLECTION_ID)

    if (Array.isArray(loadedCollections)) collections.value = loadedCollections
    if (loadedActiveId) activeCollectionId.value = loadedActiveId

    ensureDefaultCollection()
    if (!activeCollection.value) activeCollectionId.value = collections.value[0]?.id ?? null
  }

  const persist = () => {
    localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(collections.value))
    if (activeCollectionId.value) localStorage.setItem(STORAGE_KEY_ACTIVE_COLLECTION_ID, activeCollectionId.value)
  }

  const createCollection = (name: string) => {
    const trimmed = name.trim()
    const newCollection: RequestCollection = {
      id: nanoid(),
      name: trimmed || `Collection ${collections.value.length + 1}`,
      isDefault: false,
      groups: [],
      items: [],
      createdAt: Date.now(),
    }
    collections.value = [newCollection, ...collections.value]
    activeCollectionId.value = newCollection.id
  }

  const renameCollection = (id: string, name: string) => {
    const target = collections.value.find(c => c.id === id)
    if (!target) return
    if (target.isDefault) return
    const trimmed = name.trim()
    if (!trimmed) return
    target.name = trimmed
  }

  const deleteCollection = (id: string) => {
    if (collections.value.length <= 1) return
    const next = collections.value.filter(c => c.id !== id)
    const toDelete = collections.value.find(c => c.id === id)
    if (toDelete?.isDefault) return
    collections.value = next
    if (activeCollectionId.value === id) activeCollectionId.value = collections.value[0]?.id ?? null
  }

  const setActiveCollection = (id: string) => {
    if (!collections.value.some(c => c.id === id)) return
    activeCollectionId.value = id
  }

  // `sourceId` is used to clone the current editor state into the new collection item.
  const addRequestToActive = (sourceId: string, group = '') => {
    const target = activeCollection.value
    if (!target) return
    normalizeCollection(target)
    const normalizedGroup = group.trim()
    if (normalizedGroup && !target.groups?.some(g => g.name === normalizedGroup)) {
      target.groups = [...(target.groups ?? []), {
        id: nanoid(),
        name: normalizedGroup,
        sortOrder: nextSortOrder(target.groups ?? []),
      }]
    }

    const newItemId = nanoid()
    cloneRequestData(sourceId, newItemId)

    target.items.unshift({
      id: newItemId,
      requestId: sourceId,
      requestKey: sourceId, // Keeping for type compatibility, but it's just the ID now
      label: '',
      group: normalizedGroup,
      sortOrder: nextSortOrder(target.items),
      addedAt: Date.now(),
    })
  }

  const removeItem = (collectionId: string, itemId: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    col.items = col.items.filter(i => i.id !== itemId)
    deleteRequestData(itemId)
  }

  const copyItems = (fromCollectionId: string, toCollectionId: string, itemIds: string[]) => {
    const from = collections.value.find(c => c.id === fromCollectionId)
    const to = collections.value.find(c => c.id === toCollectionId)
    if (!from || !to) return
    normalizeCollection(from)
    normalizeCollection(to)
    const toCopy = from.items.filter(i => itemIds.includes(i.id))
    let sortOrder = nextSortOrder(to.items) - 1000
    const cloned = toCopy.map(i => {
      const newItemId = nanoid()
      cloneRequestData(i.id, newItemId)
      return {
        id: newItemId,
        requestId: i.requestId ?? i.requestKey,
        requestKey: i.requestKey,
        label: i.label ?? '',
        group: i.group ?? '',
        sortOrder: sortOrder += 1000,
        addedAt: Date.now(),
      }
    })
    to.items = [...cloned, ...to.items]
  }

  const duplicateItems = (collectionId: string, itemIds: string[]) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)

    const toDuplicate = col.items.filter(i => itemIds.includes(i.id))
    const newItems: CollectionItem[] = []

    toDuplicate.forEach(item => {
      const newItemId = nanoid()
      cloneRequestData(item.id, newItemId)

      const newItem: CollectionItem = {
        ...item,
        id: newItemId,
        label: item.label ? `${item.label} (Copy)` : '',
        addedAt: Date.now(),
        sortOrder: item.sortOrder ? item.sortOrder + 1 : nextSortOrder(col.items)
      }
      newItems.push(newItem)
    })

    col.items = [...col.items, ...newItems]
  }

  const duplicateGroup = (collectionId: string, groupName: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)

    const normalized = groupName.trim()
    if (!normalized || normalized === 'UNGROUPED') return

    const newGroupName = `${normalized} (Copy)`
    const newGroupId = nanoid()

    col.groups = [...(col.groups ?? []), {
      id: newGroupId,
      name: newGroupName,
      sortOrder: nextSortOrder(col.groups ?? [])
    }]

    const itemsToClone = col.items.filter(i => (i.group ?? '').trim() === normalized)
    const newItems: CollectionItem[] = []

    itemsToClone.forEach(item => {
      const newItemId = nanoid()
      cloneRequestData(item.id, newItemId)

      newItems.push({
        ...item,
        id: newItemId,
        group: newGroupName,
        addedAt: Date.now(),
        sortOrder: nextSortOrder([...col.items, ...newItems])
      })
    })

    col.items = [...col.items, ...newItems]
  }

  const setItemsLabel = (collectionId: string, itemIds: string[], label: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    const normalized = label.trim()
    for (const item of col.items) {
      if (itemIds.includes(item.id)) item.label = normalized
    }
  }

  const setItemsGroup = (collectionId: string, itemIds: string[], group: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)
    const normalized = group.trim()
    if (normalized && !col.groups?.some(g => g.name === normalized)) {
      col.groups = [...(col.groups ?? []), {
        id: nanoid(),
        name: normalized,
        sortOrder: nextSortOrder(col.groups ?? []),
      }]
    }
    for (const item of col.items) {
      if (itemIds.includes(item.id)) item.group = normalized
    }
  }

  const createGroup = (collectionId: string, group: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)
    const normalized = group.trim()
    if (!normalized) return
    if (!col.groups?.some(g => g.name === normalized)) {
      col.groups = [...(col.groups ?? []), {
        id: nanoid(),
        name: normalized,
        sortOrder: nextSortOrder(col.groups ?? []),
      }]
    }
  }

  const renameGroup = (collectionId: string, oldGroup: string, newGroup: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)
    const from = oldGroup.trim()
    const to = newGroup.trim()
    if (!from || !to || from === to) return
    const existing = (col.groups ?? []).find(g => g.name === from)
    if (existing) existing.name = to
    else if (!col.groups?.some(g => g.name === to)) {
      col.groups = [...(col.groups ?? []), { id: nanoid(), name: to, sortOrder: nextSortOrder(col.groups ?? []) }]
    }
    for (const item of col.items) {
      if ((item.group ?? '').trim() === from) item.group = to
    }
  }

  const deleteGroup = (collectionId: string, group: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)
    const normalized = group.trim()
    if (!normalized) return
    col.groups = (col.groups ?? []).filter(g => g.name !== normalized)
    for (const item of col.items) {
      if ((item.group ?? '').trim() === normalized) item.group = ''
    }
  }

  const moveItemsToGroup = (collectionId: string, itemIds: string[], group: string) => {
    setItemsGroup(collectionId, itemIds, group)
  }

  const moveItemsToPosition = (collectionId: string, itemIds: string[], group: string, beforeItemId?: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)

    const ids = new Set(itemIds)
    const normalized = group.trim()
    if (normalized && !col.groups?.some(g => g.name === normalized)) {
      col.groups = [...(col.groups ?? []), {
        id: nanoid(),
        name: normalized,
        sortOrder: nextSortOrder(col.groups ?? []),
      }]
    }

    const moving = [...col.items]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .filter(item => ids.has(item.id))
    if (moving.length === 0) return

    const remaining = [...col.items]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .filter(item => !ids.has(item.id))
    const beforeIndex = beforeItemId ? remaining.findIndex(item => item.id === beforeItemId) : -1

    if (beforeIndex === -1) {
      let insertAt = remaining.length
      for (let i = remaining.length - 1; i >= 0; i--) {
        if ((remaining[i].group ?? '').trim() === normalized) {
          insertAt = i + 1
          break
        }
      }
      remaining.splice(insertAt, 0, ...moving)
    } else {
      remaining.splice(beforeIndex, 0, ...moving)
    }

    remaining.forEach((item, index) => {
      if (ids.has(item.id)) item.group = normalized
      item.sortOrder = (index + 1) * 1000
    })
    col.items = remaining
  }

  const reorderGroups = (collectionId: string, fromGroup: string, toGroup: string, position: 'before' | 'after' = 'before') => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    normalizeCollection(col)
    const from = fromGroup.trim()
    const to = toGroup.trim()
    if (!from || !to || from === to || from === 'UNGROUPED' || to === 'UNGROUPED') return

    const groups = [...(col.groups ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    const fromIndex = groups.findIndex(g => g.name === from)
    const toIndex = groups.findIndex(g => g.name === to)
    if (fromIndex === -1 || toIndex === -1) return

    const [moved] = groups.splice(fromIndex, 1)
    const targetIndex = groups.findIndex(g => g.name === to)
    if (targetIndex === -1) return
    const insertAt = position === 'after' ? targetIndex + 1 : targetIndex
    groups.splice(insertAt, 0, moved)
    groups.forEach((group, index) => {
      group.sortOrder = (index + 1) * 1000
    })
    col.groups = groups
  }

  const exportCollection = (collectionId: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return null

    const requestsData: Record<string, Record<string, any>> = {}
    col.items.forEach(item => {
      const itemData: Record<string, any> = {}
      const keys = [
        { key: 'request', storage: `api_request_data_${item.id}` },
        { key: 'note', storage: `request_info_note_quill_${item.id}` },
        { key: 'searchFields', storage: `request_info_search_fields_${item.id}` },
        { key: 'tags', storage: `tags_${item.id}` }
      ]

      keys.forEach(({ key, storage }) => {
        const data = localStorage.getItem(storage)
        if (data !== null) {
          try {
            itemData[key] = JSON.parse(data)
          } catch {
            itemData[key] = data
          }
        }
      })
      requestsData[item.id] = itemData
    })

    const exportData = {
      version: '1.0',
      type: 'apii-collection',
      collection: col,
      requestsData
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${col.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_collection.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importCollection = (jsonContent: string) => {
    try {
      const data = JSON.parse(jsonContent)
      if (data.type !== 'apii-collection' || !data.collection) {
        throw new Error('Invalid collection file')
      }

      const importedCol = data.collection as RequestCollection
      const requestsData = data.requestsData as Record<string, any>

      // Create a new collection ID and name to avoid conflicts
      const newCollectionId = nanoid()
      const newCollection: RequestCollection = {
        ...importedCol,
        id: newCollectionId,
        name: `${importedCol.name} (Imported)`,
        isDefault: false,
        createdAt: Date.now()
      }

      // Map old item IDs to new item IDs
      newCollection.items = importedCol.items.map(item => {
        const oldId = item.id
        const newId = nanoid()
        
        // Restore associated data with new ID
        const itemData = requestsData[oldId]
        if (itemData) {
          if (itemData.request) localStorage.setItem(`api_request_data_${newId}`, JSON.stringify(itemData.request))
          if (itemData.note) localStorage.setItem(`request_info_note_quill_${newId}`, typeof itemData.note === 'string' ? itemData.note : JSON.stringify(itemData.note))
          if (itemData.searchFields) localStorage.setItem(`request_info_search_fields_${newId}`, JSON.stringify(itemData.searchFields))
          if (itemData.tags) localStorage.setItem(`tags_${newId}`, JSON.stringify(itemData.tags))
        }

        return {
          ...item,
          id: newId
        }
      })

      collections.value = [newCollection, ...collections.value]
      activeCollectionId.value = newCollectionId
      return true
    } catch (e) {
      console.error('Failed to import collection', e)
      return false
    }
  }

  watch([collections, activeCollectionId], persist, { deep: true })

  return {
    collections,
    activeCollectionId,
    activeCollection,
    load,
    createCollection,
    renameCollection,
    deleteCollection,
    setActiveCollection,
    addRequestToActive,
    removeItem,
    copyItems,
    duplicateItems,
    duplicateGroup,
    setItemsLabel,
    setItemsGroup,
    createGroup,
    renameGroup,
    deleteGroup,
    moveItemsToGroup,
    moveItemsToPosition,
    reorderGroups,
    exportCollection,
    importCollection,
  }
})
