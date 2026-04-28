<!-- File: src\app\Request\RequestManager.vue -->
<script setup lang="ts">
import { ref, watch, computed, toRaw } from 'vue'
import type { RouteInfo } from '@/types'
import SearchComponent from "@/app/Generals/Search/SearchComponent.vue";
import RequestTagManager from "@/app/Generals/TagManager/RequestTagManager.vue";
import { IconPlus } from '@tabler/icons-vue'

interface SearchFieldConfig { id: number; key: string; value: string; searchable: boolean; }

const props = defineProps<{
  requests: RouteInfo[],
  searchFields: string[],
  showAddToCollection?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', item: RouteInfo): void
  (e: 'add-to-collection', item: RouteInfo): void
}>()

// --- STATE ---
const searchTitleValue = ref<string>("");
const filteredTags = ref<any[]>([]);
const tagFilterMode = ref<'AND' | 'OR'>('OR');

// 🔥 SỬA 1: KHÔI PHỤC LẠI `reactiveEnrichedRequests` VÀ HÀM "LÀM GIÀU"
const reactiveEnrichedRequests = ref<RouteInfo[]>([]);

// Hàm "Làm giàu dữ liệu" - đọc localStorage cho các trường tìm kiếm tùy chỉnh
function enrichAndRefreshData() {
  const enriched = props.requests.map(request => {
    const newRequest = { ...request };
    // Key này phải giống hệt key trong RequestInfo.vue
    const storageKey = `request_info_search_fields_${request.id}`;
    const savedData = localStorage.getItem(storageKey);

    if (savedData) {
      try {
        const customFields: SearchFieldConfig[] = JSON.parse(savedData);
        for (const field of customFields) {
          // Chỉ thêm các trường có key vào object
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
  reactiveEnrichedRequests.value = enriched;
}

// Kích hoạt làm mới khi props thay đổi
watch(() => [props.requests, props.searchFields], () => {
  enrichAndRefreshData();
}, {
  deep: true,
  immediate: true
});


// --- LOGIC LỌC TỔNG HỢP ---
const filteredRequests = computed(() => {
  // 🔥 SỬA 2: Bắt đầu lọc từ `reactiveEnrichedRequests` đã được làm giàu
  let result = reactiveEnrichedRequests.value;

  // 1️⃣ LỌC THEO TỪ KHÓA TÌM KIẾM
  if (searchTitleValue.value) {
    const lowerCaseTerm = searchTitleValue.value.toLowerCase();
    result = result.filter(item => {
      // Logic này bây giờ sẽ tìm trên các trường đã được làm giàu
      return Object.values(item).some(value =>
          value && String(value).toLowerCase().includes(lowerCaseTerm)
      );
    });
  }

  // 2️⃣ LỌC THEO TAG (với logic AND/OR)
  if (filteredTags.value && filteredTags.value.length > 0) {
    const selectedTagIds = filteredTags.value.map(tag => tag.id);
    result = result.filter(req => {
      if (!req.tags || req.tags.length === 0) return false;
      const requestTagIds = new Set(req.tags.map(tag => tag.id));
      if (tagFilterMode.value === 'AND') {
        return selectedTagIds.every(id => requestTagIds.has(id));
      } else {
        return selectedTagIds.some(id => requestTagIds.has(id));
      }
    });
  }

  return result;
});

// --- CÁC HÀM KHÁC (giữ nguyên) ---
const grouped = computed(() => {
  const result: Record<string, RouteInfo[]> = {};
  for (const item of filteredRequests.value) {
    const group = item.group || 'UNGROUPED';
    if (!result[group]) result[group] = [];
    result[group].push(item);
  }
  return result;
});

function handleClick(item: RouteInfo) {
  emit('click', item)
}

function handleAddToCollection(item: RouteInfo) {
  emit('add-to-collection', item)
}

function formatRoute(route: string) {
  return route.replace(/{([^}]+)}/g, `<span class="defined-uri-param">{$1}</span>`)
}
</script>

<template>
  <div class="request-manager">
    <SearchComponent
        :items="reactiveEnrichedRequests"
        :fields="props.searchFields"
        @search:value="searchTitleValue = $event"
    />

    <!-- Bố cục hàng ngang với nút kiểu cột (ĐÃ SỬA LẠI CHO ĐÚNG) -->
    <div class="tag-filter-container-horizontal">
      <RequestTagManager
          class="tag-manager-input"
          route=""
          @tags-updated="filteredTags=$event"
      />
      <button
          class="filter-mode-toggle-column"
          @click="tagFilterMode = (tagFilterMode === 'OR' ? 'AND' : 'OR')"
          :title="`Chế độ lọc tag: ${tagFilterMode}. Click để chuyển.`"
      >
        <div :class="{ 'active': tagFilterMode === 'OR' }">OR</div>
        <div :class="{ 'active': tagFilterMode === 'AND' }">AND</div>
      </button>
    </div>

    <!-- Hiển thị kết quả đã được gom nhóm -->
    <div class="request-list">
      <div v-if="Object.keys(grouped).length === 0" class="no-results">Không tìm thấy kết quả.</div>
      <template v-else v-for="(groupItems, groupName) in grouped" :key="groupName">
        <div class="group-title">{{ groupName }}</div>
        <div
            v-for="item in groupItems"
            :key="item.id"
            class="route-line"
            @click="handleClick(item)"
        >
          <div class="route-main">
            <span style="color: blue">{{ item.method || 'POST' }} </span>
            <span v-html="formatRoute(item.route)" :title="item.route"></span>
          </div>
          <button
              v-if="props.showAddToCollection"
              class="btn-add-to-collection"
              title="Add to current collection"
              @click.stop="handleAddToCollection(item)"
          >
            <IconPlus />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* CSS cũ của bạn giữ nguyên */
.request-manager { padding: 0 10px; display: flex; flex-direction: column; height: 100%; gap: 10px; }
.request-list { border: 1px solid #888888; padding: 5px; flex-grow: 1; overflow-y: auto; }
.group-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
.route-line { cursor: pointer; color: black; padding: 3px 6px; margin-bottom: 4px; line-height: 1.3; user-select: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; flex-direction: row; gap: 3px; }
.route-line:hover { background: #e2e2e2; }
.no-results { padding: 20px; text-align: center; color: #6c757d; }

.route-main { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; display: flex; gap: 3px; }

.btn-add-to-collection {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  background: #f8f9fa;
  cursor: pointer;
}
.btn-add-to-collection:hover { background: #e9ecef; }
.btn-add-to-collection :deep(svg) { width: 14px; height: 14px; color: #495057; }

:deep(.defined-uri-param) {
  color: var(--defined-uri-param);
  font-weight: 500;
}

/* CSS cho layout hàng ngang và nút kiểu cột (ĐÃ SỬA LẠI CHO ĐÚNG) */
.tag-filter-container-horizontal {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tag-manager-input {
  flex-grow: 1;
}

.filter-mode-toggle-column {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 10px 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: #999;
    background-color: #f1f3f5;
  }

  div {
    font-size: 10px;
    font-weight: 700;
    line-height: 1.1;
    color: #adb5bd;
    transition: color 0.2s ease;

    &.active {
      color: #007bff;
    }
  }
}
</style>
