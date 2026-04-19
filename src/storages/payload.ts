import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { useEnvStorage } from '@/storages/env-variables-tmp.ts'

export interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
  description: string
}

export interface UriParameter {
  name: string
  value: string
}

export const useRequestParamsStorage = defineStore('requestParams', {
  state: () => ({
    queryParams: [] as QueryParam[],
    uriParameters: [] as UriParameter[],
    baseUrl: '',
    method: 'GET',
    headers: [] as { id: string; key: string; value: string; enabled: boolean; description: string }[],
    body: '',
    requestName: '',
  }),

  getters: {
    urlPreview(): string {
      const envStorage = useEnvStorage()
      
      // Hàm helper để replace env variables {{name}} -> value
      const resolveEnvVariables = (text: string): string => {
        let result = text
        envStorage.definedEnvVariables.forEach(variable => {
          if (variable.name && variable.value) {
            const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            result = result.replace(new RegExp(escapedName, 'g'), variable.value);
          }
        });
        return result
      }

      // Tạo URL preview từ baseUrl + uriParameters + queryParams
      // Bước 1: Resolve env variables trực tiếp trong baseUrl (ví dụ: {{domain}}/api/...)
      let url = resolveEnvVariables(this.baseUrl)

      // Bước 2: Replace URI parameters (ví dụ: {workspaceId})
      this.uriParameters.forEach(variable => {
        const val = variable.value.trim()
        if (val) {
          // Nếu giá trị của URI parameter lại chứa env variable (ví dụ: val = "{{my_id}}")
          // thì ta cũng resolve nó luôn
          const resolvedVal = resolveEnvVariables(val)
          url = url.replace(`{${variable.name}}`, resolvedVal)
        }
      })

      // Bước 3: Add query parameters
      const enabledQueries = this.queryParams
        .filter(param => param.enabled && param.key.trim() !== '')
        .map(param => {
          const key = resolveEnvVariables(param.key.trim())
          const value = resolveEnvVariables(param.value)
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        })

      if (enabledQueries.length > 0) {
        url += (url.includes('?') ? '&' : '?') + enabledQueries.join('&')
      }

      return url
    },
    
    activeQueryParams(): QueryParam[] {
      return this.queryParams.filter(param => param.enabled)
    }
  },

  actions: {
    // Query Params
    addQueryParam() {
      this.queryParams.push({
        id: nanoid(),
        key: '',
        value: '',
        enabled: true,
        description: ''
      })
    },

    removeQueryParam(index: number) {
      this.queryParams.splice(index, 1)
    },

    removeAllQueryParams() {
      this.queryParams = []
    },

    toggleQueryParam(index: number) {
      this.queryParams[index].enabled = !this.queryParams[index].enabled
    },

    toggleAllQueryParams() {
      const isAnyEnabled = this.queryParams.some(p => p.enabled)
      const targetState = !isAnyEnabled
      this.queryParams.forEach(p => p.enabled = targetState)
    },

    // URI Parameters
    updateUriParameter(name: string, value: string) {
      const trimmed = value.trim()
      const index = this.uriParameters.findIndex(v => v.name === name)
      if (index !== -1) {
        this.uriParameters[index].value = trimmed
      } else {
        this.uriParameters.push({ name, value: trimmed })
      }
    },

    // Headers
    addHeader() {
      this.headers.push({
        id: nanoid(),
        key: '',
        value: '',
        enabled: true,
        description: ''
      })
    },

    removeHeader(index: number) {
      this.headers.splice(index, 1)
    },

    toggleHeader(index: number) {
      this.headers[index].enabled = !this.headers[index].enabled
    },

    toggleAllHeaders() {
      const isAnyEnabled = this.headers.some(h => h.enabled)
      const targetState = !isAnyEnabled
      this.headers.forEach(h => h.enabled = targetState)
    },

    removeAllHeaders() {
      this.headers = []
    },

    // Request actions
    setBaseUrl(url: string) {
      this.baseUrl = url
    },

    setMethod(method: string) {
      this.method = method
    },

    setRequestName(name: string) {
      this.requestName = name
    },

    // Reset state
    resetAll() {
      this.queryParams = []
      this.uriParameters = []
      this.headers = []
      this.baseUrl = ''
      this.method = 'GET'
      this.body = ''
      this.requestName = ''
    },

    // --- Persist theo Route ID ---
    saveToStorage(routeId: string) {
      if (!routeId) return
      const data = {
        queryParams: this.queryParams,
        uriParameters: this.uriParameters,
        baseUrl: this.baseUrl,
        method: this.method,
        headers: this.headers,
        body: this.body,
      }
      localStorage.setItem(`api_request_data_${routeId}`, JSON.stringify(data))
    },

    loadFromStorage(routeId: string) {
      if (!routeId) return
      const saved = localStorage.getItem(`api_request_data_${routeId}`)
      if (saved) {
        try {
          const data = JSON.parse(saved)
          this.queryParams = data.queryParams || []
          this.uriParameters = data.uriParameters || []
          this.baseUrl = data.baseUrl || ''
          this.method = data.method || 'GET'
          this.headers = data.headers || []
          this.body = data.body || ''
        } catch (e) {
          console.error('Failed to parse saved request data', e)
        }
      } else {
        this.resetAll()
      }
    }
  }
})
