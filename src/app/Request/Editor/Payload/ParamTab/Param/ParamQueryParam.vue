<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RouteInfo } from "@/types";
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {
  SquareCheck,
  Square,
  SquareX,
  ShieldAlert,
  Eraser,
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{
  route: RouteInfo
}>()

const store = useRequestParamsStorage()

// Logic cho Master Toggle ở Header
const isAnyParamEnabled = computed(() => {
  return store.queryParams.length > 0 && store.queryParams.some(p => p.enabled)
})

// Logic cho Master Delete ở Header (Eraser) - CHỈ XÓA CÁC DÒNG RỖNG
function onMasterDeleteClick() {
  // Chỉ lọc giữ lại những dòng có key hoặc value rỗng
  store.queryParams = store.queryParams.filter(p => p.key.trim() !== '' || p.value.trim() !== '')
}

// Per-row delete confirm state
const confirmDeleteIndex = ref<number | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(index: number) {
  if (confirmDeleteIndex.value === index) {
    store.removeQueryParam(index)
    confirmDeleteIndex.value = null
    clearTimeout(confirmTimer)
  } else {
    confirmDeleteIndex.value = index
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirmDeleteIndex.value = null
    }, 3000)
  }
}
</script>

<template>
  <div class="query-param">
    <div class="query-param-toolbar">
      <span class="query-param-toolbar-title">Query Parameters</span>
      <IconSquareRoundedPlus @click="store.addQueryParam()" stroke-width="1" class="icon-button-add-row"/>
    </div>
    
    <div class="query-table-scroll-wrapper">
      <table class="query-param-table">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 30%;">
          <col style="width: auto;">
          <col style="width: 40px;">
        </colgroup>
        <thead>
          <tr>
            <th>
              <div class="cell-icon-action" @click="store.toggleAllQueryParams()">
                <SquareCheck v-if="isAnyParamEnabled" stroke-width="1" class="icon-button-checkbox"/>
                <Square v-else stroke-width="1" class="icon-button-checkbox"/>
              </div>
            </th>
            <th>Variable</th>
            <th>Value</th>
            <th>
              <div class="cell-icon-action" @click="onMasterDeleteClick">
                <Eraser stroke-width="1" class="icon-button icon-button-eraser" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(param, index) in store.queryParams" :key="param.id">
            <td>
              <div class="cell-icon-action" @click="store.toggleQueryParam(index)">
                <SquareCheck v-if="param.enabled" stroke-width="1" class="icon-button-checkbox"/>
                <Square v-else stroke-width="1" class="icon-button-checkbox"/>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="param.key"
                  :enabled-env-variable="true"
                  @text-change="val => param.key = val"
                />
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="param.value"
                  :enabled-env-variable="true"
                  @text-change="val => param.value = val"
                />
              </div>
            </td>
            <td>
              <div class="cell-icon-action" @click="onDeleteClick(index)">
                <ShieldAlert v-if="confirmDeleteIndex === index"
                             stroke-width="1" class="icon-button icon-button-row-action confirming" />
                <SquareX v-else stroke-width="1" class="icon-button icon-button-row-action" />
              </div>
            </td>
          </tr>

          <tr v-if="store.queryParams.length === 0">
            <td colspan="4" class="empty-row">No query parameters</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.query-param {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: auto;
}

.query-param-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.query-param-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
}

.query-table-scroll-wrapper {
  min-height: 0;
  height: fit-content; /* Co lại sát bảng khi ít hàng */
  max-height: 156px; 
  overflow-y: auto;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border); /* Viền dưới duy nhất nằm ở wrapper */
}

.query-param-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-right: var(--table-border);

  th {
    height: 36px;
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    font-size: 15px;
    font-weight: 500;
    text-align: center;
    vertical-align: middle; /* Căn giữa chiều dọc */
    padding: 0;
  }

  td {
    height: 40px; /* Chiều cao row cố định để calc() chính xác */
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 0 8px; /* Giảm padding dọc để khớp 40px */
    vertical-align: middle;
  }

  th:first-child, td:first-child,
  th:last-child, td:last-child {
    width: 40px;
    padding: 4px;
    text-align: center;
  }

  /* Khử border-bottom hàng cuối để không bị double với border-bottom của wrapper */
  tr:last-child td {
    border-bottom: none !important;
  }
}

.cell-icon-action {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.icon-button-add-row {
  width: 30px !important;
  height: 30px;
  cursor: pointer;
  &:hover { fill: #cccccc; }
}

.icon-button {
  cursor: pointer;
  fill: var(--icon-bg-color);
  &:hover { fill: var(--icon-bg-color-active); }
  
  &.confirming {
    /* Không đổi màu, không animation - giống ENV Variable */
  }
}

.icon-button-checkbox, .icon-button-eraser, .icon-button-row-action {
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

/* Xóa keyframes không dùng nữa */

.param-input-wrap {
  padding: 2px 0;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 15px;
  height: 40px; /* Chiều cao bằng hàng dữ liệu chuẩn */
  padding: 0 !important;
  vertical-align: middle;
}
</style>
