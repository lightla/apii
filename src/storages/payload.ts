import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { useEnvStorage } from '@/storages/env-variables-tmp.ts'
import { usePresetStorage } from '@/storages/presets.ts'

export interface Header {
  id: string
  key: string
  value: string
  enabled: boolean
  description: string
  isPreset?: boolean
  isManaged?: boolean
  presetId?: string
}

export interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
  description: string
  isPreset?: boolean
  presetId?: string
}

export interface UriParameter {
  key: string
  value: string
}

export interface FormDataParam {
  id: string
  key: string
  value: string
  type: 'text' | 'file'
  enabled: boolean
  description: string
  file?: File | null
  isPreset?: boolean
  presetId?: string
}

export type BodyType = 'none' | 'json' | 'form-data' | 'binary'

const GLOBAL_SETTINGS_KEY = 'api_global_settings'

export const useRequestParamsStorage = defineStore('request-params', {
  state: () => {
    // Load Global Settings (Proxy)
    const savedGlobal = localStorage.getItem(GLOBAL_SETTINGS_KEY)
    let globalSettings = { useProxy: false, proxyUrl: 'http://localhost:8080/' }
    if (savedGlobal) {
      try {
        const parsed = JSON.parse(savedGlobal)
        globalSettings = { ...globalSettings, ...parsed }
      } catch (e) {
        console.error('Failed to parse global settings', e)
      }
    }

    return {
      headers: [] as Header[],
      queryParams: [] as QueryParam[],
      uriParameters: [] as UriParameter[],
      baseUrl: '',
      method: 'GET',
      body: '',
      bodyType: 'json' as BodyType,
      formData: [] as FormDataParam[],
      binaryFile: null as File | null,
      requestName: '',
      
      // Selection (Multiple)
      selectedHeaderPresetIds: [] as string[],
      selectedQueryPresetIds: [] as string[],
      selectedBodyPresetIds: [] as string[],
      selectedFilePresetId: '' as string,
      
      authType: 'none' as 'none' | 'bearer' | 'preset',
      authToken: '',
      
      // CORS Proxy
      useProxy: globalSettings.useProxy,
      proxyUrl: globalSettings.proxyUrl,

      triggerSendCount: 0,
      preRequestScript: '',
      postRequestScript: '',
    }
  },

  getters: {
    urlPreview(): string {
      const envStorage = useEnvStorage()
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
      let url = resolveEnvVariables(this.baseUrl)
      this.uriParameters.forEach(param => {
        const val = param.value.trim()
        if (val) {
          const resolvedVal = resolveEnvVariables(val)
          url = url.replace(`{${param.key}}`, resolvedVal)
        }
      })
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
    persistGlobalSettings() {
      const data = {
        useProxy: this.useProxy,
        proxyUrl: this.proxyUrl
      }
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(data))
    },

    syncManagedHeaders() {
      const presetStorage = usePresetStorage();
      
      // 1. Handle Content-Type (Managed)
      let contentType = '';
      if (this.bodyType === 'json') contentType = 'application/json';
      else if (this.bodyType === 'form-data') contentType = 'multipart/form-data';

      if (contentType) {
        const ctIndex = this.headers.findIndex(h => h.key.toLowerCase() === 'content-type' && h.isManaged);
        let existingCT: any = null;
        if (ctIndex !== -1) {
          existingCT = this.headers.splice(ctIndex, 1)[0];
          existingCT.value = contentType;
          existingCT.isManaged = true;
        }
        this.headers.unshift(existingCT || {
          id: nanoid(),
          key: 'Content-Type',
          value: contentType,
          enabled: true,
          description: 'Managed by Body settings',
          isManaged: true
        });
      } else {
        // Remove Content-Type if no longer needed
        this.headers = this.headers.filter(h => !(h.key.toLowerCase() === 'content-type' && h.isManaged));
      }

      // 2. Remove rows from presets that are no longer selected
      this.headers = this.headers.filter(h => !h.presetId || this.selectedHeaderPresetIds.includes(h.presetId));

      // 3. Apply Selected Preset Headers
      this.selectedHeaderPresetIds.forEach(presetId => {
        const preset = presetStorage.headerPresets.find((p: any) => p.id === presetId);
        if (preset) {
          preset.items.forEach((h: any) => {
            const existing = this.headers.find(row => 
              row.key.toLowerCase() === h.key.toLowerCase() && row.presetId === presetId
            );
            if (existing) {
              existing.value = h.value;
              existing.description = h.description || existing.description;
            } else {
              this.headers.push({
                id: nanoid(),
                key: h.key,
                value: h.value,
                enabled: true,
                description: h.description || 'From Preset',
                isPreset: true,
                presetId: presetId
              });
            }
          });
        }
      });

      // 4. ENFORCE ORDER: Managed > Preset > Manual
      this.headers.sort((a, b) => {
        const scoreA = a.isManaged ? 0 : (a.isPreset ? 1 : 2);
        const scoreB = b.isManaged ? 0 : (b.isPreset ? 1 : 2);
        return scoreA - scoreB;
      });
    },

    syncManagedQueryParams() {
      const presetStorage = usePresetStorage();
      
      // 1. Remove rows from presets that are no longer selected
      this.queryParams = this.queryParams.filter(q => !q.presetId || this.selectedQueryPresetIds.includes(q.presetId));

      // 2. Apply Selected Preset Query Params
      this.selectedQueryPresetIds.forEach(presetId => {
        const preset = presetStorage.queryPresets.find((p: any) => p.id === presetId);
        if (preset) {
          preset.items.forEach((item: any) => {
            const existing = this.queryParams.find(row => 
              row.key.toLowerCase() === item.key.toLowerCase() && row.presetId === presetId
            );
            if (existing) {
              existing.value = item.value;
              existing.description = item.description || existing.description;
            } else {
              this.queryParams.push({
                id: nanoid(),
                key: item.key,
                value: item.value,
                enabled: true,
                description: item.description || 'From Preset',
                isPreset: true,
                presetId: presetId
              });
            }
          });
        }
      });

      // ENFORCE ORDER: Preset > Manual
      this.queryParams.sort((a, b) => {
        const scoreA = a.isPreset ? 0 : 1;
        const scoreB = b.isPreset ? 0 : 1;
        return scoreA - scoreB;
      });
    },

    syncManagedBody() {
      const presetStorage = usePresetStorage();

      // 1. Remove rows from presets that are no longer selected
      this.formData = this.formData.filter(f => !f.presetId || this.selectedBodyPresetIds.includes(f.presetId));

      // 2. Apply Selected Body Presets
      this.selectedBodyPresetIds.forEach(presetId => {
        const preset = presetStorage.bodyPresets.find((p: any) => p.id === presetId);
        if (preset && (preset.type === this.bodyType || preset.type === 'body-' + this.bodyType)) {
           if (this.bodyType === 'json') {
             const newJson = preset.json || '';
             if (this.body.trim() === '') {
               this.body = newJson;
             } else {
               try {
                 const currentObj = JSON.parse(this.body);
                 const presetObj = JSON.parse(newJson);
                 if (typeof currentObj === 'object' && typeof presetObj === 'object') {
                   this.body = JSON.stringify({ ...presetObj, ...currentObj }, null, 2);
                 }
               } catch (e) {}
             }
           } else if (this.bodyType === 'form-data') {
             (preset.formData || []).forEach((item: any) => {
                const existing = this.formData.find(row => 
                  row.key.toLowerCase() === item.key.toLowerCase() && row.presetId === presetId
                );
                if (existing) {
                  existing.value = item.value;
                  existing.description = item.description || existing.description;
                } else {
                  this.formData.push({
                    id: nanoid(),
                    key: item.key,
                    value: item.value,
                    type: (item.type as any) || 'text',
                    enabled: true,
                    description: item.description || 'From Preset',
                    isPreset: true,
                    presetId: presetId
                  });
                }
             });
           }
        }
      });

      // ENFORCE ORDER: Preset > Manual
      this.formData.sort((a, b) => {
        const scoreA = a.isPreset ? 0 : 1;
        const scoreB = b.isPreset ? 0 : 1;
        return scoreA - scoreB;
      });

      this.syncManagedHeaders();
    },

    setBodyType(type: BodyType) {
      this.bodyType = type;
      if (type !== 'binary') this.selectedFilePresetId = '';
      this.syncManagedBody();
      this.syncManagedHeaders();
    },

    async applyFilePresetToBinary(presetId: string) {
      const { getFile } = await import('./file-db');
      const presetStorage = usePresetStorage();
      const preset = presetStorage.filePresets.find(p => p.id === presetId);
      if (!preset) return;
      const blob = await getFile(presetId);
      if (blob) {
        this.binaryFile = new File([blob], preset.fileName, { type: preset.mimeType });
      }
      this.selectedFilePresetId = presetId;
    },

    async applyFilePresetToFormData(index: number, presetId: string) {
      const { getFile } = await import('./file-db');
      const presetStorage = usePresetStorage();
      const preset = presetStorage.filePresets.find(p => p.id === presetId);
      if (!preset || !this.formData[index]) return;
      const blob = await getFile(presetId);
      if (blob) {
        this.formData[index].file = new File([blob], preset.fileName, { type: preset.mimeType });
        this.formData[index].value = preset.fileName;
      }
    },

    addQueryParam() {
      this.queryParams.push({ id: nanoid(), key: '', value: '', enabled: true, description: '' })
    },
    removeQueryParam(index: number) {
      this.queryParams.splice(index, 1)
    },
    removeAllQueryParams() {
      this.queryParams = []
    },
    toggleQueryParam(index: number) {
      if (this.queryParams[index]) {
        this.queryParams[index].enabled = !this.queryParams[index].enabled
      }
    },
    toggleAllQueryParams() {
      const isAnyEnabled = this.queryParams.some(p => p.enabled)
      const targetState = !isAnyEnabled
      this.queryParams.forEach(p => p.enabled = targetState)
    },
    updateUriParameter(key: string, value: string) {
      const trimmed = value.trim()
      const index = this.uriParameters.findIndex(v => v.key === key)
      if (index !== -1) {
        // Use spread operator to trigger reactivity
        this.uriParameters[index] = { ...this.uriParameters[index], value: trimmed }
      } else {
        this.uriParameters.push({ key, value: trimmed })
      }
    },
    updateQueryParam(index: number, key: string, value: string) {
      if (this.queryParams[index]) {
        // Use spread operator to trigger reactivity
        this.queryParams[index] = { ...this.queryParams[index], key, value }
      }
    },
    addHeader() {
      this.headers.push({ id: nanoid(), key: '', value: '', enabled: true, description: '' })
    },
    removeHeader(index: number) {
      const header = this.headers[index];
      // PROTECT MANAGED HEADERS
      if (header && header.isManaged) {
        return;
      }
      this.headers.splice(index, 1)
    },
    toggleHeader(index: number) {
      if (this.headers[index]) {
        this.headers[index].enabled = !this.headers[index].enabled
      }
    },
    toggleAllHeaders() {
      const isAnyEnabled = this.headers.some(h => h.enabled)
      const targetState = !isAnyEnabled
      this.headers.forEach(h => h.enabled = targetState)
    },
    removeAllHeaders() {
      // Keep managed headers
      this.headers = this.headers.filter(h => h.isManaged)
    },
    
    addFormData() {
      this.formData.push({ id: nanoid(), key: '', value: '', type: 'text', enabled: true, description: '' })
    },
    removeFormData(index: number) {
      this.formData.splice(index, 1)
    },
    setBaseUrl(url: string) {
      this.baseUrl = url
    },
    setMethod(method: string) {
      this.method = method
    },
    resetAll() {
      this.queryParams = []
      this.uriParameters = []
      this.headers = []
      this.baseUrl = ''
      this.method = 'GET'
      this.body = ''
      this.bodyType = 'json'
      this.formData = []
      this.binaryFile = null
      this.requestName = ''
      this.selectedHeaderPresetIds = []
      this.selectedQueryPresetIds = []
      this.selectedBodyPresetIds = []
      this.selectedFilePresetId = ''
      this.preRequestScript = ''
      this.postRequestScript = ''
      this.syncManagedHeaders();
    },
    saveToStorage(routeId: string) {
      if (!routeId) return
      const data = {
        queryParams: this.queryParams,
        uriParameters: this.uriParameters,
        baseUrl: this.baseUrl,
        method: this.method,
        headers: this.headers,
        body: this.body,
        bodyType: this.bodyType,
        formData: this.formData.map(fd => ({...fd, file: null})),
        selectedHeaderPresetIds: this.selectedHeaderPresetIds,
        selectedQueryPresetIds: this.selectedQueryPresetIds,
        selectedBodyPresetIds: this.selectedBodyPresetIds,
        selectedFilePresetId: this.selectedFilePresetId,
        preRequestScript: this.preRequestScript,
        postRequestScript: this.postRequestScript,
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
          this.bodyType = data.bodyType || 'json'
          this.formData = data.formData || []
          this.selectedHeaderPresetIds = data.selectedHeaderPresetIds || []
          this.selectedQueryPresetIds = data.selectedQueryPresetIds || []
          this.selectedBodyPresetIds = data.selectedBodyPresetIds || []
          this.selectedFilePresetId = data.selectedFilePresetId || ''
          this.preRequestScript = data.preRequestScript || ''
          this.postRequestScript = data.postRequestScript || ''
          this.syncManagedHeaders();
        } catch (e) {
          console.error('Failed to parse saved request data', e)
        }
      } else {
        this.resetAll()
      }
    },
    applyHistory(data: any) {
      if (!data) return
      this.baseUrl = data.baseUrl || ''
      this.method = data.method || 'GET'
      this.queryParams = [...(data.queryParams || [])]
      this.uriParameters = [...(data.uriParameters || [])]
      this.headers = [...(data.headers || [])]
      this.body = data.body || ''
      this.bodyType = data.bodyType || 'json'
      this.selectedHeaderPresetIds = [...(data.selectedHeaderPresetIds || [])]
      this.selectedQueryPresetIds = [...(data.selectedQueryPresetIds || [])]
      this.selectedBodyPresetIds = [...(data.selectedBodyPresetIds || [])]
      this.preRequestScript = data.preRequestScript || ''
      this.postRequestScript = data.postRequestScript || ''
      this.syncManagedHeaders()
    },
    applyParsedCurl(parsed: { method: string, url: string, headers: Record<string, string>, body: string, params: Record<string, string> }) {
      this.method = parsed.method
      this.body = parsed.body
      Object.entries(parsed.headers).forEach(([key, value]) => {
        const existing = this.headers.find(h => h.key.toLowerCase() === key.toLowerCase())
        if (existing) {
          existing.value = value
          existing.enabled = true
        } else {
          this.headers.push({ id: nanoid(), key, value, enabled: true, description: '' })
        }
      })
      Object.entries(parsed.params).forEach(([key, value]) => {
        const existing = this.queryParams.find(p => p.key === key)
        if (existing) {
          existing.value = value
          existing.enabled = true
        } else {
          this.queryParams.push({ id: nanoid(), key, value, enabled: true, description: '' })
        }
      })
      this.syncManagedHeaders();
    }
  }
})
