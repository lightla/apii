<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {useInputStorage, useEnvStorage} from "@/storages/env-variables-tmp.ts";
import { IconBrandTelegram } from '@tabler/icons-vue';
import { useResponseStorage } from '@/storages/response.ts'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{
  route: RouteInfo
}>()

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();
const responseStorage = useResponseStorage()
const requestParams = useRequestParamsStorage()

const myComponentRef = ref<InstanceType<typeof TrackedVariableInput> | null>(null)
const methodSelectRef = ref<HTMLSelectElement | null>(null)

onMounted(() => {
  // inputStorage.trackedHighlightInputs.push();
})

const enterUrlInput = (urlInput: HTMLDivElement) => {
  console.log(urlInput)
}

const sendRequest = async (_event: Event) => {
  const method = (methodSelectRef.value?.value ?? 'GET').toUpperCase()
  
  // SỬA LỖI: Lấy env variables từ storage đúng cách
  const envVariables = envStorage.definedEnvVariables;
  
  // Bắt đầu với URL từ preview (đã có path vars và query params)
  let url = requestParams.urlPreview;
  
  // Replace environment variables {{name}} -> value
  envVariables.forEach(variable => {
    if (variable.name && variable.value) {
      // Dùng regex để replace global
      const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      url = url.replace(new RegExp(escapedName, 'g'), variable.value);
    }
  });

  if (!url) return

  responseStorage.reset()
  responseStorage.loading = true

  const hasBody = ['POST', 'PUT', 'PATCH'].includes(method)
  const fetchOptions: RequestInit = { method, headers: {} as Record<string, string> }

  // Thêm các headers từ UI (Headers tab)
  requestParams.headers.forEach(header => {
    if (header.enabled && header.key.trim()) {
      // SỬA LỖI TRIỆT ĐỂ: Loại bỏ tất cả ký tự xuống dòng (\n, \r) trong toàn bộ chuỗi
      const cleanValue = header.value.replace(/[\r\n]+/gm, "").trim();
      (fetchOptions.headers as Record<string, string>)[header.key.trim()] = cleanValue;
    }
  });

  // Nếu có body, ép kiểu Content-Type nếu chưa có
  if (hasBody && requestParams.body) {
    if (!(fetchOptions.headers as Record<string, string>)['Content-Type']) {
      (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    fetchOptions.body = requestParams.body
  }

  responseStorage.requestUrl = url
  responseStorage.requestMethod = method

  const startTime = Date.now()
  try {
    const res = await fetch(url, fetchOptions)
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
      <select ref="methodSelectRef" class="method-select select-control" :value="props.route?.method || 'GET'">
        <option value="GET" selected>GET</option>
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
          :placeholder="'Enter URL'"
          :value="requestParams.baseUrl"
          :enabled-env-variable="true"
          :enabled-uri-param="true"
          @enter="enterUrlInput"
          @text-change="url => requestParams.baseUrl = url"
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
  //border: 1px solid black;
  //gap: 5px;
  //gap: 10px;
  //padding: 5px 15px;
}

.method-select-cover {
}

.method-select {
  //width: 10%;
  //background-color: #888888;
  display: flex;
  border: 1px solid #888888;
  //border: none;
  //padding: 5px;
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
  //background-color: #dddddd;
  max-width: 100%;
  width: 100%;
  min-height: 31px;
  overflow-x: hidden; // Không dùng được do css không hỗ trợ
}

.send-request-cover {
  //background-color: #007bff;
  //padding-left: 5px;
  //border: 1px solid #888888;
}

.btn-send-request {
  cursor: pointer;
  //width: 30px;
  height: 30px;
  width: 30px;
  //fill: #666;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

</style>
