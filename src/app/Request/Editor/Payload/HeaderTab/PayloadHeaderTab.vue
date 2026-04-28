<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from '@/app/Generals/TrackedVariableInput.vue'
import { 
  SquareCheck, 
  Square, 
  SquareX, 
  ShieldAlert, 
  Eraser, 
  Lock,
  Plus,
  ChevronDown 
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { usePresetStorage } from '@/storages/presets.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()
const presetStore = usePresetStorage()

const showPresetDropdown = ref(false)

const activePresets = computed(() => {
  return presetStore.headerPresets.filter(p => store.selectedHeaderPresetIds.includes(p.id))
})

const togglePreset = (id: string) => {
  const current = [...store.selectedHeaderPresetIds]
  const idx = current.indexOf(id)
  if (idx === -1) current.push(id)
  else current.splice(idx, 1)
  
  store.selectedHeaderPresetIds = current
  store.syncManagedHeaders()
  store.saveToStorage(props.route.id || props.route.route)
}

// Logic cho Master Toggle ở Header
const isAnyHeaderEnabled = computed(() => {
  return store.headers.length > 0 && store.headers.some(h => h.enabled)
})

// Logic cho Delete All (X)
const isConfirmingDeleteAll = ref(false)
let confirmAllTimer: ReturnType<typeof setTimeout> | undefined

function onTrashClick() {
  if (isConfirmingDeleteAll.value) {
    store.removeAllHeaders()
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
  store.headers = store.headers.filter(h => h.isManaged || h.key.trim() !== '' || h.value.trim() !== '')
}

// Per-row delete confirm state
const confirmDeleteIndex = ref<number | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(index: number) {
  const header = store.headers[index];
  if (header?.isManaged) return; 

  if (confirmDeleteIndex.value === index) {
    store.removeHeader(index)
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
  <div class="header-tab">
    <div class="header-toolbar">
      <div class="d-flex align-items-center w-100">
        <span class="header-toolbar-title">Headers</span>
        <IconSquareRoundedPlus @click="store.addHeader()" :stroke-width="1" class="icon-button-add-row ms-2" title="Add header"/>
        
        <!-- Icon X (Delete All) nằm sát nút + -->
        <div @click="onTrashClick" title="Delete all headers" class="d-flex align-items-center cursor-pointer ms-1">
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
            
            <div v-if="showPresetDropdown" class="preset-dropdown-menu" v-click-outside="() => showPresetDropdown = false">
              <div class="dropdown-header">Select Presets</div>
              <div class="dropdown-list">
                <div 
                  v-for="p in presetStore.headerPresets" 
                  :key="p.id" 
                  class="dropdown-item" 
                  @click="togglePreset(p.id)"
                >
                  <SquareCheck v-if="store.selectedHeaderPresetIds.includes(p.id)" :size="16" class="text-primary me-2" />
                  <Square v-else :size="16" class="text-muted me-2" />
                  <span class="item-name">{{ p.name }}</span>
                </div>
                <div v-if="!presetStore.headerPresets.length" class="dropdown-empty">No presets found</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="header-table-scroll-wrapper">
      <table class="header-param-table">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 25%;">
          <col style="width: 25%;">
          <col style="width: auto;">
          <col style="width: 40px;">
        </colgroup>
        <thead>
          <tr>
            <th>
              <div class="cell-icon-action" @click="store.toggleAllHeaders()">
                <SquareCheck v-if="isAnyHeaderEnabled" stroke-width="1" class="icon-button-checkbox"/>
                <Square v-else stroke-width="1" class="icon-button-checkbox"/>
              </div>
            </th>
            <th class="text-center">Key</th>
            <th class="text-center">Value</th>
            <th class="text-center">Description</th>
            <th>
              <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                <Eraser stroke-width="1" class="icon-button-eraser" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(header, index) in store.headers" :key="header.id" :class="{ 'is-preset': header.isPreset }">
            <td>
              <div class="cell-icon-action" @click="!header.isManaged && store.toggleHeader(index)">
                <template v-if="header.isManaged">
                  <SquareCheck stroke-width="1" class="icon-button-checkbox is-disabled"/>
                </template>
                <template v-else>
                  <SquareCheck v-if="header.enabled" stroke-width="1" class="icon-button-checkbox"/>
                  <Square v-else stroke-width="1" class="icon-button-checkbox"/>
                </template>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="header.key"
                  :enabled-env-variable="true"
                  :readonly="header.isManaged"
                  @text-change="val => header.key = val"
                />
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="header.value"
                  :enabled-env-variable="true"
                  :readonly="header.isManaged"
                  @text-change="val => header.value = val"
                />
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <TrackedVariableInput
                  :route="props.route"
                  :value="header.description"
                  :enabled-env-variable="false"
                  :readonly="header.isManaged"
                  :class="{ 'managed-desc': header.isPreset || header.isManaged }"
                  @text-change="val => header.description = val"
                />
              </div>
            </td>
            <td>
              <div class="cell-icon-action">
                <template v-if="header.isManaged">
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

          <tr v-if="store.headers.length === 0">
            <td colspan="5" class="empty-row">No headers</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.header-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: auto;
}

.header-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
  height: 32px; /* Cố định chiều cao toolbar */
}

.header-toolbar-title {
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

.header-table-scroll-wrapper {
  min-height: 0;
  height: fit-content;
  max-height: 436px; 
  overflow-y: auto;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);
}

.header-param-table {
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
    text-align: center !important;
    vertical-align: middle !important;
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
    background-color: #f0f7ff; // Soft blue for preset/managed rows
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

.managed-desc :deep(.var-input-content) {
  font-style: italic;
  font-size: 12px;
  color: #777;
}

.readonly-input {
  font-size: 13px;
  color: #555;
  padding: 4px 0;
  font-family: monospace;
  &.managed-desc {
    font-family: sans-serif;
    font-style: italic;
    font-size: 12px;
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

  &:hover {
    fill: var(--icon-bg-color-active);
  }
  
  &.is-disabled {
    cursor: not-allowed;
    stroke: #aaa;
  }
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
  background: #f3f6fb;
  border: 1px solid #9aa7b8;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 6px 10px;
  background: #e7eef8;
  border-bottom: 1px solid #cfd9e6;
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
  &:hover { background: #dfeaf7; }
  
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

.btn-preset-settings {
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  width: 26px;
  color: #333;
  
  &:hover {
    color: #000;
    opacity: 0.7;
  }
}

.header-presets-config {
  border-top: 1px solid #ccc;
  padding-top: 8px;
}

.config-toggle {
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  text-transform: uppercase;
  color: #666;
  font-weight: 700;
  padding: 4px 8px;
  background: #eee;
  width: fit-content;
  border: 1px solid #ccc;
  
  &:hover {
    background: #e5e5e5;
  }
}

.config-content {
  background: #e8e8e8; /* Giảm nhẹ từ #eee */
  border: 1px solid #ccc;
}

.config-label {
  font-size: 12px;
  font-weight: 600;
  color: #444;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.preset-config-card {
  background: #f0f0f0; /* Giảm nhẹ từ #f7f7f7 */
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 2px;
  
  .p-name { font-weight: 600; font-size: 13px; color: #333; }
  .p-count { font-size: 11px; color: #777; }
}

.label-sm {
  font-size: 11px;
  text-transform: uppercase;
  color: #666;
  font-weight: 600;
  display: block;
}

.config-input {
  width: 100%;
  background: #f8f8f8;
  border: 1px solid #ccc;
  padding: 4px 8px;
  font-size: 13px;
  outline: none;
  height: 28px;
  color: #333;
  &:focus { background: #fff; border-color: #007bff; }
}

.config-cell-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 13px;
  font-family: inherit;
  padding: 4px 0;
  &:focus { background: rgba(0,0,0,0.02); }
}

.config-table {
  background: #f0f0f0;
  th { font-size: 12px !important; height: 30px !important; background-color: #dfdfdf !important; }
  td { height: 32px !important; border-bottom: 1px solid #ddd; }
}

.btn-app-sm {
  background: #e8e8e8;
  border: 1px solid #ccc;
  font-size: 11px;
  padding: 3px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover { background: #f0f0f0; }
}

.btn-app-primary {
  background: #007bff;
  color: white;
  border: 1px solid #0056b3;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #0069d9; }
}

.btn-app-secondary {
  background: #e8e8e8;
  border: 1px solid #ccc;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  color: #333;
  &:hover { background: #dfdfdf; }
}

.btn-icon-text {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 11px;
  padding: 0;
  text-decoration: underline;
  color: #007bff;
  &.text-danger { color: #dc3545; }
  &:hover { opacity: 0.8; }
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

.flex-1 { flex: 1; }
</style>
