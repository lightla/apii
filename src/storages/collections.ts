import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'

export type CollectionItem = {
  id: string
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

  const addRequestToActive = (requestKey: string, group = '') => {
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
    target.items.unshift({
      id: nanoid(),
      requestKey,
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
  }

  const copyItems = (fromCollectionId: string, toCollectionId: string, itemIds: string[]) => {
    const from = collections.value.find(c => c.id === fromCollectionId)
    const to = collections.value.find(c => c.id === toCollectionId)
    if (!from || !to) return
    normalizeCollection(from)
    normalizeCollection(to)
    const toCopy = from.items.filter(i => itemIds.includes(i.id))
    let sortOrder = nextSortOrder(to.items) - 1000
    const cloned = toCopy.map(i => ({
      id: nanoid(),
      requestKey: i.requestKey,
      label: i.label ?? '',
      group: i.group ?? '',
      sortOrder: sortOrder += 1000,
      addedAt: Date.now(),
    }))
    to.items = [...cloned, ...to.items]
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

  const reorderGroups = (collectionId: string, fromGroup: string, toGroup: string) => {
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
    groups.splice(toIndex, 0, moved)
    groups.forEach((group, index) => {
      group.sortOrder = (index + 1) * 1000
    })
    col.groups = groups
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
    setItemsLabel,
    setItemsGroup,
    createGroup,
    renameGroup,
    deleteGroup,
    moveItemsToGroup,
    moveItemsToPosition,
    reorderGroups,
  }
})
