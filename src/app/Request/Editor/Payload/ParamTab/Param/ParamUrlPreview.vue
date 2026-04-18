<script setup lang="ts">
import type { RouteInfo } from '@/types'
import FileCopy from '@/assets/svg/svgrepo/file-copy.svg'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()

function copyUrl() {
  navigator.clipboard.writeText(store.urlPreview)
}
</script>

<template>
  <div class="url-preview">
    <h4>URL Preview</h4>
    <div class="url-preview-detail">
      <div class="url-preview-input-wrap">
        <div class="url-preview-input-content">{{ store.urlPreview }}</div>
      </div>
      <FileCopy stroke-width="1" class="icon-button-copy" @click="copyUrl" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.url-preview {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
  min-height: 0;
}

.url-preview-detail {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.url-preview-input-wrap {
  flex: 1;
  padding: 5px;
  background-color: #e6e6e6;
  border: 1px solid #888888;
  min-width: 0;
}

.url-preview-input-content {
  max-height: 2em;
  overflow: auto;
  @include elements.scrollbar-hidden;
  word-break: break-all;
  font-size: 0.9em;
}

.icon-button-copy {
  width: 32px !important;
  height: 28px;
  cursor: pointer;
  fill: transparent;
  stroke: #333333;
  stroke-width: 1px;
  flex-shrink: 0;

  &:hover {
    fill: var(--icon-bg-color-active);
  }
}
</style>
