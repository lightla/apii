<!-- src/App.vue -->
<script setup lang="ts">
import RequestContainer from './app/Request/RequestContainer.vue'
import type {RouteInfo} from './types';

const props = defineProps<{
  requestsData: RouteInfo[],
  saveUrl: string
}>()

</script>

<template>
  <div>
    <RequestContainer :requestsData="props.requestsData"/>
  </div>
</template>