<template>
  <div class="url-preview no-more-loading">
    <div class="url-preview-detail">
      <div class="url-preview-input-wrap">
        <input 
          readonly 
          class="url-preview-input-content" 
          :class="{ 'placeholder': isPlaceholder }"
          :value="displayUrl"
        />
      </div>
      <button 
        class="icon-button-copy" 
        :disabled="isPlaceholder"
        @click="copyUrl"
      >
        <FileCopy class="copy-icon-svg" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'
import FileCopy from '@/assets/svg/svgrepo/file-copy.svg'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()

const displayUrl = computed(() => {
  return (store.urlPreview || '').trim() || 'No URL to preview'
})

const isPlaceholder = computed(() => {
  return !(store.urlPreview || '').trim()
})

function copyUrl() {
  if (!isPlaceholder.value) {
    navigator.clipboard.writeText(store.urlPreview)
  }
}
</script>

<style scoped lang="scss">
/* TIÊU DIỆT TOÀN BỘ CÁC THỂ LOẠI XOAY */
.no-more-loading * {
  animation: none !important;
  transition: none !important;
  cursor: default !important; /* Mặc định là default */
}

.url-preview {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 5px;
}

.url-preview-detail {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.url-preview-input-wrap {
  flex: 1;
  background-color: #f5f5f5;
  border: 1px solid #888888;
  height: 32px;
  display: flex;
  align-items: center;
}

.url-preview-input-content {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 10px;
  background: transparent;
  font-size: 13px;
  font-weight: 400; /* Đưa về bình thường, không đậm */
  color: #333 !important; /* Màu xám đậm dễ nhìn, không quá gắt như đen tuyệt đối */
  opacity: 1 !important;
  cursor: text !important;

  &.placeholder {
    color: #999 !important; /* Placeholder màu nhạt hơn chút nhưng vẫn rõ */
    font-weight: 400;
    font-style: normal; /* Bỏ chữ nghiêng */
  }

  /* Chống bôi đen (selection) nếu người dùng không muốn cảm giác bị chọn */
  &::selection {
    background: rgba(0, 0, 0, 0.1);
    color: inherit;
  }
}

.icon-button-copy {
  width: 32px;
  height: 32px;
  cursor: pointer !important; /* Ép chết cursor pointer, cấm wait */
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #888888;
  background-color: #f5f5f5;
  flex-shrink: 0;
  padding: 0;

  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
  }
}

.copy-icon-svg {
  width: 20px;
  height: 20px;
  fill: transparent;
  stroke: #333333;
  stroke-width: 1px;
  animation: none !important;
}
</style>
