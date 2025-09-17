// File: RequestManager.vue (ví dụ)
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RouteInfo } from '@/types'
import { useManagerLayoutStorage } from "@/storages";
import SearchInput from "@/app/Generals/SearchInput.vue";
import SearchComponent from "@/app/Generals/SearchComponent.vue";
import SearchHistory from "@/app/Generals/SearchHistory.vue";

const props = defineProps<{
  requests: RouteInfo[]
}>()

const managerLayoutStorage = useManagerLayoutStorage();

// searchResults sẽ được cập nhật bởi SearchComponent thông qua sự kiện @update:results
const searchResults = ref<RouteInfo[]>(props.requests)

const emit = defineEmits(['click'])

// *** SỬA LỖI QUAN TRỌNG Ở ĐÂY ***
// `grouped` phải được tính toán dựa trên `searchResults` (danh sách đã lọc),
// không phải `props.requests` (danh sách gốc).
const grouped = computed(() => {
  const result: Record<string, RouteInfo[]> = {};

  // Sử dụng `searchResults.value` để gom nhóm
  for (const item of searchResults.value) {
    const group = item.group || 'UNGROUPED';

    if (!result[group]) {
      result[group] = [];
    }

    result[group].push(item);
  }

  return result;
});

function handleClick(item: RouteInfo) {
  console.log('Selected route:', item)
  emit('click', item)
}

function formatRoute(route: string) {
  return route.replace(/{([^}]+)}/g, `<span style="color: green;">{$1}</span>`)
}
</script>

<template>
  <div class="request-manager">
    <div class="env-controls">
      <select class="env-select">
        <option v-for="env in managerLayoutStorage.definedManagerLayouts" :key="env.id" :value="env.code">
          {{env.name}}
        </option>
      </select>
    </div>


    <!-- Chỉ cần gọi SearchComponent ở đây -->
    <SearchComponent
        :items="props.requests"
        :fields="['route', 'group']"
        @update:results="searchResults = $event"
    />

    <!-- Hiển thị kết quả đã được gom nhóm -->
    <div class="request-list">
      <div v-if="Object.keys(grouped).length === 0">Không tìm thấy kết quả.</div>
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

<!-- CSS giữ nguyên như của bạn -->
<style scoped lang="scss">
.request-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;

  .env-controls {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .env-select {
    border: 1px solid #888888;
    padding: 5px;
    max-width: 140px;
    min-width: 140px;
    text-overflow: ellipsis;
  }
}

.request-list {
  border: 1px solid #888888;
  padding: 5px;
  flex-grow: 1;
  overflow-y: auto;
}

.group-title {
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.route-line {
  cursor: pointer;
  color: black;
  padding: 3px 6px;
  margin-bottom: 4px;
  line-height: 1.3;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  flex-direction: row;
  gap: 3px;
}

.route-line:hover {
  background: #e2e2e2;
}
</style>
