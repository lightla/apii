<script setup lang="ts">
import {onMounted, ref} from 'vue'
import type {RouteInfo} from "@/types";
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {
  SquarePlus,
  SquareCheck,
  Square,
  SquareX,
  TriangleAlert,
  OctagonAlert,
  CircleAlert,
  BadgeAlert,
  ShieldAlert,
  SquareCheckBig,
  Eraser
} from "lucide-vue-next";
import {IconAlertSquare} from "@tabler/icons-vue";
import Warning3 from "@/assets/svg/svgrepo/warning3.svg";

const props = defineProps<{
  route: RouteInfo
}>()

type QueryParam = {
  key: string,
  value: string,
  enabled: boolean,
  description: string
}

const queryParams = ref<QueryParam[]>([
  { key: 'q1', value: '123', enabled: false, description: '' },
  { key: 'q2', value: '456', enabled: false, description: '' }
])

onMounted(() => {

})

function onQueryInput(e: Event, index: number, field: keyof QueryParam) {
  const target = e.target as HTMLElement
  // queryParams.value[index][field] = target.innerText
}

function toggleEnabled(index: number) {
  queryParams.value[index].enabled = !queryParams.value[index].enabled
}

function removeQueryParam(index: number) {
  queryParams.value.splice(index, 1)
}

function addQueryParam() {
  let idx = 1
  let key = `newParam${idx}`
  while (queryParams.value.find(p => p.key === key)) {
    idx++
    key = `newParam${idx}`
  }
  queryParams.value.push({ key, value: '', enabled: false, description: '' })
}

const showDescription = ref(false)

function toggleDescription() {
  showDescription.value = !showDescription.value
}

const deleteAllState = ref<'idle' | 'confirm'>('idle')
let timer: number | undefined

function onDeleteAllClick() {
  if (deleteAllState.value === 'idle') {
    deleteAllState.value = 'confirm'
    timer = window.setTimeout(() => {
      deleteAllState.value = 'idle'
    }, 3000)
  } else {
    queryParams.value = []
    deleteAllState.value = 'idle'
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
  }
}
</script>

<template>
  <div class="query-param">
    <div class="query-param-control">
      <h4 class="param-control-title">Query Parameters</h4>
      <div class="param-control-icon">
        <SquarePlus @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row"/>
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
             <SquareCheck @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row"/>
            </div>
          </th>
          <th>Variable</th>
          <th>Value</th>
          <th>Description</th>
          <th>
            <div class="param-control-icon">
              <SquarePlus @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row"/>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td class="cell-action">
          <div class="param-control-icon">
            <Square @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row"/>
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td class="cell-action">
          <div class="param-control-icon">
            <ShieldAlert @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row" width="27px" height="27px"/>
          </div>
        </td>
      </tr>
      <tr>
        <td class="cell-action">
          <div class="param-control-icon">
            <SquareCheck @click="onClickAddRowButton" stroke-width="1" class="param-control-button-add-row"/>
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td>
          <div class="uri-param-value">
            <TrackedVariableInput
                :route="props.route"
                :enabled-env-variable="true"
            />
          </div>
        </td>
        <td class="cell-action">
          <div class="param-control-icon"><SquareX @click="onClickButton" stroke-width="1" class="icon-button-warning" /></div>
        </td>
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

  .btn-del-row {
    display: flex;
    align-items: center;
    height: 28px;
    border: 1px solid #666666;
    width: 28px;
  }

  .btn-del-row1 {
    display: flex;
    align-items: center;
    height: 27px;
    border: 1px solid #666666;
    width: 27px;
    padding: 2px;
  }

  .icon-button-warning {
    height: 100% !important;
    cursor: pointer;
    transition: fill 0.2s ease;
    fill: var(--app-bg-color);

    &:hover {
      fill: #cccccc;
    }
  }
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
}

.param-control-button-add-row {
  height: 100%;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.query-controls {
  margin: 8px 0 12px;
  display: flex;
  gap: 0;
}

.query-controls button {
  cursor: pointer;
  padding: 6px 16px;
  border: 1.5px solid #42b983;
  background-color: white;
  color: #42b983;
  font-weight: 600;
  user-select: none;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-right: none;
  border-radius: 0;
  flex-grow: 1;
  text-align: center;
}

.query-controls button:last-child {
  border-right: 1.5px solid #42b983;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.query-controls button:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.query-controls button.active {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.query-controls button:hover:not(.active) {
  background-color: #42b983;
  color: white;
}

.query-params-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.param-value-input {
  border: 1.5px solid #ccc;
  padding: 6px 10px;
  min-width: 140px;
  min-height: 26px;
  outline: none;
  user-select: text;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.15s ease;
  white-space: nowrap;
  overflow-x: auto;
  cursor: text;
}

.param-value-input:focus {
  border-color: #42b983;
  box-shadow: 0 0 5px #42b983aa;
}

.key-input {
  flex-shrink: 0;
  width: 140px;
}

.value-input {
  flex-shrink: 0;
  width: 140px;
}

.description-input {
  flex-shrink: 1;
  min-width: 200px;
}

.toggle-enabled-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1.8px solid #ccc;
  background-color: white;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  user-select: none;
  color: transparent;
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
}

.toggle-enabled-btn.enabled {
  background-color: #42b983;
  border-color: #369a6e;
  color: white;
}

.toggle-enabled-btn:hover {
  border-color: #42b983;
}

.remove-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 26px;
  height: 26px;
  background-color: #e74c3c;
  border-radius: 50%;
  color: white;
  font-weight: 900;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  margin-left: 6px;
}

.remove-icon:hover {
  background-color: #c0392b;
}
</style>
