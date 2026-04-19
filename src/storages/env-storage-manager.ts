export type EnvStorageProvider = 'localStorage' | 'apiStorage'

export type StoredEnv = {
  id?: string
  name: string
  code: string
}

type EnvStorageBackend = {
  loadEnvs: () => Promise<StoredEnv[]>
  saveEnvs: (envs: StoredEnv[]) => Promise<void>
}

const DEFAULT_ENV: StoredEnv = {
  name: 'Default',
  code: 'default',
}

const STORAGE_ENVS_KEY = 'app.env.storage.envs'

// Keep track of current provider globally
let currentProvider: EnvStorageProvider = 'localStorage'
let apiSaveUrl: string = ''

const normalizeCode = (code: string | undefined | null): string => {
  return (code ?? '').trim().toLowerCase()
}

export const sanitizeStoredEnvs = (envs: StoredEnv[]): StoredEnv[] => {
  const input = Array.isArray(envs) ? envs : []
  const normalized: StoredEnv[] = input.map((env) => ({
    id: env.id,
    name: env.name ?? '',
    code: normalizeCode(env.code),
  }))

  const sanitized: StoredEnv[] = []
  const seenCodes = new Set<string>()

  const noEnvironment = normalized.find((env) => env.code === 'default')
  sanitized.push({
    id: noEnvironment?.id,
    name: noEnvironment?.name || DEFAULT_ENV.name,
    code: 'default',
  })
  seenCodes.add('default')

  normalized.forEach((env) => {
    if (env.code === 'default') return
    if (!env.code) {
      sanitized.push(env)
      return
    }
    if (seenCodes.has(env.code)) return
    seenCodes.add(env.code)
    sanitized.push(env)
  })

  return sanitized
}

const localStorageBackend: EnvStorageBackend = {
  async loadEnvs() {
    if (typeof window === 'undefined') {
      return [DEFAULT_ENV]
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_ENVS_KEY)
      if (!raw) return [DEFAULT_ENV]

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return [DEFAULT_ENV]

      return sanitizeStoredEnvs(parsed)
    } catch {
      return [DEFAULT_ENV]
    }
  },
  async saveEnvs(envs: StoredEnv[]) {
    if (typeof window === 'undefined') return
    const sanitized = sanitizeStoredEnvs(envs)
    window.localStorage.setItem(STORAGE_ENVS_KEY, JSON.stringify(sanitized))
  },
}

const apiStorageBackend: EnvStorageBackend = {
  async loadEnvs() {
    if (!apiSaveUrl) {
      console.warn('[EnvStorage] apiStorage: No URL provided, falling back to empty')
      return [DEFAULT_ENV]
    }
    try {
      const response = await fetch(`${apiSaveUrl}/envs`)
      if (!response.ok) throw new Error('Failed to load envs from API')
      const data = await response.json()
      return sanitizeStoredEnvs(data)
    } catch (e) {
      console.error('[EnvStorage] apiStorage load error:', e)
      return [DEFAULT_ENV]
    }
  },
  async saveEnvs(envs: StoredEnv[]) {
    if (!apiSaveUrl) return
    try {
      const sanitized = sanitizeStoredEnvs(envs)
      await fetch(`${apiSaveUrl}/envs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized),
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
  async loadEnvs(): Promise<StoredEnv[]> {
    const backend = getBackend()
    const envs = await backend.loadEnvs()
    return sanitizeStoredEnvs(envs)
  },
  async saveEnvs(envs: StoredEnv[]): Promise<void> {
    const backend = getBackend()
    await backend.saveEnvs(sanitizeStoredEnvs(envs))
  },
}
