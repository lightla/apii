<script setup lang="ts">
import { ref } from 'vue'
import type { RouteInfo } from '@/types'

const props = defineProps<{
  route: RouteInfo
}>()
</script>

<template>
  <label>JSON TAB</label>
  <h2 class="panel-title">Response</h2>
  <label>Status: </label>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
