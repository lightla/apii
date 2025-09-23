<!-- File: src\app\Request\RequestInfo.vue -->
<script setup lang="ts">
import {ref, watch} from 'vue'
import type {RouteInfo} from '@/types'
import MilkdownEditor from "@/app/TextEditor/Milkdown/MilkdownEditor.vue";
import TiptapEditor from "@/app/TextEditor/Tiptap/TiptapEditor.vue";
import NovelEditor from "@/app/TextEditor/Novel/NovelEditor.vue";
import EditorJs from "@/app/TextEditor/EditorJS/EditorJs.vue";
import CrepeEditor from "@/app/TextEditor/Milkdown/CrepeEditor.vue";
import TinymceEditor from "@/app/TextEditor/Tinymce/TinymceEditor.vue";
import QuillEditor from "@/app/TextEditor/Quill/QuillEditor.vue";
import RequestTagManager from "@/app/Generals/TagManager/RequestTagManager.vue";

interface SearchField { id: number; key: string; value: string; searchable: boolean; }
const props = defineProps<{ route: RouteInfo | null }>()
const emit = defineEmits(['update:searchableFields'])

const searchFields = ref<SearchField[]>([])
const currentStorageKey = ref<string | null>(null)

function generateStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_${route.method}_${safeRoute}`
}

// Hàm emit các trường searchable
function emitSearchableKeys() {
  const searchableKeys = searchFields.value
      .filter(field => field.searchable && field.key)
      .map(field => field.key)
  emit('update:searchableFields', searchableKeys)
}

function loadDataFromStorage(key: string) {
  const savedData = localStorage.getItem(key)
  searchFields.value = savedData ? JSON.parse(savedData) : []
  // QUAN TRỌNG: Emit ngay sau khi tải dữ liệu để đồng bộ hóa trạng thái ban đầu
  emitSearchableKeys()
}

function saveDataToStorage() {
  if (currentStorageKey.value) {
    localStorage.setItem(currentStorageKey.value, JSON.stringify(searchFields.value))
  }
}

watch(() => props.route, (newRoute) => {
  if (newRoute && newRoute.route) {
    const newKey = generateStorageKey(newRoute)
    currentStorageKey.value = newKey
    loadDataFromStorage(newKey)
  } else {
    searchFields.value = []
    currentStorageKey.value = null
    emitSearchableKeys() // Emit mảng rỗng khi không có route nào được chọn
  }
}, { immediate: true })

watch(searchFields, () => {
  saveDataToStorage()
  emitSearchableKeys() // Emit mỗi khi bảng thay đổi (thêm, xóa, sửa, tích checkbox)
}, { deep: true })

function addField() { searchFields.value.push({ id: Date.now(), key: '', value: '', searchable: false }) }
function deleteField(id: number) { searchFields.value = searchFields.value.filter(field => field.id !== id) }
function deleteAllFields() { if (confirm('Bạn có chắc muốn xóa tất cả các trường cho request này?')) { searchFields.value = [] } }


const handleTagsUpdate = (updatedTags: any) => {
  console.log('Danh sách tag đã được cập nhật:', updatedTags);
  // Bạn có thể làm gì đó với danh sách tag mới ở đây
};
</script>

<template>
  <div class="info-panel">
    <RequestTagManager v-if="props.route" :route="props.route" @tags-updated="handleTagsUpdate" />
    <div class="info-section">
      <h2>Thông tin Route</h2>
      <div v-if="props.route" class="info-details">
        <div><strong>Method:</strong> <span>{{ props.route.method }}</span></div>
        <div><strong>Route:</strong> <span>{{ props.route.route }}</span></div>
        <div><strong>Group:</strong> <span>{{ props.route.group }}</span></div>
      </div>
      <p v-else>Chưa chọn route nào.</p>
    </div>
    <hr class="separator">
    <div>
      <h1>Ghi chú</h1>
      <div class="milkdown-editor-container">
        <EditorJs />
      </div>
    </div>
    <hr class="separator">
    <div class="search-config-section" v-if="props.route">
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
    <div v-else><p>Hãy chọn một request để xem và cấu hình.</p></div>
  </div>
</template>

<style scoped lang="scss">
.info-panel { padding: 15px; display: flex; flex-direction: column; gap: 20px; }
.info-section h2, .search-config-section h2 { margin-top: 0; margin-bottom: 15px; font-size: 1.2em; }
.info-details { display: flex; flex-direction: column; gap: 8px; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 0.95em; }
.info-details strong { display: inline-block; width: 80px; color: #495057; }
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


.milkdown-editor-container {
    min-height: 0;
    height: 500px;
    overflow-y: auto;
}
</style>
