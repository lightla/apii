<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from '@/app/Generals/TrackedVariableInput.vue'
import { SquareCheck, Square, SquareX, ShieldAlert, Eraser, Lock } from 'lucide-vue-next'
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()

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
  if (header?.isManaged) return; // Bảo vệ managed header

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
      <div class="d-flex align-items-center">
        <span class="header-toolbar-title">Headers</span>
        <IconSquareRoundedPlus @click="store.addHeader()" stroke-width="1" class="icon-button-add-row ms-2"/>
        
        <!-- Icon X (Delete All) nằm sát nút + -->
        <div @click="onTrashClick" title="Delete all headers" class="d-flex align-items-center cursor-pointer ms-1">
          <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-trash-x" />
          <SquareX v-else stroke-width="1" class="icon-button icon-button-trash-x" />
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
            <th>Key</th>
            <th>Value</th>
            <th>Description</th>
            <th>
              <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                <Eraser stroke-width="1" class="icon-button-eraser" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(header, index) in store.headers" :key="header.id" :class="{ 'is-managed': header.isManaged }">
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
                <template v-if="header.isManaged">
                  <div class="readonly-input">{{ header.key }}</div>
                </template>
                <template v-else>
                  <TrackedVariableInput
                    :route="props.route"
                    :value="header.key"
                    :enabled-env-variable="true"
                    @text-change="val => header.key = val"
                  />
                </template>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <template v-if="header.isManaged">
                  <div class="readonly-input">{{ header.value }}</div>
                </template>
                <template v-else>
                  <TrackedVariableInput
                    :route="props.route"
                    :value="header.value"
                    :enabled-env-variable="true"
                    @text-change="val => header.value = val"
                  />
                </template>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
                <template v-if="header.isManaged">
                  <div class="readonly-input managed-desc">{{ header.description }}</div>
                </template>
                <template v-else>
                  <TrackedVariableInput
                    :route="props.route"
                    :value="header.description"
                    :enabled-env-variable="false"
                    @text-change="val => header.description = val"
                  />
                </template>
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
}

.header-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
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
    text-align: center;
    vertical-align: middle;
    padding: 0;
  }

  td {
    height: 40px;
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 0 8px;
    vertical-align: middle;
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
  stroke: #666;
  &:hover { stroke: #000; }
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
  
  &.is-disabled {
    cursor: not-allowed;
    stroke: #aaa;
  }
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
