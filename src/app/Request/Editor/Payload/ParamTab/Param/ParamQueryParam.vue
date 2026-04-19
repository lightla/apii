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

// Logic cho Master Delete ở Header
const isConfirmingDeleteAll = ref(false)
let deleteAllTimer: ReturnType<typeof setTimeout> | undefined

function onMasterDeleteClick() {
  if (isConfirmingDeleteAll.value) {
    store.removeAllQueryParams()
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
                <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-eraser confirming" />
                <Eraser v-else stroke-width="1" class="icon-button icon-button-eraser" />
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
  height: 100%;
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
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  @include elements.scrollbar-hidden;
}

.query-param-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-right: var(--table-border);

  th, td {
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 4px 8px;
    vertical-align: middle;
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
    font-size: 13px;
    font-weight: 600;
    text-align: left;
  }

  th:first-child, td:first-child,
  th:last-child, td:last-child {
    width: 40px;
    padding: 4px;
    text-align: center;
  }

  tr:last-child td {
    border-bottom: var(--table-border);
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
    fill: #fff3e0;
    stroke: #e65100;
    animation: pulse-shield 0.5s ease-in-out infinite alternate;
  }
}

.icon-button-checkbox, .icon-button-eraser, .icon-button-row-action {
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
}

@keyframes pulse-shield {
  from { opacity: 0.7; }
  to   { opacity: 1; }
}

.param-input-wrap {
  padding: 2px 0;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 20px !important;
}
</style>
