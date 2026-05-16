<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance, watch } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {useInputStorage, useEnvStorage} from "@/storages/env-variables-tmp.ts";
import { IconBrandTelegram, IconBookmark } from '@tabler/icons-vue';
import { useResponseStorage } from '@/storages/response.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { useHistoryStorage } from '@/storages/history.ts'
import { parseCurl, matchUrlPattern } from '@/utils/curl-parser.ts'
import { nanoid } from 'nanoid'

const props = defineProps<{
  route: RouteInfo
  storageKey: string
}>()

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();
const responseStorage = useResponseStorage()
const requestParams = useRequestParamsStorage()
const historyStorage = useHistoryStorage()

const myComponentRef = ref<InstanceType<typeof TrackedVariableInput> | null>(null)

const isMethodSelectOpen = ref(false)
const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const methodDropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

const toggleMethodSelect = (event: Event) => {
  event.stopPropagation()
  if (isMethodSelectOpen.value) {
    isMethodSelectOpen.value = false;
  } else {
    isMethodSelectOpen.value = true;
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    methodDropdownStyle.value = {
      top: `${rect.bottom + 2}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    };
  }
}

const selectMethod = (method: string) => {
  requestParams.method = method
  isMethodSelectOpen.value = false
}

const closeMethodSelect = () => {
  isMethodSelectOpen.value = false
}

const instance = getCurrentInstance()
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    // Chỉ trigger nếu component này đang hiển thị (tránh bị trigger ở tab ẩn)
    const el = instance?.vnode.el as HTMLElement
    if (el && el.offsetParent !== null) {
      sendRequest()
    }
  }
}

onMounted(() => {
  window.addEventListener('click', closeMethodSelect)
  window.addEventListener('keydown', handleGlobalKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMethodSelect)
  window.removeEventListener('keydown', handleGlobalKeyDown)
})

// Hàm xử lý phân giải cURL tập trung
const processCurlIfPresent = (text: string) => {
  const trimmed = text.trim()
  if (trimmed.startsWith('curl ')) {
    const parsed = parseCurl(trimmed)
    let finalBaseUrl = parsed.url;
    
    if (props.route?.route) {
      const uriMatches = matchUrlPattern(props.route.route, parsed.url)
      if (uriMatches) {
        Object.entries(uriMatches).forEach(([key, value]) => {
          requestParams.updateUriParameter(key, value)
        })
        finalBaseUrl = props.route.route
      }
    }

    requestParams.baseUrl = finalBaseUrl
    requestParams.applyParsedCurl(parsed)
    myComponentRef.value?.setText(finalBaseUrl)
  }
}

// Khi đang gõ: Chỉ cập nhật baseUrl thô (cho URL Preview)
const onUrlChange = (newText: string) => {
  requestParams.baseUrl = newText
}

watch(() => requestParams.triggerSendCount, (newVal) => {
  if (newVal > 0) {
    sendRequest()
  }
})

// Khi nhấn Enter hoặc Click ra ngoài: Mới bắt đầu phân giải cURL
const onUrlCommit = (text: string) => {
  processCurlIfPresent(text)
}

const getValueByPath = (source: any, path: string): any => {
  if (!path) return source
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), source)
}

const runRequestScript = async (
  script: string,
  context: { responseBody?: any; responseHeaders?: Record<string, string>; status?: number; error?: string } = {}
) => {
  if (!script || !script.trim()) return
  const apii = {
    env: {
      get: (name: string) => envStorage.getVariableValueByName(name),
      set: (name: string, value: any) => envStorage.setVariableValueByName(name, String(value ?? '')),
    },
    request: {
      getUrl: () => requestParams.baseUrl,
      setUrl: (url: string) => { requestParams.baseUrl = String(url ?? '') },
      getMethod: () => requestParams.method,
      setMethod: (method: string) => { requestParams.method = String(method ?? 'GET').toUpperCase() },
      setHeader: (key: string, value: string) => {
        const headerKey = String(key ?? '').trim()
        if (!headerKey) return
        const existing = requestParams.headers.find(h => h.key.toLowerCase() === headerKey.toLowerCase())
        if (existing) {
          existing.value = String(value ?? '')
          existing.enabled = true
          return
        }
        requestParams.headers.push({
          id: nanoid(),
          key: headerKey,
          value: String(value ?? ''),
          enabled: true,
          description: 'Set by script',
        })
      },
      setBody: (body: any) => { requestParams.body = typeof body === 'string' ? body : JSON.stringify(body ?? {}) },
    },
    response: {
      status: context.status ?? 0,
      headers: context.responseHeaders || {},
      error: context.error || '',
      body: context.responseBody,
      json: (path?: string) => getValueByPath(context.responseBody, path || ''),
      text: () => (typeof context.responseBody === 'string' ? context.responseBody : JSON.stringify(context.responseBody ?? '')),
    },
    console,
  }

  try {
    await new Function(
      'apii',
      `return (async () => { ${script} })();`
    )(apii)
  } catch (e) {
    console.error('[Script Runtime Error]', e)
    responseStorage.error = `Script error: ${String(e)}`
  }
}

const sendRequest = async (_event?: any) => {
  const method = (requestParams.method || 'GET').toUpperCase()
  const envVariables = envStorage.definedEnvVariables;
  
  // Trước khi gửi, đảm bảo đã xử lý cURL nếu còn sót
  const currentUrl = myComponentRef.value?.getText() || ''
  processCurlIfPresent(currentUrl)
  await runRequestScript(requestParams.preRequestScript)

  const resolveEnvVars = (text: string): string => {
    let result = text
    envVariables.forEach(variable => {
      if (variable.name && variable.value) {
        const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(escapedName, 'g'), variable.value);
      }
    });
    return result
  }

  let url = requestParams.urlPreview;
  url = resolveEnvVars(url)

  if (!url) return

  const finalUrl = requestParams.useProxy 
    ? `${requestParams.proxyUrl}${url}`
    : url;

  responseStorage.reset()
  responseStorage.loading = true

  const fetchOptions: RequestInit = { method, headers: {} as Record<string, string> }

  // 1. Build Headers
  requestParams.headers.forEach(header => {
    if (header.enabled && header.key.trim()) {
      const cleanValue = resolveEnvVars(header.value.replace(/[\r\n]+/gm, "").trim());
      (fetchOptions.headers as Record<string, string>)[header.key.trim()] = cleanValue;
    }
  });


  // 2. Build Body dựa trên bodyType
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  
  if (hasBody) {
    if (requestParams.bodyType === 'json' && requestParams.body) {
      if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }
      fetchOptions.body = resolveEnvVars(requestParams.body)
    } 
    else if (requestParams.bodyType === 'form-data') {
      const formData = new FormData();
      requestParams.formData.forEach(item => {
        if (item.enabled && item.key.trim()) {
          const key = resolveEnvVars(item.key.trim());
          if (item.type === 'file' && item.file) {
            formData.append(key, item.file);
          } else {
            formData.append(key, resolveEnvVars(item.value));
          }
        }
      });
      fetchOptions.body = formData;
      // QUAN TRỌNG: Xóa Content-Type để trình duyệt tự thêm boundary
      delete (fetchOptions.headers as Record<string, string>)['Content-Type'];
    }
    else if (requestParams.bodyType === 'binary' && requestParams.binaryFile) {
      fetchOptions.body = requestParams.binaryFile;
    }
  }

  responseStorage.requestUrl = finalUrl
  responseStorage.requestMethod = method

  const startTime = Date.now()
  try {
    const res = await fetch(finalUrl, fetchOptions)
    responseStorage.status = res.status
    responseStorage.statusText = res.statusText
    responseStorage.responseTime = Date.now() - startTime
    const headers: Record<string, string> = {}
    res.headers.forEach((value, key) => { headers[key] = value })
    responseStorage.responseHeaders = headers
    const responseText = await res.text()
    responseStorage.rawBody = responseText
    let parsedData: any
    try {
      parsedData = JSON.parse(responseText)
      responseStorage.data = parsedData
    } catch {
      parsedData = responseText
      responseStorage.data = parsedData
    }

    // Record History
    historyStorage.addRecent(props.storageKey, {
      requestId: props.storageKey,
      timestamp: Date.now(),
      method: method,
      url: finalUrl,
      status: res.status,
      statusText: res.statusText,
      duration: Date.now() - startTime,
      response: parsedData,
      responseType: res.headers.get('content-type') || 'text/plain',
      responseHeaders: headers,
      requestData: {
        baseUrl: requestParams.baseUrl,
        method: requestParams.method,
        headers: [...requestParams.headers],
        queryParams: [...requestParams.queryParams],
        uriParameters: [...requestParams.uriParameters],
        body: requestParams.body,
        bodyType: requestParams.bodyType,
        selectedHeaderPresetIds: [...requestParams.selectedHeaderPresetIds],
        selectedQueryPresetIds: [...requestParams.selectedQueryPresetIds],
        selectedBodyPresetIds: [...requestParams.selectedBodyPresetIds],
      }
    })
    await runRequestScript(requestParams.postRequestScript, {
      responseBody: parsedData,
      responseHeaders: headers,
      status: res.status,
    })
  } catch (e) {
    responseStorage.error = String(e)
    responseStorage.responseTime = Date.now() - startTime
    
    // Record Failed History
    historyStorage.addRecent(props.storageKey, {
      requestId: props.storageKey,
      timestamp: Date.now(),
      method: method,
      url: finalUrl,
      status: 0,
      statusText: String(e),
      duration: Date.now() - startTime,
      response: null,
      responseType: 'error',
      responseHeaders: {},
      error: String(e),
      requestData: {
        baseUrl: requestParams.baseUrl,
        method: requestParams.method,
        headers: [...requestParams.headers],
        queryParams: [...requestParams.queryParams],
        uriParameters: [...requestParams.uriParameters],
        body: requestParams.body,
        bodyType: requestParams.bodyType,
        selectedHeaderPresetIds: [...requestParams.selectedHeaderPresetIds],
        selectedQueryPresetIds: [...requestParams.selectedQueryPresetIds],
        selectedBodyPresetIds: [...requestParams.selectedBodyPresetIds],
      }
    })
    await runRequestScript(requestParams.postRequestScript, {
      responseBody: null,
      responseHeaders: {},
      status: 0,
      error: String(e),
    })
  } finally {
    responseStorage.loading = false
  }
}

const saveCurrentSnapshot = () => {
  const method = (requestParams.method || 'GET').toUpperCase()
  const url = requestParams.urlPreview || requestParams.baseUrl || ''

  historyStorage.saveSnapshot(props.storageKey, {
    requestId: props.storageKey,
    timestamp: Date.now(),
    method,
    url,
    status: responseStorage.status || 0,
    statusText: responseStorage.statusText || 'Snapshot',
    duration: responseStorage.responseTime || 0,
    response: responseStorage.data || responseStorage.rawBody || null,
    responseType: responseStorage.responseHeaders?.['content-type'] || 'application/json',
    responseHeaders: { ...(responseStorage.responseHeaders || {}) },
    error: responseStorage.error || '',
    requestData: {
      baseUrl: requestParams.baseUrl,
      method: requestParams.method,
      headers: [...requestParams.headers],
      queryParams: [...requestParams.queryParams],
      uriParameters: [...requestParams.uriParameters],
      body: requestParams.body,
      bodyType: requestParams.bodyType,
      selectedHeaderPresetIds: [...requestParams.selectedHeaderPresetIds],
      selectedQueryPresetIds: [...requestParams.selectedQueryPresetIds],
      selectedBodyPresetIds: [...requestParams.selectedBodyPresetIds],
    }
  })
}
</script>

<template>
  <div class="request-line">
    <div class="custom-method-select" :class="{ 'is-active': isMethodSelectOpen }">
      <div class="method-select-trigger" @click="toggleMethodSelect">
        <span>{{ requestParams.method }}</span>
        <span class="dropdown-arrow">▼</span>
      </div>
      <Teleport to="body">
        <div class="method-select-dropdown" v-if="isMethodSelectOpen" :style="methodDropdownStyle">
          <div 
            v-for="m in methods" 
            :key="m" 
            class="method-select-option" 
            @click="selectMethod(m)"
          >
            {{ m }}
          </div>
        </div>
      </Teleport>
    </div>
    <div class="url-bar-cover">
      <TrackedVariableInput
          ref="myComponentRef"
          :route="props.route"
          :placeholder="'Enter URL or paste cURL'"
          :value="requestParams.baseUrl"
          :enabled-env-variable="true"
          :enabled-uri-param="true"
          @text-change="onUrlChange"
          @blur="onUrlCommit"
          @enter="() => sendRequest()"
      />
    </div>
      <div class="send-request-cover">
      <IconBrandTelegram @click="sendRequest" class="btn-send-request" stroke-width="1"/>
      <button class="icon-action-btn" @click="saveCurrentSnapshot" title="Save snapshot" aria-label="Save snapshot">
        <IconBookmark class="btn-save-request" stroke-width="1.6" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.request-line {
  display: flex;
  align-items: center;
  max-width: 100%;
}

.custom-method-select {
  position: relative;
  width: 100px; /* Cố định width cho method */
  height: 27px;
  font-size: 13px;
  color: #333;
  
  &.is-active {
    z-index: 1000;
  }
}

.method-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  background-color: #e8e8e8;
  border: 1px solid #888888;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  
  &:hover {
    background-color: #e2e2e2;
  }
}

.dropdown-arrow {
  font-size: 9px;
  color: #666;
}

.method-select-dropdown {
  position: fixed;
  background-color: #f0f0f0;
  border: 1px solid #888888;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 100000;
  font-family: "Calibri", Arial, sans-serif;
  font-size: 13px;
  color: #333;
}

.method-select-option {
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  
  &:hover {
    background-color: #cccccc;
    color: #000;
  }
}

.url-bar-cover {
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-right: 5px;
  padding-top: 1px;
  padding-bottom: 2px;
  max-width: 100%;
  width: 100%;
  min-height: 31px;
  overflow-x: hidden;
}

.btn-send-request {
  cursor: pointer;
  height: 30px;
  width: 30px;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.send-request-cover {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-action-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn-save-request {
  width: 19px;
  height: 19px;
  color: #444;

  .icon-action-btn:hover & {
    color: #000;
  }
}
</style>
