import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'

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
    // ... các state khác của request
  }),

  getters: {
    urlPreview(): string {
      // Tạo URL preview từ baseUrl + pathVariables + queryParams
      let url = this.baseUrl

      // Replace path variables (only when value is non-empty)
      this.pathVariables.forEach(variable => {
        const val = variable.value.trim()
        if (val) url = url.replace(`{${variable.name}}`, val)
      })

      // Add query parameters (skip empty keys)
      const enabledQueries = this.queryParams
        .filter(param => param.enabled && param.key.trim() !== '')
        .map(param => `${encodeURIComponent(param.key.trim())}=${encodeURIComponent(param.value)}`)

      if (enabledQueries.length > 0) {
        url += '?' + enabledQueries.join('&')
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