<!-- src\apii\RequestContainer.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, toRaw, reactive  } from 'vue'
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

// Hàm này sẽ xử lý việc cập nhật
// File: src/apii/RequestContainer.vue

// ...


// Tạo bản sao reactive để sửa local
const localRequests = reactive([...props.requestsData])


// 🔥🔥🔥 SỬA LỖI CỐT LÕI NẰM Ở ĐÂY 🔥🔥🔥
// Khi props.requestsData thay đổi từ cha, chúng ta sẽ "làm giàu" nó trước khi cập nhật bản sao local.
watch(() => props.requestsData, (newRequests) => {
  if (!newRequests || newRequests.length === 0) {
    localRequests.splice(0, localRequests.length); // Xóa sạch nếu không có dữ liệu mới
    return;
  }

  console.log('%c[Container] PHÁT HIỆN `requestsData` THAY ĐỔI. BẮT ĐẦU LÀM GIÀU DỮ LIỆU TAGS...', 'background: #007bff; color: white;');

  // 1. "LÀM GIÀU" DỮ LIỆU: Lặp qua từng request mới và đọc localStorage
  const enrichedRequests = newRequests.map(req => {
    // a. TẠO KEY ĐỂ ĐỌC TAGS TỪ LOCALSTORAGE
    // Key này phải giống hệt key mà RequestTagManager đang dùng để lưu.
    // Giả sử key có dạng: `tags_{method}_{route}`
    const tagStorageKey = `tags_${req.method}_${req.route}`;
    const savedTagsData = localStorage.getItem(tagStorageKey);

    // b. TẠO OBJECT REQUEST MỚI
    const newReq = { ...req };

    // c. GHI ĐÈ TRƯỜNG `tags` BẰNG DỮ LIỆU TỪ LOCALSTORAGE (NẾU CÓ)
    if (savedTagsData) {
      try {
        newReq.tags = JSON.parse(savedTagsData);
      } catch (e) {
        console.error(`[Container] Lỗi parse tag cho key ${tagStorageKey}`, e);
        // Nếu lỗi thì vẫn giữ lại tag gốc
      }
    }

    return newReq;
  });

  // 2. CẬP NHẬT BẢN SAO LOCAL BẰNG DỮ LIỆU ĐÃ ĐƯỢC LÀM GIÀU
  localRequests.splice(0, localRequests.length, ...enrichedRequests);

  console.log('%c[Container] ĐÃ LÀM GIÀU XONG. `localRequests` đã được cập nhật với tags từ localStorage.', 'background: #28a745; color: white;');

}, { immediate: true, deep: true })


// Nếu props.requestsData thay đổi từ cha, cập nhật lại bản sao
watch(() => props.requestsData, (newVal) => {
  localRequests.splice(0, localRequests.length, ...newVal)
})


// HÀM CỦA BẠN - PHIÊN BẢN SỬA LỖI DỨT ĐIỂM
const updateTagsForRoute = (payload: { routeId: string, tags: string[] }) => {
  // Kiểm tra xem có nhận được payload không
  if (!payload || !payload.routeId) {
    console.error('%c[Container] LỖI: Nhận được sự kiện nhưng không có payload hoặc routeId!', 'color: red; font-weight: bold;');
    return;
  }

  console.log(`%c[Container] NHẬN LỆNH CẬP NHẬT TAGS CHO ROUTE ID: ${payload.routeId}`, 'background: #ff4500; color: white;');
  console.log(' -> Tags mới nhận được:', payload.tags);

  // Dùng props.requestsData trực tiếp, KHÔNG CÓ .value
  const requestToUpdate = localRequests.find(r => r.id === payload.routeId);

  if (requestToUpdate) {
    console.log(' -> Đã tìm thấy request:', requestToUpdate.route);

    // Gán trực tiếp mảng tags đã được toRaw từ trước (nếu cần)
    requestToUpdate.tags = toRaw(payload.tags);

    console.log('%c -> CẬP NHẬT THÀNH CÔNG!', 'background: #28a745; color: white;');
    console.log('props.requestsData', localRequests);
  } else {
    console.error(`%c -> LỖI: KHÔNG TÌM THẤY REQUEST VỚI ID ${payload.routeId}`, 'color: red; font-weight: bold;');
  }
};

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

watch(
    () => props.requestsData,
    (newVal) => {
      console.log("📢 Container thấy toàn bộ requestsData đổi:", JSON.stringify(newVal, null, 2))
    },
    { deep: true, immediate: true }
)
</script>


<template>
  <div class="container">
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <!-- Truyền các trường tìm kiếm đã được cập nhật xuống -->
      <RequestManager
          :requests="localRequests"
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
          @route-tags-updated="updateTagsForRoute"
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
