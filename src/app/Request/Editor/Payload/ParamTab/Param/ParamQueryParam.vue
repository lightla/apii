<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { RouteInfo } from "@/types";
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {
  SquareCheck,
  Square,
  SquareX,
  ShieldAlert,
  Eraser,
  Trash2,
  Lock,
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { usePresetStorage } from '@/storages/presets.ts'

const props = defineProps<{
  route: RouteInfo
}>()

const store = useRequestParamsStorage()
const presetStore = usePresetStorage()

const onPresetChange = (e: Event) => {
  const target = e.target as HTMLSelectElement;
  store.selectedQueryPresetId = target.value === 'preset-none' ? null : target.value;
  store.syncManagedQueryParams();
}

// Logic cho Master Toggle ở Header
const isAnyParamEnabled = computed(() => {
  return store.queryParams.length > 0 && store.queryParams.some(p => p.enabled)
})

// Logic cho Delete All (Dùng icon X)
const isConfirmingDeleteAll = ref(false)
let confirmAllTimer: ReturnType<typeof setTimeout> | undefined

function onTrashClick() {
  if (isConfirmingDeleteAll.value) {
    store.queryParams = []
    isConfirmingDeleteAll.value = false
    clearTimeout(confirmAllTimer)
  } else {
    isConfirmingDeleteAll.value = true
    clearTimeout(confirmAllTimer)
    confirmAllTimer = setTimeout(() => {
      isConfirmingDeleteAll.value = false
    }, 3000)
  }
}

// Logic cho Master Delete ở Header (Eraser) - CHỈ XÓA CÁC DÒNG RỖNG
function onMasterDeleteClick() {
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
      <div class="d-flex align-items-center w-100">
        <span class="query-param-toolbar-title">Query Parameters</span>
        <IconSquareRoundedPlus @click="store.addQueryParam()" stroke-width="1" class="icon-button-add-row ms-2"/>
        
        <!-- Icon X nằm sát nút dấu + -->
        <div @click="onTrashClick" title="Delete all query parameters" class="d-flex align-items-center cursor-pointer ms-1">
          <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-trash-x" />
          <SquareX v-else stroke-width="1" class="icon-button icon-button-trash-x" />
        </div>

        <!-- Query Preset Selection -->
        <div class="ms-auto d-flex align-items-center flex-shrink-0">
          <span class="preset-label me-2">PRESETS:</span>
          <select 
            class="preset-select" 
            :value="store.selectedQueryPresetId || 'preset-none'"
            @change="onPresetChange"
            :title="presetStore.queryPresets.find(p => p.id === store.selectedQueryPresetId)?.name || 'None'"
          >
            <option value="preset-none">-- No Preset --</option>
            <option v-for="p in presetStore.queryPresets" :key="p.id" :value="p.id">
              {{ p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name }}
            </option>
          </select>
        </div>
      </div>
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
            <th class="text-center">Variable</th>
            <th class="text-center">Value</th>
            <th>
              <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                <Eraser stroke-width="1" class="icon-button icon-button-eraser" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(param, index) in store.queryParams" :key="param.id" :class="{ 'is-managed': param.isManaged }">
            <td>
              <div class="cell-icon-action" @click="!param.isManaged && store.toggleQueryParam(index)">
                <template v-if="param.isManaged">
                   <SquareCheck stroke-width="1" class="icon-button-checkbox is-disabled"/>
                </template>
                <template v-else>
                   <SquareCheck v-if="param.enabled" stroke-width="1" class="icon-button-checkbox"/>
                   <Square v-else stroke-width="1" class="icon-button-checkbox"/>
                </template>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="param.key"
                  :enabled-env-variable="true"
                  :readonly="!!param.isManaged"
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
                  :readonly="!!param.isManaged"
                  @text-change="val => param.value = val"
                />
              </div>
            </td>
            <td>
              <div class="cell-icon-action">
                <template v-if="param.isManaged">
                   <Lock size="16" stroke-width="1.5" class="text-muted" />
                </template>
                <template v-else>
                  <div class="w-100 h-100 d-flex align-items-center justify-content-center" @click="onDeleteClick(index)">
                    <ShieldAlert v-if="confirmDeleteIndex === index"
                                 stroke-width="1" class="icon-button icon-button-row-action" />
                    <SquareX v-else stroke-width="1" class="icon-button icon-button-row-action" />
                  </div>
                </template>
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
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
  height: 32px;
}

.query-param-toolbar-title {
  padding: 0 8px;
  height: 28px;
  display: flex;
  align-items: center;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.preset-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #555;
  font-weight: 600;
}

.preset-select {
  background-color: #dddddd;
  border: 1px solid #888888;
  font-size: 12px;
  font-family: inherit;
  padding: 2px 4px;
  outline: none;
  cursor: pointer;
  height: 26px;
  color: #333;
  width: 160px;
  text-align: center;
  text-align-last: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  
  &:hover {
    background-color: #cccccc;
  }
}

.query-table-scroll-wrapper {
  min-height: 0;
  height: fit-content;
  max-height: 250px; 
  overflow-y: auto;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);
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
    padding: 0;
    text-align: center !important; /* Căn giữa ngang cho TẤT CẢ các cột */
    vertical-align: middle !important; /* Căn giữa dọc */
  }

  td {
    height: 40px;
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 0 8px;
    vertical-align: middle;
  }

  tr:hover td {
    background-color: rgba(0, 0, 0, 0.02);
  }

  tr.is-managed {
    background-color: rgba(0, 0, 0, 0.02);
  }

  th:first-child, td:first-child,
  th:last-child, td:last-child {
    width: 40px;
    padding: 4px;
    text-align: center;
  }

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
  transition: fill 0.2s ease;
  &:hover { fill: var(--icon-bg-color-active); }
}

.icon-button-trash-x {
  width: 30px;
  height: 30px;
}

.icon-button-checkbox, .icon-button-eraser, .icon-button-row-action {
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  fill: var(--icon-bg-color);
  transition: fill 0.2s ease;
  &:hover { fill: var(--icon-bg-color-active); }
}

.param-input-wrap {
  padding: 2px 0;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 15px;
  height: 40px;
  padding: 0 !important;
  vertical-align: middle;
}
</style>
