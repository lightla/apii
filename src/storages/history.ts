import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HistoryItem {
  id: string
  requestId: string
  name?: string
  timestamp: number
  method: string
  url: string
  status: number
  statusText: string
  duration: number
  response: any
  responseType: string
  responseHeaders?: Record<string, string>
  error?: string
  requestData: {
    baseUrl: string
    method: string
    headers: any[]
    queryParams: any[]
    uriParameters: any[]
    body: any
    bodyType: string
    selectedHeaderPresetIds: string[]
    selectedQueryPresetIds: string[]
    selectedBodyPresetIds: string[]
  }
}

export const useHistoryStorage = defineStore('request-history', () => {
  const recent = ref<Record<string, HistoryItem[]>>({})
  const saved = ref<Record<string, HistoryItem[]>>({})

  const load = () => {
    const savedRecent = localStorage.getItem('api_history_recent')
    const savedPermanent = localStorage.getItem('api_history_saved')
    
    if (savedRecent) {
      try { recent.value = JSON.parse(savedRecent) } catch (e) { console.error(e) }
    }
    if (savedPermanent) {
      try { saved.value = JSON.parse(savedPermanent) } catch (e) { console.error(e) }
    }
  }

  const persist = () => {
    localStorage.setItem('api_history_recent', JSON.stringify(recent.value))
    localStorage.setItem('api_history_saved', JSON.stringify(saved.value))
  }

  const addRecent = (requestId: string, item: Omit<HistoryItem, 'id'>) => {
    if (!recent.value[requestId]) {
      recent.value[requestId] = []
    }
    
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    }

    recent.value[requestId].unshift(newItem)
    
    // Limit to 10 recent items per request
    if (recent.value[requestId].length > 10) {
      recent.value[requestId].pop()
    }
    
    persist()
  }

  const saveHistory = (requestId: string, itemId: string) => {
    const item = recent.value[requestId]?.find(i => i.id === itemId)
    if (!item) return
    
    if (!saved.value[requestId]) {
      saved.value[requestId] = []
    }
    
    // Check if already saved
    if (saved.value[requestId].some(i => i.id === itemId)) return

    saved.value[requestId].unshift({ ...item })
    persist()
  }

  const saveSnapshot = (requestId: string, item: Omit<HistoryItem, 'id'>) => {
    if (!saved.value[requestId]) {
      saved.value[requestId] = []
    }

    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    }

    saved.value[requestId].unshift(newItem)
    persist()
    return newItem
  }

  const removeSaved = (requestId: string, itemId: string) => {
    if (!saved.value[requestId]) return
    saved.value[requestId] = saved.value[requestId].filter(i => i.id !== itemId)
    persist()
  }

  const renameSaved = (requestId: string, itemId: string, newName: string) => {
    const item = saved.value[requestId]?.find(i => i.id === itemId)
    if (item) {
      item.name = newName.trim()
      persist()
    }
  }

  const clearRecent = (requestId: string) => {
    delete recent.value[requestId]
    persist()
  }

  return {
    recent,
    saved,
    load,
    addRecent,
    saveHistory,
    saveSnapshot,
    removeSaved,
    renameSaved,
    clearRecent
  }
})
