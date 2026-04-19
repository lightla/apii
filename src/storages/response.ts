import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useResponseStorage = defineStore('api-response', () => {
  const loading = ref(false)
  const status = ref<number | null>(null)
  const statusText = ref<string>('')
  const data = ref<any>(null)
  const rawBody = ref<string>('')
  const error = ref<string | null>(null)
  const responseTime = ref<number | null>(null)
  const responseHeaders = ref<Record<string, string>>({})
  const requestUrl = ref<string>('')
  const requestMethod = ref<string>('')

  function reset() {
    loading.value = false
    status.value = null
    statusText.value = ''
    data.value = null
    rawBody.value = ''
    error.value = null
    responseTime.value = null
    responseHeaders.value = {}
    requestUrl.value = ''
    requestMethod.value = ''
  }

  return { loading, status, statusText, data, rawBody, error, responseTime, responseHeaders, requestUrl, requestMethod, reset }
})
