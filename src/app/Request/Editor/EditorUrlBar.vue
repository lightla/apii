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

const onUrlChange = (newText: string) => {
  const trimmed = newText.trim()
  if (trimmed.startsWith('curl ')) {
    const parsed = parseCurl(trimmed)
    
    if (props.route?.route) {
      const uriMatches = matchUrlPattern(props.route.route, parsed.url)
      if (uriMatches) {
        Object.entries(uriMatches).forEach(([key, value]) => {
          requestParams.updateUriParameter(key, value)
        })
        requestParams.baseUrl = props.route.route
      } else {
        requestParams.baseUrl = parsed.url
      }
    } else {
      requestParams.baseUrl = parsed.url
    }

    requestParams.applyParsedCurl(parsed)
  } else {
    requestParams.baseUrl = newText
  }
}

const sendRequest = async (_event: Event) => {
  const method = (methodSelectRef.value?.value ?? 'GET').toUpperCase()
  const envVariables = envStorage.definedEnvVariables;
  
  // Bắt đầu với URL từ preview
  let url = requestParams.urlPreview;
  
  // Replace environment variables {{name}} -> value
  envVariables.forEach(variable => {
    if (variable.name && variable.value) {
      const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      url = url.replace(new RegExp(escapedName, 'g'), variable.value);
    }
  });

  if (!url) return

  // --- Áp dụng CORS Proxy nếu được bật ---
  const finalUrl = requestParams.useProxy 
    ? `${requestParams.proxyUrl}${url}`
    : url;

  responseStorage.reset()
  responseStorage.loading = true

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)
  const fetchOptions: RequestInit = { method, headers: {} as Record<string, string> }

  requestParams.headers.forEach(header => {
    if (header.enabled && header.key.trim()) {
      const cleanValue = header.value.replace(/[\r\n]+/gm, "").trim();
      (fetchOptions.headers as Record<string, string>)[header.key.trim()] = cleanValue;
    }
  });

  if (hasBody && requestParams.body) {
    if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
      (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    fetchOptions.body = requestParams.body
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
      <select ref="methodSelectRef" class="method-select select-control" :value="requestParams.method">
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
