<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RouteInfo } from '@/types'
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()

const requestParams = useRequestParamsStorage()
const theme = ref('one-dark')

const defaultBody = JSON.stringify({
  "name": "Apple MacBook Pro 16",
  "data": {
    "year": 2019,
    "price": 1849.99,
    "CPU model": "Intel Core i9",
    "Hard disk size": "1 TB"
  }
}, null, 2)

onMounted(() => {
  if (!requestParams.body) {
    requestParams.body = defaultBody
  }
})
</script>

<template>
  <div class="body-tab">
    <CodeMirrorContainer2
      v-model="requestParams.body"
      :theme="theme"
      :show-beautify="true"
      :show-copy="true"
      @update:theme="t => theme = t"
    />
  </div>
</template>

<style scoped>
.body-tab {
  height: 100%;
  width: 100%;
  min-height: 0;
}
</style>
