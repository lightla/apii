<script setup lang="ts">
import { ref } from 'vue'
import type { RouteInfo } from '@/types'
import ParamUrlPreview
  from "@/app/Request/Editor/Payload/ParamTab/Param/ParamUrlPreview.vue";
import ParamPathVariable
  from "@/app/Request/Editor/Payload/ParamTab/Param/ParamPathVariable.vue";
import ParamQueryParam
  from "@/app/Request/Editor/Payload/ParamTab/Param/ParamQueryParam.vue";

const props = defineProps<{
  route: RouteInfo
}>()

</script>

<template>
  <div class="param-tab">
    <ParamUrlPreview :route="props.route"/>
    <ParamPathVariable :route="props.route"/>
    <ParamQueryParam :route="props.route"/>
  </div>
</template>

<style scoped lang="scss">
.param-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
  //border: 1px solid black;
}
</style>
