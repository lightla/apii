<!-- File: src/app/Request/RequestInfo.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RouteInfo } from '@/types'
import EditorJs from "@/app/TextEditor/EditorJS/EditorJs.vue";
import RequestTagManager from "@/app/Generals/TagManager/RequestTagManager.vue";
import AccordionContainer from "@/app/Generals/Accordion/AccordionContainer.vue";
import AccordionItem from "@/app/Generals/Accordion/AccordionItem.vue";
import CodeMirrorContainer from "@/app/Generals/CodeEditor/CodeMirrorContainer.vue";
import BrowserTabContainer from "@/app/Generals/BrowserTab/BrowserTabContainer.vue";
import BrowserTab from "@/app/Generals/BrowserTab/BrowserTab.vue";
import RequestBrowserTabManager from "./RequestBrowserTabManager.vue";
import RequestBrowserTabManager2 from "./RequestBrowserTabManager2.vue";
import RequestBrowserTabManager4 from "./RequestBrowserTabManager4.vue";
import RequestBrowserTabManager3 from "@/app/Request/RequestBrowserTabManager3.vue";

interface SearchField { id: number; key: string; value: string; searchable: boolean; }
const props = defineProps<{ route: RouteInfo | null }>()
const emit = defineEmits(['update:searchableFields', 'route-tags-updated'])

// --- STATE ---
const searchFields = ref<SearchField[]>([])
const searchFieldsStorageKey = ref<string | null>(null)
const editorStorageKey = ref<string | null>(null)

// --- CÁC HÀM TẠO KEY ---
function generateSearchFieldsStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_search_fields_${route.method}_${safeRoute}`
}

function generateEditorStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_editor_content_${route.method}_${safeRoute}`
}

// --- LOGIC CHO BẢNG CẤU HÌNH ---
function emitSearchableKeys() {
  const searchableKeys = searchFields.value
      .filter(field => field.searchable && field.key)
      .map(field => field.key)
  emit('update:searchableFields', searchableKeys)
}

function loadSearchFieldsFromStorage(key: string) {
  const savedData = localStorage.getItem(key)
  searchFields.value = savedData ? JSON.parse(savedData) : []
  emitSearchableKeys()
}

function saveSearchFieldsToStorage() {
  if (searchFieldsStorageKey.value) {
    localStorage.setItem(searchFieldsStorageKey.value, JSON.stringify(searchFields.value))
  }
}

// --- WATCHER CHÍNH: THEO DÕI ROUTE THAY ĐỔI ---
watch(() => props.route, (newRoute) => {
  if (newRoute && newRoute.route) {
    const newSearchKey = generateSearchFieldsStorageKey(newRoute)
    searchFieldsStorageKey.value = newSearchKey
    loadSearchFieldsFromStorage(newSearchKey)

    editorStorageKey.value = generateEditorStorageKey(newRoute)
  } else {
    searchFields.value = []
    searchFieldsStorageKey.value = null
    editorStorageKey.value = null
    emitSearchableKeys()
  }
}, { immediate: true })

// Watcher riêng cho bảng cấu hình
watch(searchFields, () => {
  saveSearchFieldsToStorage()
  emitSearchableKeys()
}, { deep: true })

// --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
function addField() { searchFields.value.push({ id: Date.now(), key: '', value: '', searchable: false }) }
function deleteField(id: number) { searchFields.value = searchFields.value.filter(field => field.id !== id) }
function deleteAllFields() { if (confirm('Bạn có chắc muốn xóa tất cả các trường cho request này?')) { searchFields.value = [] } }

const handleTagsUpdate = (updatedTags: any) => {
  // Logic này đã được chuyển sang handleTagsOutsideClick để emit một lần
};

const handleTagsOutsideClick = (event: MouseEvent, selectedTags: any[]) => {
  if (props.route) {
    emit('route-tags-updated', { routeId: props.route.id, tags: selectedTags });
  }
};



const requests = ref([]);
let requestCounter = 0;

const addRequestTab = () => {
  requestCounter++;
  requests.value.push({
    id: `req_${requestCounter}`,
    title: `Request ${requestCounter}`,
    content: JSON.stringify({ id: `req_${requestCounter}`, method: "GET" }, null, 2),
  });
};

const closeRequestTab = (index) => {
  requests.value.splice(index, 1);
};

// Thêm tab đầu tiên khi tải trang
addRequestTab();

</script>

