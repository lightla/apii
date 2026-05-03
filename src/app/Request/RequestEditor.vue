<script setup lang="ts">
import {ref, watch, onMounted} from 'vue'
import type {RouteInfo} from '@/types'
import EditorUrlBar from "@/app/Request/Editor/EditorUrlBar.vue";
import ToggleMenuItem from "@/app/Generals/ToggleMenu/ToggleMenuItem.vue";
import EditorPayload from "@/app/Request/Editor/EditorPayload.vue";
import EditorResponse from "@/app/Request/Editor/EditorResponse.vue";
import ToggleMenu from "@/app/Generals/ToggleMenu/ToggleMenu.vue";
import {useEnvStorage, useHistoryStorage} from "@/storages"
import {useRequestParamsStorage} from "@/storages/payload.ts"

const props = defineProps<{
  route: RouteInfo
  storageKey?: string
}>()

const envStorage = useEnvStorage();
const payloadStore = useRequestParamsStorage();
const historyStore = useHistoryStorage();

onMounted(() => {
  historyStore.load();
});

const editorRef = ref<HTMLDivElement | null>(null);

// Nạp dữ liệu khi component được mount hoặc request storage key thay đổi
watch(() => [props.route?.id, props.storageKey] as const, ([newId, newStorageKey], oldValues) => {
  const [oldId, oldStorageKey] = oldValues || [undefined, undefined]
  const oldKey = oldStorageKey || oldId
  if (oldKey) {
    // Lưu lại trạng thái của request cũ trước khi chuyển
    payloadStore.saveToStorage(oldKey)
  }
  
  const currentKey = newStorageKey || newId
  if (currentKey) {
    // 1. Nạp trạng thái từ localStorage (bao gồm params, headers, body...)
    payloadStore.loadFromStorage(currentKey)

    // 2. Kiểm tra nếu đây là Request gốc (không phải từ Collection)
    const isCanonicalRequest = !props.storageKey || props.storageKey === newId

    if (isCanonicalRequest) {
      // 3. ÉP BUỘC: Lấy Method và Route từ định nghĩa Laravel, tuyệt đối không cho phép storage ghi đè
      payloadStore.baseUrl = props.route.route
      if (props.route.method) {
        payloadStore.method = props.route.method.toUpperCase()
      }
    } else {
      // Với Collection/Isolated mode: Chỉ khởi tạo nếu storage đang trống
      if (!payloadStore.baseUrl) payloadStore.baseUrl = props.route.route
      if (props.route.method && (!payloadStore.method || payloadStore.method === 'GET')) {
        payloadStore.method = props.route.method.toUpperCase()
      }
    }
  }
}, { immediate: true })

// Tự động lưu mỗi khi có bất kỳ thay đổi nào bên trong payloadStore
// (Debounce nhẹ để tránh ghi đĩa liên tục)
let saveTimeout: ReturnType<typeof setTimeout>
watch(() => payloadStore.$state, () => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    const storageKey = props.storageKey ?? props.route?.id
    if (storageKey) {
      payloadStore.saveToStorage(storageKey)
    }
  }, 500)
}, { deep: true })

</script>

<template>
  <div class="editor" ref="editorRef">
    
    <!-- Environment settings have been moved to its own Tab in RequestContainer.vue -->

    <div class="editor-request">
      <EditorUrlBar :route="props.route" :storage-key="props.storageKey ?? props.route.id"/>
      <ToggleMenu class="payload-response-container">
        <ToggleMenuItem>
          <EditorPayload :route="props.route" :storage-key="props.storageKey ?? props.route.id"/>
        </ToggleMenuItem>
        <ToggleMenuItem>
          <EditorResponse :route="props.route"/>
        </ToggleMenuItem>
      </ToggleMenu>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
}

.editor-request {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.payload-response-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  //height: 536px;
  height: 100%;
  overflow: hidden;
}
</style>
