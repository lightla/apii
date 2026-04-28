import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { nanoid } from 'nanoid'

export type CollectionItem = {
  id: string
  requestKey: string
  group?: string
  addedAt: number
}

export type RequestCollection = {
  id: string
  name: string
  isDefault?: boolean
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

  const addRequestToActive = (requestKey: string) => {
    const target = activeCollection.value
    if (!target) return
    target.items.unshift({
      id: nanoid(),
      requestKey,
      group: '',
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
    const toCopy = from.items.filter(i => itemIds.includes(i.id))
    const cloned = toCopy.map(i => ({
      id: nanoid(),
      requestKey: i.requestKey,
      group: i.group ?? '',
      addedAt: Date.now(),
    }))
    to.items = [...cloned, ...to.items]
  }

  const setItemsGroup = (collectionId: string, itemIds: string[], group: string) => {
    const col = collections.value.find(c => c.id === collectionId)
    if (!col) return
    const normalized = group.trim()
    for (const item of col.items) {
      if (itemIds.includes(item.id)) item.group = normalized
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
    setItemsGroup,
  }
})
