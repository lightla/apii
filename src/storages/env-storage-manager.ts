export type EnvStorageProvider = 'localStorage' | 'apiStorage'

export type StoredEnv = {
  id?: string
  name: string
  code: string
}

// Cấu trúc dữ liệu mới mà Store gửi xuống
export type EnvStorageData = {
  definedEnvs: StoredEnv[]
  variableDefinitions: any[]
  envValues: Record<string, Record<string, string>>
  selectedEnvCode: string
}

type EnvStorageBackend = {
  loadEnvs: () => Promise<any>
  saveEnvs: (data: any) => Promise<void>
}

const STORAGE_ENVS_KEY = 'app.env.storage.envs'

// Keep track of current provider globally
let currentProvider: EnvStorageProvider = 'localStorage'
let apiSaveUrl: string = ''

const localStorageBackend: EnvStorageBackend = {
  async loadEnvs() {
    if (typeof window === 'undefined') return null

    try {
      const raw = window.localStorage.getItem(STORAGE_ENVS_KEY)
      if (!raw) return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  async saveEnvs(data: any) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_ENVS_KEY, JSON.stringify(data))
  },
}

const apiStorageBackend: EnvStorageBackend = {
  async loadEnvs() {
    if (!apiSaveUrl) return null
    try {
      const response = await fetch(`${apiSaveUrl}/envs`)
      if (!response.ok) throw new Error('Failed to load envs from API')
      return await response.json()
    } catch (e) {
      console.error('[EnvStorage] apiStorage load error:', e)
      return null
    }
  },
  async saveEnvs(data: any) {
    if (!apiSaveUrl) return
    try {
      await fetch(`${apiSaveUrl}/envs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch (e) {
      console.error('[EnvStorage] apiStorage save error:', e)
    }
  },
}

const getProvider = (): EnvStorageProvider => currentProvider
const setProvider = (provider: EnvStorageProvider): void => {
  currentProvider = provider
}
const setApiUrl = (url: string): void => {
  apiSaveUrl = url
}

const getBackend = (): EnvStorageBackend => {
  return currentProvider === 'apiStorage' ? apiStorageBackend : localStorageBackend
}

export const envStorageManager = {
  getProvider,
  setProvider,
  setApiUrl,
  async loadEnvs(): Promise<any> {
    const backend = getBackend()
    return await backend.loadEnvs()
  },
  async saveEnvs(data: any): Promise<void> {
    const backend = getBackend()
    await backend.saveEnvs(data)
  },
}
