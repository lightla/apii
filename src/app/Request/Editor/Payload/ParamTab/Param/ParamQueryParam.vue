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
  Plus,
  ChevronDown
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { usePresetStorage } from '@/storages/presets.ts'

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()
const store = useRequestParamsStorage()
const presetStore = usePresetStorage()

const showPresetDropdown = ref(false)

const activePresets = computed(() => {
  return presetStore.queryPresets.filter(p => store.selectedQueryPresetIds.includes(p.id))
})

const togglePreset = (id: string) => {
  const current = [...store.selectedQueryPresetIds]
  const idx = current.indexOf(id)
  if (idx === -1) current.push(id)
  else current.splice(idx, 1)
  
  store.selectedQueryPresetIds = current
  store.syncManagedQueryParams()
  store.saveToStorage(props.storageKey ?? props.route.id)
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
        <IconSquareRoundedPlus @click="store.addQueryParam()" :stroke-width="1" class="icon-button-add-row ms-2" title="Add query parameter"/>
        
        <!-- Icon X nằm sát nút dấu + -->
        <div @click="onTrashClick" title="Delete all query parameters" class="d-flex align-items-center cursor-pointer ms-1">
          <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-trash-x" />
          <SquareX v-else stroke-width="1" class="icon-button icon-button-trash-x" />
        </div>

        <!-- Active Presets with Inline Selector -->
        <div class="ms-auto d-flex align-items-center flex-shrink-0 gap-1 overflow-visible position-relative" style="max-width: 400px;">
          <span v-if="activePresets.length" class="preset-label">ACTIVE:</span>
          <div v-for="p in activePresets" :key="p.id" class="active-preset-tag" :title="p.name">
            {{ p.name }}
          </div>
          
          <div class="preset-selector-wrap ms-1" v-click-outside="() => showPresetDropdown = false">
            <button class="btn-add-preset" @click.stop="showPresetDropdown = !showPresetDropdown" title="Toggle Presets">
              <Plus :size="14" stroke-width="3" />
              <ChevronDown :size="10" stroke-width="2" class="ms-1" />
            </button>
            
            <div v-if="showPresetDropdown" class="preset-dropdown-menu">
              <div class="dropdown-header">Select Presets</div>
              <div class="dropdown-list">
                <div 
                  v-for="p in presetStore.queryPresets" 
                  :key="p.id" 
                  class="dropdown-item" 
                  @click="togglePreset(p.id)"
                >
                  <SquareCheck v-if="store.selectedQueryPresetIds.includes(p.id)" :size="16" class="text-primary me-2" />
                  <Square v-else :size="16" class="text-muted me-2" />
                  <span class="item-name">{{ p.name }}</span>
                </div>
                <div v-if="!presetStore.queryPresets.length" class="dropdown-empty">No presets found</div>
              </div>
            </div>
          </div>
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
          <tr v-for="(param, index) in store.queryParams" :key="param.id" :class="{ 'is-preset': param.isPreset }">
            <td>
              <div class="cell-icon-action" @click="store.toggleQueryParam(index)">
                <template v-if="false">
                   <!-- Removed special disabled state -->
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
                             stroke-width="1" class="icon-button icon-button-row-action" />
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

.active-preset-tag {
  background-color: #f0f7ff;
  border: 1px solid #007bff;
  color: #007bff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.preset-label-none {
  font-size: 11px;
  color: #aaa;
  font-weight: 500;
}

.preset-selector-wrap {
  position: relative;
}

.btn-add-preset {
  background: #eee;
  border: 1px solid #888;
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  border-radius: 2px;
  color: #333;
  &:hover { background: #ddd; }
}

.preset-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background: white;
  border: 1px solid #888;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 6px 10px;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
}

.dropdown-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  &:hover { background: #f0f7ff; }
  
  .item-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.dropdown-empty {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.text-primary { color: #007bff; }

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

  tr.is-preset, tr.is-managed {
    background-color: #f0f7ff;
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
