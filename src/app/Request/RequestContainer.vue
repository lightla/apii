<!-- src\apii\RequestContainer.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestManager from './RequestManager.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'
import RequestInfo from "@/app/Request/RequestInfo.vue";

import IconEditor from '@/assets/svg/feathericons/edit.svg'
import IconInfo from '@/assets/svg/feathericons/info.svg'

const props = defineProps<{
  requestsData: RouteInfo[]
}>()

// --- Định nghĩa các hằng số ---
const STORAGE_KEY_LEFT_WIDTH = 'containerLeftWidth'
const STORAGE_KEY_ACTIVE_TAB = 'activeRightTab'
type RightTab = 'editor' | 'info'

// --- State ---
const containerLeftWidth = ref(40)
const clickedRoute = ref<RouteInfo | null>(null)
const activeRightTab = ref<RightTab>('editor')

// State cho các trường tìm kiếm. Sẽ được cập nhật động.
const searchableFields = ref<string[]>(['route', 'group']) // Bắt đầu với giá trị mặc định

// --- Hàm xử lý ---
const updateLeftWidth = (newWidth: number) => {
  containerLeftWidth.value = newWidth
}

const clickRoute = (route: RouteInfo) => {
  clickedRoute.value = route
}

// Hàm này nhận các trường từ RequestInfo và cập nhật state
const updateSearchableFields = (customKeys: string[]) => {
  // Luôn bắt đầu với các trường mặc định và thêm các trường tùy chỉnh vào
  searchableFields.value = [...new Set(['route', 'group', ...customKeys])]
  console.log('Container: Đã nhận và cập nhật searchableFields ->', searchableFields.value);
}

// --- Logic `onMounted` và `watch` ---
onMounted(() => {
  // Tải chiều rộng cột
  const savedLeftWidthStr = localStorage.getItem(STORAGE_KEY_LEFT_WIDTH)
  if (savedLeftWidthStr) {
    containerLeftWidth.value = Number(savedLeftWidthStr)
  }

  // Tải tab đang active
  const savedActiveTab = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB)
  if (savedActiveTab === 'editor' || savedActiveTab === 'info') {
    activeRightTab.value = savedActiveTab
  }
})

// Theo dõi và lưu chiều rộng
watch(containerLeftWidth, (newVal) => {
  localStorage.setItem(STORAGE_KEY_LEFT_WIDTH, String(newVal))
})

// Theo dõi và lưu tab đang active
watch(activeRightTab, (newTab) => {
  localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, newTab)
})
</script>

<template>
  <div class="container">
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <!-- Truyền các trường tìm kiếm đã được cập nhật xuống -->
      <RequestManager
          :requests="props.requestsData"
          :search-fields="searchableFields"
          @click="clickRoute"
      />
    </div>

    <Resizer class="resizer" @resize="updateLeftWidth" />

    <div class="container-right">
      <RequestEditor v-if="activeRightTab === 'editor'" :route="clickedRoute" />
      <RequestInfo
          v-if="activeRightTab === 'info'"
          :route="clickedRoute"
          @update:searchable-fields="updateSearchableFields"
      />
    </div>

    <div class="right-tabs">
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'editor' }"
          @click="activeRightTab = 'editor'"
          title="Editor"
      >
        <IconEditor />
      </div>
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'info' }"
          @click="activeRightTab = 'info'"
          title="Information"
      >
        <IconInfo />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container { display: flex; height: 96vh; width: 100%; border: 1px solid #aaaaaa; background-color: var(--app-bg-color); position: relative; }
.resizer { padding: 0; }
.container-left { padding: 10px; overflow: auto; max-width: 90%; min-width: 200px; }
.container-right { flex: 1; padding: 10px; min-width: 150px; overflow: auto; }
.right-tabs { position: absolute; top: 15px; right: 0; transform: translateX(100%); padding-left: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 1; }
.tab-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; background-color: #f8f9fa; border: 1px solid #aaaaaa; border-radius: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.tab-icon :deep(svg) { width: 18px; height: 18px; color: #495057; }
.tab-icon:hover { background-color: #e9ecef; }
.tab-icon.active { background-color: #e9ecef; border-color: #007bff; }
.tab-icon.active :deep(svg) { color: #007bff; }
</style>
