import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import { useEnvStorage } from '@/storages/env-variables-tmp.ts'
import { usePresetStorage } from '@/storages/presets.ts'

export interface QueryParam {
  id: string
  key: string
  value: string
  enabled: boolean
  description: string
  isManaged?: boolean
}

export interface UriParameter {
  name: string
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
  isManaged?: boolean
}

export type BodyType = 'none' | 'json' | 'form-data' | 'binary'

const GLOBAL_SETTINGS_KEY = 'api_global_settings'

export const useRequestParamsStorage = defineStore('requestParams', {
  state: () => {
    // 1. Nạp Global Settings (Proxy)
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
      queryParams: [] as QueryParam[],
      uriParameters: [] as UriParameter[],
      baseUrl: '',
      method: 'GET',
      headers: [] as { id: string; key: string; value: string; enabled: boolean; description: string; isManaged?: boolean }[],
      body: '',
      bodyType: 'json' as BodyType,
      formData: [] as FormDataParam[],
      binaryFile: null as File | null,
      requestName: '',
      selectedHeaderPresetId: null as string | null,
      selectedQueryPresetId: null as string | null,
      selectedBodyPresetId: null as string | null,
      // CORS Proxy (Khởi tạo từ localStorage)
      useProxy: globalSettings.useProxy,
      proxyUrl: globalSettings.proxyUrl,
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
      this.uriParameters.forEach(variable => {
        const val = variable.value.trim()
        if (val) {
          const resolvedVal = resolveEnvVariables(val)
          url = url.replace(`{${variable.name}}`, resolvedVal)
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
    // Luôn gọi hàm này khi thay đổi useProxy hoặc proxyUrl
    persistGlobalSettings() {
      const data = {
        useProxy: this.useProxy,
        proxyUrl: this.proxyUrl
      }
      localStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(data))
    },

    syncManagedHeaders() {
      const presetStorage = usePresetStorage();
      
      // 1. Lọc lấy ra các header do user tự gõ (không phải managed)
      const userHeaders = this.headers.filter(h => !h.isManaged);
      const managedHeaders = [];

      // 2. Thêm Content-Type (Managed by Body)
      let contentType = '';
      if (this.bodyType === 'json') {
        contentType = 'application/json';
      } else if (this.bodyType === 'form-data') {
        contentType = 'multipart/form-data';
      }

      if (contentType) {
        managedHeaders.push({
          id: 'managed-content-type',
          key: 'Content-Type',
          value: contentType,
          enabled: true,
          description: 'Managed by Body settings',
          isManaged: true
        });
      }

      // 3. Thêm Preset Headers
      if (this.selectedHeaderPresetId) {
        const preset = presetStorage.headerPresets.find((p: any) => p.id === this.selectedHeaderPresetId);
        if (preset) {
           preset.items.forEach((h: any, idx: number) => {
             managedHeaders.push({
               id: `managed-preset-${this.selectedHeaderPresetId}-${idx}`,
               key: h.key,
               value: h.value,
               enabled: true,
               description: h.description || 'From Preset',
               isManaged: true
             });
           });
        }
      }

      // 4. Hợp nhất: Managed lên đầu, User Headers theo sau
      this.headers = [...managedHeaders, ...userHeaders];
    },

    syncManagedQueryParams() {
      const presetStorage = usePresetStorage();
      const userParams = this.queryParams.filter(p => !p.isManaged);
      const managedParams: QueryParam[] = [];

      if (this.selectedQueryPresetId) {
        const preset = presetStorage.queryPresets.find((p: any) => p.id === this.selectedQueryPresetId);
        if (preset) {
          preset.items.forEach((item: any, idx: number) => {
            managedParams.push({
              id: `managed-query-${this.selectedQueryPresetId}-${idx}`,
              key: item.key,
              value: item.value,
              enabled: true,
              description: item.description || 'From Preset',
              isManaged: true
            });
          });
        }
      }
      this.queryParams = [...managedParams, ...userParams];
    },

    syncManagedBody() {
      const presetStorage = usePresetStorage();
      
      // 1. Luôn lấy lại dữ liệu sạch của user (loại bỏ tất cả dòng managed cũ)
      const userFormData = this.formData.filter(f => !f.isManaged);
      let managedFormData: FormDataParam[] = [];

      // 2. Nếu có preset được chọn, mới bắt đầu tính toán managedFormData mới
      if (this.selectedBodyPresetId && this.selectedBodyPresetId !== 'preset-none') {
        const preset = presetStorage.bodyPresets.find((p: any) => p.id === this.selectedBodyPresetId);
        
        if (preset && (preset.type === this.bodyType || preset.type === 'body-' + this.bodyType)) {
           if (this.bodyType === 'json') {
             // Logic merge JSON
             const newJson = preset.json || '';
             if (this.body.trim() === '') {
               this.body = newJson;
             } else {
               try {
                 const currentObj = JSON.parse(this.body);
                 const presetObj = JSON.parse(newJson);
                 if (typeof currentObj === 'object' && typeof presetObj === 'object') {
                   this.body = JSON.stringify({ ...presetObj, ...currentObj }, null, 2);
                 } else {
                   this.body = newJson + '\n' + this.body;
                 }
               } catch (e) {
                 this.body = newJson + '\n' + this.body;
               }
             }
           } else if (this.bodyType === 'form-data') {
             managedFormData = preset.formData?.map((item: any, idx: number) => ({
                id: `managed-body-${this.selectedBodyPresetId}-${idx}`,
                key: item.key,
                value: item.value,
                type: (item.type as any) || 'text',
                enabled: true,
                description: item.description || 'From Preset',
                isManaged: true
             })) || [];
           } else if (this.bodyType === 'binary') {
             this.binaryFile = null; // Clear manual file when preset is selected
           }
        } else {
          // Nếu preset không tồn tại hoặc không khớp type, reset ID về null
          this.selectedBodyPresetId = null;
        }
      }

      // 3. Cập nhật lại mảng formData: Managed mới (nếu có) + User Data
      this.formData = [...managedFormData, ...userFormData];
      this.syncManagedHeaders(); // Content-Type might change
    },

    setBodyType(type: BodyType) {
      this.bodyType = type;
      this.syncManagedBody();
      this.syncManagedHeaders();
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
      this.queryParams[index].enabled = !this.queryParams[index].enabled
    },
    toggleAllQueryParams() {
      const isAnyEnabled = this.queryParams.some(p => p.enabled)
      const targetState = !isAnyEnabled
      this.queryParams.forEach(p => p.enabled = targetState)
    },
    updateUriParameter(name: string, value: string) {
      const trimmed = value.trim()
      const index = this.uriParameters.findIndex(v => v.name === name)
      if (index !== -1) {
        this.uriParameters[index].value = trimmed
      } else {
        this.uriParameters.push({ name, value: trimmed })
      }
    },
    addHeader() {
      this.headers.push({ id: nanoid(), key: '', value: '', enabled: true, description: '' })
    },
    removeHeader(index: number) {
      const header = this.headers[index];
      if (header?.isManaged) return; // Không cho xóa managed header
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
      // Giữ lại managed headers
      this.headers = this.headers.filter(h => h.isManaged);
    },
    addFormData() {
      this.formData.push({ id: nanoid(), key: '', value: '', type: 'text', enabled: true, description: '' })
    },
    removeFormData(index: number) {
      const item = this.formData[index];
      if (item?.isManaged) return; // Bảo vệ managed item
      this.formData.splice(index, 1)
    },
    setBaseUrl(url: string) {
      this.baseUrl = url
    },
    setMethod(method: string) {
      this.method = method
      // Một số method không có body (GET, HEAD)
      if (['GET', 'HEAD'].includes(method)) {
        // Có thể set bodyType = none nếu muốn
      }
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
        selectedHeaderPresetId: this.selectedHeaderPresetId,
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
          this.selectedHeaderPresetId = data.selectedHeaderPresetId || null;
          this.syncManagedHeaders();
        } catch (e) {
          console.error('Failed to parse saved request data', e)
        }
      } else {
        this.resetAll()
        
        // Mặc định cho ví dụ upload file nếu là new request cho URL này
        if (this.baseUrl.includes('api.escuelajs.co/api/v1/files/upload')) {
          this.method = 'POST'
          this.bodyType = 'form-data'
          this.formData = [
            { id: nanoid(), key: 'file', value: '', type: 'file', enabled: true, description: 'The file to upload' }
          ]
          this.syncManagedHeaders()
        }
      }
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
