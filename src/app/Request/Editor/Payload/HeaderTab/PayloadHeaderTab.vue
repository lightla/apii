<script setup lang="ts">
import { ref } from 'vue'
import type { RouteInfo } from '@/types'

const props = defineProps<{
  route: RouteInfo
}>()
</script>

<template>
  Headers Tab
  <p>METHOD: {{ props.route?.method }}</p>
  <p>ROUTE: {{ props.route?.route }}</p>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
