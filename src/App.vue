<script setup lang="ts">
import RequestContainer from './app/Request/RequestContainer.vue'
import EditorPopupMenu from "@/app/Request/Editor/EditorPopupMenu.vue";
import type {RouteInfo} from './types';

const props = defineProps<{
  requestsData: RouteInfo[],
  saveUrl: string
}>()

</script>

<template>
  <div>
    <EditorPopupMenu :editor="null" />
    <RequestContainer :requestsData="props.requestsData"/>
  </div>
</template>