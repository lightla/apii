import { defineStore } from 'pinia'

export interface QueryParam {
  key: string
  value: string
  enabled: boolean
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
    headers: [] as { key: string; value: string; enabled: boolean }[],
    body: '',
    requestName: '',
    // ... các state khác của request
  }),

  getters: {
    urlPreview(): string {
      // Tạo URL preview từ baseUrl + pathVariables + queryParams
      let url = this.baseUrl

      // Replace path variables
      this.pathVariables.forEach(variable => {
        url = url.replace(`{${variable.name}}`, variable.value)
      })

      // Add query parameters
      const enabledQueries = this.queryParams
        .filter(param => param.enabled)
        .map(param => `${param.key}=${param.value}`)

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
        key: '',
        value: '',
        enabled: true
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
      const index = this.pathVariables.findIndex(v => v.name === name)
      if (index !== -1) {
        this.pathVariables[index].value = value
      } else {
        this.pathVariables.push({ name, value })
      }
    },

    // Headers
    addHeader() {
      this.headers.push({
        key: '',
        value: '',
        enabled: true
      })
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