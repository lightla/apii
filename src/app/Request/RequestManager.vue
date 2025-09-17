<!-- File: src\app\Request\RequestManager.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { RouteInfo } from '@/types'
import SearchComponent from "@/app/Generals/Search/SearchComponent.vue";

interface SearchFieldConfig { id: number; key: string; value: string; searchable: boolean; }

const props = defineProps<{
  requests: RouteInfo[],
  searchFields: string[] // Nhận các trường tìm kiếm từ RequestContainer
}>()

const emit = defineEmits(['click'])

// --- TRÁI TIM CỦA LOGIC REACTIVITY MỚI ---

// 1. Dùng `ref` thay vì `computed` để có thể cập nhật nó một cách chủ động
const reactiveEnrichedRequests = ref<RouteInfo[]>([]);
const searchResults = ref<RouteInfo[]>([]);

// Hàm tạo key duy nhất, phải giống hệt hàm trong RequestInfo.vue
function generateStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_${route.method}_${safeRoute}`
}

// 2. Hàm "Làm giàu dữ liệu" - linh hồn của giải pháp
function enrichAndRefreshData() {
  console.log("Manager: BẮT ĐẦU LÀM GIÀU DỮ LIỆU (enrichAndRefreshData)...");
  const enriched = props.requests.map(request => {
    const newRequest = { ...request };
    const storageKey = generateStorageKey(request);
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const customFields: SearchFieldConfig[] = JSON.parse(savedData);
        for (const field of customFields) {
          if (field.key) {
            (newRequest as any)[field.key] = field.value;
          }
        }
      } catch (e) {
        console.error(`Lỗi đọc key ${storageKey}:`, e);
      }
    }
    return newRequest;
  });

  // Cập nhật `ref` với dữ liệu mới nhất
  reactiveEnrichedRequests.value = enriched;
  console.log("Manager: ĐÃ LÀM GIÀU XONG. Dữ liệu mới đã sẵn sàng.");
}

// 3. THEO DÕI SỰ THAY ĐỔI VÀ KÍCH HOẠT LÀM MỚI
// Khi `searchFields` thay đổi (do người dùng tích/bỏ tích checkbox),
// chúng ta biết rằng cấu hình đã thay đổi và cần làm giàu lại dữ liệu.
watch(() => props.searchFields, () => {
  console.log("Manager: Phát hiện `searchFields` thay đổi. Chuẩn bị làm giàu lại dữ liệu.");
  enrichAndRefreshData();
}, {
  deep: true, // Cần thiết để theo dõi thay đổi bên trong mảng
  immediate: true // Chạy ngay lần đầu tiên để có dữ liệu ban đầu
});

// 4. `grouped` được tính toán dựa trên `searchResults` (không đổi)
const grouped = computed(() => {
  const result: Record<string, RouteInfo[]> = {};
  for (const item of searchResults.value) {
    const group = item.group || 'UNGROUPED';
    if (!result[group]) { result[group] = []; }
    result[group].push(item);
  }
  return result;
});

// --- Các hàm xử lý (không đổi) ---
function handleClick(item: RouteInfo) {
  emit('click', item)
}

function formatRoute(route: string) {
  return route.replace(/{([^}]+)}/g, `<span style="color: green;">{$1}</span>`)
}
</script>

<template>
  <div class="request-manager">
    <!--
      BỎ :key ĐI. Nó là nguyên nhân gây reset ô input.
      SearchComponent bây giờ sẽ tự động phản ứng khi `items` của nó thay đổi.
    -->
    <SearchComponent
        :items="reactiveEnrichedRequests"
        :fields="props.searchFields"
        @update:results="searchResults = $event"
    />

    <!-- Hiển thị kết quả đã được gom nhóm -->
    <div class="request-list">
      <div v-if="Object.keys(grouped).length === 0" class="no-results">Không tìm thấy kết quả.</div>
      <template v-else v-for="(groupItems, groupName) in grouped" :key="groupName">
        <div class="group-title">{{ groupName }}</div>
        <div
            v-for="item in groupItems"
            :key="item.method + item.route"
            class="route-line"
            @click="handleClick(item)"
        >
          <span style="color: blue">{{ item.method || 'POST' }} </span>
          <span v-html="formatRoute(item.route)" :title="item.route"></span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* CSS giữ nguyên như của bạn */
.request-manager { padding: 0 10px; display: flex; flex-direction: column; height: 100%; gap: 10px; }
.request-list { border: 1px solid #888888; padding: 5px; flex-grow: 1; overflow-y: auto; }
.group-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
.route-line { cursor: pointer; color: black; padding: 3px 6px; margin-bottom: 4px; line-height: 1.3; user-select: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; flex-direction: row; gap: 3px; }
.route-line:hover { background: #e2e2e2; }
.no-results { padding: 20px; text-align: center; color: #6c757d; }
</style>
