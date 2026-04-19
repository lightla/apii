<script setup lang="ts">
import { watch } from 'vue'
import type { RouteInfo } from '@/types'
import ParamUrlPreview from "@/app/Request/Editor/Payload/ParamTab/Param/ParamUrlPreview.vue";
import ParamPathVariable from "@/app/Request/Editor/Payload/ParamTab/Param/ParamPathVariable.vue";
import ParamQueryParam from "@/app/Request/Editor/Payload/ParamTab/Param/ParamQueryParam.vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()

watch(() => props.route?.route, (url) => {
  if (url) store.baseUrl = url
}, { immediate: true })
</script>

<template>
  <div class="param-tab">
    <ParamUrlPreview :route="props.route"/>
    <ParamPathVariable :route="props.route"/>
    <ParamQueryParam :route="props.route"/>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.param-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow-y: auto;
  @include elements.scrollbar-hidden;
}
</style>
