<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {useInputStorage, useEnvStorage} from "@/storages/env-variables-tmp.ts";
import { IconBrandTelegram } from '@tabler/icons-vue';
import { useResponseStorage } from '@/storages/response.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { parseCurl, matchUrlPattern } from '@/utils/curl-parser.ts'

const props = defineProps<{
  route: RouteInfo
}>()

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();
const responseStorage = useResponseStorage()
const requestParams = useRequestParamsStorage()

const myComponentRef = ref<InstanceType<typeof TrackedVariableInput> | null>(null)
const methodSelectRef = ref<HTMLSelectElement | null>(null)

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

// Khi nhấn Enter hoặc Click ra ngoài: Mới bắt đầu phân giải cURL
const onUrlCommit = (text: string) => {
  processCurlIfPresent(text)
}

const sendRequest = async (_event: Event) => {
  const method = (methodSelectRef.value?.value ?? 'GET').toUpperCase()
  const envVariables = envStorage.definedEnvVariables;
  
  // Trước khi gửi, đảm bảo đã xử lý cURL nếu còn sót
  const currentUrl = myComponentRef.value?.getText() || ''
  processCurlIfPresent(currentUrl)

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
    try {
      responseStorage.data = JSON.parse(responseText)
    } catch {
      responseStorage.data = responseText
    }
  } catch (e) {
    responseStorage.error = String(e)
    responseStorage.responseTime = Date.now() - startTime
  } finally {
    responseStorage.loading = false
  }
}
</script>

<template>
  <div class="request-line">
    <div class="method-select-cover">
      <select 
        ref="methodSelectRef" 
        class="method-select select-control" 
        :value="requestParams.method"
        @change="requestParams.method = ($event.target as HTMLSelectElement).value"
      >
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
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
          @enter="el => onUrlCommit(el.textContent || '')"
      />
    </div>
    <div class="send-request-cover">
      <IconBrandTelegram @click="sendRequest" class="btn-send-request" stroke-width="1"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.request-line {
  display: flex;
  align-items: center;
  max-width: 100%;
}

.method-select {
  display: flex;
  border: 1px solid #888888;
  padding-left: 5px;
  justify-content: center;
  height: 27px;
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
</style>
