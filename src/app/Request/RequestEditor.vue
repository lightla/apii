<script setup lang="ts">
import {ref, watch} from 'vue'
import type {RouteInfo} from '@/types'
import EditorUrlBar from "@/app/Request/Editor/EditorUrlBar.vue";
import EditorPopupMenu from "@/app/Request/Editor/EditorPopupMenu.vue";
import ToggleMenuItem from "@/app/Generals/ToggleMenu/ToggleMenuItem.vue";
import EditorPayload from "@/app/Request/Editor/EditorPayload.vue";
import EditorResponse from "@/app/Request/Editor/EditorResponse.vue";
import ToggleMenu from "@/app/Generals/ToggleMenu/ToggleMenu.vue";
import {useEnvStorage} from "@/storages"
import {useRequestParamsStorage} from "@/storages/payload.ts"

const props = defineProps<{
  route: RouteInfo
}>()

const envStorage = useEnvStorage();
const payloadStore = useRequestParamsStorage();

const editorRef = ref<HTMLDivElement | null>(null);

// Nạp dữ liệu khi component được mount hoặc route thay đổi
watch(() => props.route?.route, (newUrl, oldUrl) => {
  if (oldUrl) {
    // Lưu lại trạng thái của URL cũ trước khi chuyển
    payloadStore.saveToStorage(oldUrl)
  }
  if (newUrl) {
    // Nạp trạng thái của URL mới
    payloadStore.loadFromStorage(newUrl)
    // Đảm bảo baseUrl luôn khớp với route hiện tại nếu nó trống
    if (!payloadStore.baseUrl) {
      payloadStore.baseUrl = newUrl
    }
  }
}, { immediate: true })

// Tự động lưu mỗi khi có bất kỳ thay đổi nào bên trong payloadStore
// (Debounce nhẹ để tránh ghi đĩa liên tục)
let saveTimeout: ReturnType<typeof setTimeout>
watch(() => payloadStore.$state, () => {
  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    if (props.route?.route) {
      payloadStore.saveToStorage(props.route.route)
    }
  }, 500)
}, { deep: true })

</script>

<template>
  <div class="editor" ref="editorRef">
    <EditorPopupMenu :editor="editorRef"/>
    
    <!-- Environment settings have been moved to its own Tab in RequestContainer.vue -->

    <div class="editor-request">
      <EditorUrlBar :route="props.route"/>
      <ToggleMenu class="payload-response-container">
        <ToggleMenuItem>
          <EditorPayload :route="props.route"/>
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
