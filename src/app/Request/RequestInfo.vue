<!-- src\apii\RequestContainer.vue -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestManager from './RequestManager.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'

// Import các icon của bạn
import IconEditor from '@/assets/svg/feathericons/edit.svg'
import IconInfo from '@/assets/svg/feathericons/info.svg'

const props = defineProps<{
  route: RouteInfo
}>()

</script>

<template>
  <div class="info-panel">
    <h2>Thông tin Route</h2>
    <p v-if="props.route">
      <strong>Method:</strong> {{ props.route.method }}

      <strong>Route:</strong> {{ props.route.route }}

      <strong>Group:</strong> {{ props.route.group }}
    </p>
    <p v-else>Chưa chọn route nào.</p>
  </div>
</template>