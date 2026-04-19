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
  name: 'No Environment',
  code: 'no-environment',
}

const STORAGE_ENVS_KEY = 'app.env.storage.envs'

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

  const noEnvironment = normalized.find((env) => env.code === 'no-environment')
  sanitized.push({
    id: noEnvironment?.id,
    name: noEnvironment?.name || DEFAULT_ENV.name,
    code: 'no-environment',
  })
  seenCodes.add('no-environment')

  normalized.forEach((env) => {
    if (env.code === 'no-environment') return
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

// NOTE: For now we hardcode to localStorage. apiStorage stays as a future option.
const getProvider = (): EnvStorageProvider => 'localStorage'
const setProvider = (_provider: EnvStorageProvider): void => {}
const getBackend = (): EnvStorageBackend => localStorageBackend

export const envStorageManager = {
  getProvider,
  setProvider,
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
