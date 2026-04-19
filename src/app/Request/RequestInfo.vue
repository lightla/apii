<script setup lang="ts">
import { ref, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestTagManager from "@/app/Generals/TagManager/RequestTagManager.vue";
import QuillEditor from "@/app/TextEditor/Quill/QuillEditor2.vue";
import RequestBrowserTabManager2 from "./RequestBrowserTabManager2.vue";

const props = defineProps<{ route: RouteInfo | null }>()
const emit = defineEmits(['route-tags-updated'])

const editorStorageKey = ref<string | null>(null)

function generateEditorStorageKey(route: RouteInfo): string {
  const safeRoute = route.route.replace(/[^a-zA-Z0-9]/g, '_')
  return `request_info_note_quill_${route.method}_${safeRoute}`
}

watch(() => props.route, (newRoute) => {
  if (newRoute && newRoute.route) {
    editorStorageKey.value = generateEditorStorageKey(newRoute)
  } else {
    editorStorageKey.value = null
  }
}, { immediate: true })

const handleTagsOutsideClick = (event: MouseEvent, selectedTags: any[]) => {
  if (props.route) {
    emit('route-tags-updated', { routeId: props.route.id, tags: selectedTags });
  }
};
</script>

<template>
  <div class="info-panel">
    <template v-if="props.route">
      <RequestTagManager
          :route="props.route"
          @click:outside="handleTagsOutsideClick"
      />

      <div class="info-content">
        <!-- NOTE SECTION - ĐÃ PHÁ BẪY CHUỘT -->
        <div class="note-container">
          <div class="note-toolbar">
            <!-- Sử dụng tabindex để nhãn có thể nhận focus và cướp quyền từ Editor -->
            <div class="note-toolbar-title" tabindex="0">
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

        <div class="requests-section">
          <div class="requests-toolbar">
            <span class="requests-toolbar-title">Requests</span>
          </div>
          <div class="requests-body">
            <RequestBrowserTabManager2 :route="props.route"></RequestBrowserTabManager2>
          </div>
        </div>
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
  min-height: 0;
}

.info-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
}

.note-container {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  width: 100%;
}

.note-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.note-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
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
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 1px solid #aaaa;
  box-sizing: border-box;
  overflow: hidden;
}

.note-body :deep(.note-quill-final-wrapper) {
  height: 100%;
  min-height: 100%;
  border: none;
  box-sizing: border-box;
}

.note-body :deep(.ql-container.ql-snow) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.note-body :deep(.ql-editor) {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.requests-section {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  width: 100%;
}

.requests-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.requests-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
}

.requests-body {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 1px solid #aaaa;
  box-sizing: border-box;
  overflow: hidden;
}

.requests-body :deep(#app-container) {
  width: 100%;
  height: 100%;
  min-height: 0;
  border: none;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background-color: #f8f9fa;
}
</style>