<template>
  <div class="info-panel">
    <!-- ================================================================ -->
    <!-- SỬA LỖI: Toàn bộ khối này chỉ render khi có props.route hợp lệ -->
    <!-- ================================================================ -->
    <template v-if="props.route">
      <RequestTagManager
          :route="props.route"
          @tags-updated="handleTagsUpdate"
          @click:outside="handleTagsOutsideClick"
      />
      <div class="info-section">
        <div class="info-details">
          <div>
            <span>[{{ props.route.method }}] {{ props.route.route }}</span>
          </div>
        </div>
      </div>

      <!-- Accordion Ghi chú -->
      <AccordionContainer>
        <AccordionItem :start-open="true">
          <template #summary>Ghi chú</template>
          <template #details>
            <div class="milkdown-editor-container">
              <!-- v-if="editorStorageKey" ở đây là một lớp bảo vệ nữa -->
              <TinymceEditor
                  v-if="editorStorageKey"
                  :key="editorStorageKey"
                  :storage-key="editorStorageKey"
              />
            </div>
          </template>
        </AccordionItem>

        <AccordionItem :start-open="true">
          <template #summary>Requests</template>
          <template #details>
            <RequestBrowserTabManager :route="props.route"></RequestBrowserTabManager>
          </template>
        </AccordionItem>

        <AccordionItem :start-open="true">
          <template #summary>Requests2</template>
          <template #details>
            <RequestBrowserTabManager2 :route="props.route"></RequestBrowserTabManager2>
          </template>
        </AccordionItem>

        <AccordionItem :start-open="true">
          <template #summary>Requests4</template>
          <template #details>
            <RequestBrowserTabManager4 :route="props.route"></RequestBrowserTabManager4>
          </template>
        </AccordionItem>

        <AccordionItem :start-open="true">
          <template #summary>Requests3</template>
          <template #details>
            <RequestBrowserTabManager3 :route="props.route"></RequestBrowserTabManager3>
          </template>
        </AccordionItem>
      </AccordionContainer>

      <hr class="separator">

      <!-- Bảng cấu hình trường tìm kiếm -->
      <div class="search-config-section">
        <div class="table-header">
          <h2>Cấu hình trường tìm kiếm</h2>
          <div>
            <button @click="addField" class="action-btn add-btn">Thêm</button>
            <button @click="deleteAllFields" class="action-btn delete-all-btn">Xóa tất cả</button>
          </div>
        </div>
        <table class="config-table">
          <thead><tr><th>Key</th><th>Value</th><th>Searchable</th><th>Action</th></tr></thead>
          <tbody>
          <tr v-for="field in searchFields" :key="field.id">
            <td><input type="text" v-model="field.key" placeholder="Tên trường..."></td>
            <td><input type="text" v-model="field.value" placeholder="Giá trị..."></td>
            <td class="text-center"><input type="checkbox" v-model="field.searchable"></td>
            <td class="text-center"><button @click="deleteField(field.id)" class="delete-row-btn">X</button></td>
          </tr>
          <tr v-if="searchFields.length === 0"><td colspan="4" class="text-center empty-row">Chưa có trường nào.</td></tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- ================================================================ -->
    <!-- Chỉ hiển thị thông báo này khi không có route nào được chọn -->
    <!-- ================================================================ -->
    <div v-else class="empty-state">
      <p>Chưa chọn route nào.</p>
      <p>Hãy chọn một request từ danh sách để xem chi tiết và cấu hình.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Giữ nguyên toàn bộ style của bạn, chỉ thêm 2 class mới

.info-panel { padding: 15px; display: flex; flex-direction: column; gap: 20px; }
.info-section h2, .search-config-section h2 { margin-top: 0; margin-bottom: 15px; font-size: 1.2em; }
.info-details { display: flex; flex-direction: column; gap: 8px; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 0.95em; }
.info-details span { font-family: monospace; }
.separator { border: none; border-top: 1px solid #dee2e6; }
.table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.action-btn { padding: 6px 12px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-left: 8px; }
.add-btn { background-color: #007bff; color: white; border-color: #007bff; &:hover { background-color: #0069d9; } }
.delete-all-btn { background-color: #dc3545; color: white; border-color: #dc3545; &:hover { background-color: #c82333; } }
.config-table { width: 100%; border-collapse: collapse; }
.config-table th, .config-table td { border: 1px solid #dee2e6; padding: 8px; }
.config-table th { background-color: #f8f9fa; text-align: left; }
.config-table input[type="text"] { width: 100%; border: 1px solid #ced4da; padding: 6px; border-radius: 4px; box-sizing: border-box; &:focus { border-color: #80bdff; outline: 0; } }
.text-center { text-align: center; }
.delete-row-btn { background: none; border: none; color: #dc3545; font-weight: bold; cursor: pointer; font-size: 1.1em; }
.empty-row { color: #6c757d; padding: 20px; }

.editor-padding {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.milkdown-editor-container {
  min-height: 200px;
  height: 200px;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid #dee2e6;
  overscroll-behavior: contain;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background-color: #f8f9fa;
}
</style>
