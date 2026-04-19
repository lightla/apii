<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestTagManager from "@/app/Generals/TagManager/RequestTagManager.vue";
import AccordionContainer from "@/app/Generals/Accordion/AccordionContainer.vue";
import AccordionItem from "@/app/Generals/Accordion/AccordionItem.vue";
import QuillEditor from "@/app/TextEditor/Quill/QuillEditor.vue";
import RequestBrowserTabManager2 from "./RequestBrowserTabManager2.vue";

interface SearchField { id: number; key: string; value: string; searchable: boolean; }
const props = defineProps<{ route: RouteInfo | null }>()
const emit = defineEmits(['update:searchableFields', 'route-tags-updated'])

const searchFields = ref<SearchField[]>([])
const searchFieldsStorageKey = ref<string | null>(null)
const editorStorageKey = ref<string | null>(null)

function generateSearchFieldsStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_search_fields_${route.method}_${safeRoute}`
}

function generateEditorStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_note_quill_${route.method}_${safeRoute}`
}

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

watch(searchFields, () => {
  saveSearchFieldsToStorage()
  emitSearchableKeys()
}, { deep: true })

const handleTagsOutsideClick = (event: MouseEvent, selectedTags: any[]) => {
  if (props.route) {
    emit('route-tags-updated', { routeId: props.route.id, tags: selectedTags });
  }
};

function addField() { searchFields.value.push({ id: Date.now(), key: '', value: '', searchable: false }) }
function deleteField(id: number) { searchFields.value = searchFields.value.filter(field => field.id !== id) }
function deleteAllFields() { if (confirm('Bạn có chắc muốn xóa tất cả các trường cho request này?')) { searchFields.value = [] } }

</script>

<template>
  <div class="info-panel">
    <template v-if="props.route">
      <RequestTagManager
          :route="props.route"
          @click:outside="handleTagsOutsideClick"
      />

      <!-- NOTE SECTION - ĐÃ PHÁ BẪY CHUỘT -->
      <div class="note-container">
        <div class="note-header">
          <!-- Sử dụng tabindex để nhãn có thể nhận focus và cướp quyền từ Editor -->
          <div class="note-label-focus-target" tabindex="0">
            Note
          </div>
        </div>
        <div class="note-body">
          <QuillEditor
              v-if="editorStorageKey"
              :key="editorStorageKey"
              :storage-key="editorStorageKey"
          />
        </div>
      </div>

      <AccordionContainer>
        <AccordionItem :start-open="true">
          <template #summary>Requests</template>
          <template #details>
            <RequestBrowserTabManager2 :route="props.route"></RequestBrowserTabManager2>
          </template>
        </AccordionItem>
      </AccordionContainer>

      <hr class="separator">

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

    <div v-else class="empty-state">
      <p>Chưa chọn route nào.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.info-panel { 
  padding: 15px; 
  display: flex; 
  flex-direction: column; 
  gap: 20px; 
  user-select: text !important;
}

.note-container {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.note-header {
  display: flex;
  margin-bottom: 5px;
}

.note-label-focus-target {
  padding: 5px 12px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  user-select: text !important;
  cursor: text;
  outline: none; /* Ẩn viền focus mặc định của trình duyệt */

  &:focus {
    /* Khi click vào nhãn, nó nhận focus và giữ quyền copy */
    border-color: #007bff;
  }
}

.note-body {
  width: 100%;
}

.separator { border: none; border-top: 1px solid #dee2e6; margin: 10px 0; }
.config-table { width: 100%; border-collapse: collapse; }
.config-table th, .config-table td { border: 1px solid #dee2e6; padding: 8px; }
.config-table th { background-color: #f8f9fa; text-align: left; }

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background-color: #f8f9fa;
}

.action-btn { padding: 6px 12px; border: 1px solid transparent; border-radius: 4px; cursor: pointer; font-size: 0.9em; margin-left: 8px; }
.add-btn { background-color: #007bff; color: white; &:hover { background-color: #0069d9; } }
.delete-all-btn { background-color: #dc3545; color: white; border-color: #dc3545; &:hover { background-color: #c82333; } }
</style>
