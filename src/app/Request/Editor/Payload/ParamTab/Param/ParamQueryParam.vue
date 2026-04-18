<script setup lang="ts">
import { ref } from 'vue'
import type { RouteInfo } from "@/types";
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {
  SquarePlus,
  SquareCheck,
  Square,
  SquareX,
  ShieldAlert,
} from "lucide-vue-next";
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{
  route: RouteInfo
}>()

const store = useRequestParamsStorage()

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
    <div class="query-param-control">
      <h4 class="param-control-title">Query Parameters</h4>
      <div class="param-control-icon">
        <SquarePlus @click="store.addQueryParam()" stroke-width="1" class="param-control-button-add-row"/>
      </div>
    </div>
    <table class="query-param-table">
      <colgroup>
        <col style="width: 5%;">
        <col style="width: 25%;">
        <col style="width: 25%;">
        <col style="width: auto;">
        <col style="width: 5%;">
      </colgroup>
      <thead>
        <tr>
          <th>
            <div class="param-control-icon">
              <SquareCheck stroke-width="1" class="param-control-button-add-row"/>
            </div>
          </th>
          <th>Variable</th>
          <th>Value</th>
          <th>Description</th>
          <th>
            <div class="param-control-icon">
              <SquarePlus @click="store.addQueryParam()" stroke-width="1" class="param-control-button-add-row"/>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(param, index) in store.queryParams" :key="param.id">
          <td class="cell-action">
            <div class="param-control-icon" @click="store.toggleQueryParam(index)">
              <SquareCheck v-if="param.enabled" stroke-width="1" class="param-control-button-add-row"/>
              <Square v-else stroke-width="1" class="param-control-button-add-row"/>
            </div>
          </td>
          <td>
            <div class="uri-param-value">
              <TrackedVariableInput
                :route="props.route"
                :value="param.key"
                :enabled-env-variable="true"
                @text-change="val => param.key = val"
              />
            </div>
          </td>
          <td>
            <div class="uri-param-value">
              <TrackedVariableInput
                :route="props.route"
                :value="param.value"
                :enabled-env-variable="true"
                @text-change="val => param.value = val"
              />
            </div>
          </td>
          <td>
            <div class="uri-param-value">
              <TrackedVariableInput
                :route="props.route"
                :value="param.description"
                :enabled-env-variable="false"
                @text-change="val => param.description = val"
              />
            </div>
          </td>
          <td class="cell-action">
            <div class="param-control-icon" @click="onDeleteClick(index)">
              <ShieldAlert v-if="confirmDeleteIndex === index"
                           stroke-width="1" class="icon-button-warning confirming" width="27px" height="27px"/>
              <SquareX v-else stroke-width="1" class="icon-button-warning" />
            </div>
          </td>
        </tr>

        <tr v-if="store.queryParams.length === 0">
          <td colspan="5" class="empty-row">No query parameters</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.query-param {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-shrink: 0;
}

.query-param-table {
  table-layout: fixed;
  border: 1px solid #666666;
  width: 100%;

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

.query-param-control {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
}

.param-control-title {
  display: inline-block;
}

.param-control-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 200%;
  cursor: pointer;
}

.param-control-button-add-row {
  height: 100%;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.uri-param-value {
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
