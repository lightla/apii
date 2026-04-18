<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from '@/app/Generals/TrackedVariableInput.vue'
import { SquarePlus, SquareCheck, Square, SquareX, ShieldAlert, Eraser } from 'lucide-vue-next'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()

const store = useRequestParamsStorage()

// Logic cho Master Toggle ở Header
const isAnyHeaderEnabled = computed(() => {
  return store.headers.length > 0 && store.headers.some(h => h.enabled)
})

// Logic cho Master Delete ở Header
const isConfirmingDeleteAll = ref(false)
let deleteAllTimer: ReturnType<typeof setTimeout> | undefined

function onMasterDeleteClick() {
  if (isConfirmingDeleteAll.value) {
    store.removeAllHeaders()
    isConfirmingDeleteAll.value = false
    clearTimeout(deleteAllTimer)
  } else {
    isConfirmingDeleteAll.value = true
    clearTimeout(deleteAllTimer)
    deleteAllTimer = setTimeout(() => {
      isConfirmingDeleteAll.value = false
    }, 3000)
  }
}

// Per-row delete confirm state
const confirmDeleteIndex = ref<number | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(index: number) {
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
    <div class="header-control">
      <h4 class="header-control-title">Headers</h4>
      <div class="header-control-icon">
        <SquarePlus @click="store.addHeader()" stroke-width="1" class="header-control-button-add-row" />
      </div>
    </div>

    <table class="header-table">
      <colgroup>
        <col style="width: 5%;">
        <col style="width: 30%;">
        <col style="width: 30%;">
        <col style="width: auto;">
        <col style="width: 5%;">
      </colgroup>
      <thead>
        <tr>
          <th>
            <div class="header-control-icon" @click="store.toggleAllHeaders()">
              <SquareCheck v-if="isAnyHeaderEnabled" stroke-width="1" class="header-control-button-add-row" />
              <Square v-else stroke-width="1" class="header-control-button-add-row" />
            </div>
          </th>
          <th>Key</th>
          <th>Value</th>
          <th>Description</th>
          <th>
            <div class="header-control-icon" @click="onMasterDeleteClick">
              <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button-warning confirming" />
              <Eraser v-else stroke-width="1" class="icon-button-warning" />
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(header, index) in store.headers" :key="header.id">
          <td class="cell-action">
            <div class="header-control-icon" @click="store.toggleHeader(index)">
              <SquareCheck v-if="header.enabled" stroke-width="1" class="header-control-button-add-row" />
              <Square v-else stroke-width="1" class="header-control-button-add-row" />
            </div>
          </td>
          <td>
            <div class="header-value">
              <TrackedVariableInput
                :route="props.route"
                :value="header.key"
                :enabled-env-variable="true"
                @text-change="val => header.key = val"
              />
            </div>
          </td>
          <td>
            <div class="header-value">
              <TrackedVariableInput
                :route="props.route"
                :value="header.value"
                :enabled-env-variable="true"
                @text-change="val => header.value = val"
              />
            </div>
          </td>
          <td>
            <div class="header-value">
              <TrackedVariableInput
                :route="props.route"
                :value="header.description"
                :enabled-env-variable="false"
                @text-change="val => header.description = val"
              />
            </div>
          </td>
          <td class="cell-action">
            <div class="header-control-icon" @click="onDeleteClick(index)">
              <ShieldAlert
                v-if="confirmDeleteIndex === index"
                stroke-width="1"
                class="icon-button-warning confirming"
                width="27px" height="27px"
              />
              <SquareX v-else stroke-width="1" class="icon-button-warning" />
            </div>
          </td>
        </tr>

        <tr v-if="store.headers.length === 0">
          <td colspan="5" class="empty-row">No headers</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.header-tab {
  display: flex;
  flex-direction: column;
  gap: 5px;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
}

.header-control {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.header-control-title {
  display: inline-block;
}

.header-control-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 200%;
  cursor: pointer;
}

.header-control-button-add-row {
  height: 100%;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.header-table {
  table-layout: fixed;
  border: 1px solid #666666;
  width: 100%;
  flex-shrink: 0;

  %cell-style {
    border: 1px solid #666666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 5px;
    vertical-align: middle;
  }

  th {
    @extend %cell-style;
    background-color: #dddddd;
    border-left: 1px solid #666666;
    border-top: 1px solid #666666;
    text-align: center;
  }

  td {
    @extend %cell-style;
    &.cell-action {
      padding: 0;
    }
  }

  .icon-button-warning {
    height: 100% !important;
    cursor: pointer;
    transition: fill 0.2s ease;
    fill: var(--app-bg-color);

    &:hover {
      fill: #cccccc;
    }

    &.confirming {
      fill: #fff3e0;
      stroke: #e65100;
      animation: pulse-shield 0.5s ease-in-out infinite alternate;
    }
  }
}

@keyframes pulse-shield {
  from { opacity: 0.7; }
  to   { opacity: 1; }
}

.header-value {
  padding: 4px 6px;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  padding: 10px;
  border: 1px solid #666;
}
</style>
