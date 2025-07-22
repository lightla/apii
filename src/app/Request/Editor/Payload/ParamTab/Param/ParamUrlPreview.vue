<script setup lang="ts">
import type {RouteInfo} from '@/types'
import {ClipboardDocumentIcon} from '@heroicons/vue/24/solid'
import FileCopy from '@/assets/svg/svgrepo/file-copy.svg'
const props = defineProps<{
  route: RouteInfo
}>()
</script>

<template>
  <div class="url-preview">
    <h4>URL Preview</h4>
    <div class="url-preview-detail">
<!--      <textarea class="url-preview-input" readonly>http://fffasdfas/fffdfadffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadfffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffff/ffffffffffdfadfffffffffffffffffffffffffffffff/fffffffdfadfffffffffffffffffffffffffffffffff/ffff/fffffffffffffffffffffffffffdfadffffffffffffffffffffffffffffffffffdfadfffffffffffffffffffffffffffffffdfasdfa/fffdfadffffffffffffffffffffffffffffffffffdfadfffffffffffffffffffffffffffffff/sdfafffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff?</textarea>-->

      <div class="url-preview-input-wrap">
        <div class="url-preview-input-content">
          http://fffasdfas/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff http://fffasdfas/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff
        </div>
      </div>

<!--      <textarea class="url-preview-input" readonly>http://fffasdfas/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff/fffdfadffffffffdfadffffffffffffffffffffffffffffff</textarea>-->
      <FileCopy stroke-width="1" class="icon-button-copy" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.url-preview {
  //border-bottom: 1px solid #aaaaaa;
  //padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
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
}

.url-preview-input-content {
  max-height: 2em;
  overflow: auto;
  @include elements.scrollbar-hidden;
  word-break: break-all;
  font-size: 0.9em;
}

.icon-copy-cover {
  display: flex;
  align-items: center;
}

.icon-button-copy {
  width: 32px !important;
  height: 28px;
  cursor: pointer;

  fill: transparent;
  stroke: #333333;
  stroke-width: 1px;

  &:hover {
    fill: var(--icon-bg-color-active);
  }
}
</style>
