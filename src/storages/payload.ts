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

export interface PathVariable {
  name: string
  value: string
}

export const useRequestParamsStorage = defineStore('requestParams', {
  state: () => ({
    queryParams: [] as QueryParam[],
    pathVariables: [] as PathVariable[],
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

      // Tạo URL preview từ baseUrl + pathVariables + queryParams
      // Bước 1: Resolve env variables trực tiếp trong baseUrl (ví dụ: {{domain}}/api/...)
      let url = resolveEnvVariables(this.baseUrl)

      // Bước 2: Replace path variables (ví dụ: {workspaceId})
      this.pathVariables.forEach(variable => {
        const val = variable.value.trim()
        if (val) {
          // Nếu giá trị của path variable lại chứa env variable (ví dụ: val = "{{my_id}}")
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

    toggleQueryParam(index: number) {
      this.queryParams[index].enabled = !this.queryParams[index].enabled
    },

    // Path Variables
    updatePathVariable(name: string, value: string) {
      const trimmed = value.trim()
      const index = this.pathVariables.findIndex(v => v.name === name)
      if (index !== -1) {
        this.pathVariables[index].value = trimmed
      } else {
        this.pathVariables.push({ name, value: trimmed })
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
      this.pathVariables = []
      this.headers = []
      this.baseUrl = ''
      this.method = 'GET'
      this.body = ''
      this.requestName = ''
    }
  }
})
