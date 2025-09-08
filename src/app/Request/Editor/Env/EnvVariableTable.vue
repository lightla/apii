
<script setup lang="ts">
import {computed, onMounted, nextTick} from 'vue'
import type {RouteInfo} from '@/types'
import {useEnvStorage} from "@/storages/env-variables-tmp.ts";
import VariableCellButton from "@/app/Request/Editor/Env/VariableTableCell/VariableCellButton.vue";
import VariableCellNameInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellNameInput.vue";
import VariableCellValueInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellValueInput.vue";
import {Eraser, SquarePlus, SquareX} from "lucide-vue-next";
import {IconSquareRoundedPlus} from "@tabler/icons-vue";
import EnvCellNameInput from "@/app/Request/Editor/Env/EnvTableCell/EnvCellNameInput.vue";

const props = defineProps<{
  route: RouteInfo
}>()

// Load env variables as an object { [variableName]: value }
const envStorage = useEnvStorage();

console.log("env-table.run:");

// Chuyển object thành mảng để dễ lặp trong template
const envVariables = computed(() => {
  return Object.entries(envStorage.definedEnvVariables || {}).map(([key, value]) => ({
    name: key,
    value
  }));
});

const onNameInputChange = (envVariableInputName: string, variableIndex: number): void => {
  console.log("env-table.onInputChange:" + envVariableInputName + "|")
  console.log("env-table.variableIndex:" + variableIndex + "|")
}

const onClickAddRowButton = (event: MouseEvent): void => {
  envStorage.addDefinedEnvVariable({
    name: "",
    value: "",
    isValidFormat: true,
  })
}

const onClickEraserEmptyLine = (event: MouseEvent): void => {
  envStorage.definedEnvVariables = envStorage.definedEnvVariables.filter(envVariable => {
    return envVariable.name.trim() !== '';
  });
}

</script>

<template>
  <div class="env-variable-controls">
    <div class="env-variable-table-toolbar">
      <span class="env-variable-table-toolbar-title">ENV</span>
      <IconSquareRoundedPlus @click="" stroke-width="1" class="icon-button-add-row"/>
    </div>
    <div class="table-scroll-wrap">
      <table class="table-scroll">
        <colgroup>
          <col style="width:2.4rem;">
          <col style="">
          <col style="">
          <col style="width:2.4rem">
        </colgroup>
        <thead>
        <tr>
          <th>No</th>
          <th>Name</th>
          <th>Code</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
          <tr
            v-for="(env, envIndex) in envStorage.definedEnvs"
            :data-env-index="envIndex"
            :key="env.id"
          >
            <td>{{envIndex + 1}}</td>
            <td>
              <span class="text-value" v-if="(env.code === 'no-environment')">{{env.name}}</span>
              <EnvCellNameInput v-else :env-index="envIndex"/>
            </td>
            <td>{{env.code}}</td>
            <td class="cell-icon">
              <div class="icon-action-wrap" v-if="(env.code !== 'no-environment')">
                <SquareX v-if="! clickToConfirmed" @click="onClickButton" class="icon-action" stroke-width="0.9" :size="30" width="30px" height="30px"/>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-scroll-wrap"
         :class="{ 'no-data': envStorage.definedEnvs.length === 0 }"
         style="display: none;"
    >
      <table class="table-scroll">
        <colgroup>
          <col style="width: 7%;">
          <col style="width: auto;">
          <col style="width: auto;">
          <col style="width: 5%;">
        </colgroup>
        <thead>
        <tr>
          <th>No</th>
          <th>Name</th>
          <th>Code</th>
          <th>Tmp
<!--            <Eraser @click="onClickEraserEmptyLine" stroke-width="1" class="icon-button" width="100%" height="100%"/>-->
          </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="(item, envIndex) in envStorage.definedEnvs"
            :data-env-variable-index="envIndex"
            :key="item.id"
        >
          <td>{{ envIndex + 1 }}</td>
          <td>
            <EnvCellNameInput
                :placeholder="'Env Name'"
                :env-index="envIndex"
            />
          </td>
          <td>
            {{item.code}}
          </td>
          <td>Tmp
            <div class="cell-icon-action">

<!--              <VariableCellButton-->
<!--                  :action="'delete'"-->
<!--                  :env-variable-index="envIndex"-->
<!--              />-->
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div class="env-variable-table-toolbar">
      <span class="env-variable-table-toolbar-title">ENV Variable</span>
      <SquarePlus @click="onClickAddRowButton" stroke-width="1" class="icon-button-add-row"/>
    </div>
    <div class="env-table-scroll-wrapper"
         :class="{ 'no-data': envStorage.definedEnvVariables.length === 0 }"
    >
      <table class="env-variable-table">
        <colgroup>
          <col style="width: 7%;">
          <col style="width: auto;">
          <col style="width: auto;">
          <col style="width: 5%;">
        </colgroup>
        <thead>
          <tr>
            <th>No</th>
            <th>Name</th>
            <th>Value</th>
            <th>
              <Eraser @click="onClickEraserEmptyLine" stroke-width="1" class="icon-button" width="100%" height="100%"/>
            </th>
          </tr>
        </thead>
        <tbody>
        <tr
            v-for="(item, envVariableIndex) in envStorage.definedEnvVariables"
            :data-env-variable-index="envVariableIndex"
            :key="item.id"
        >
          <td>{{ envVariableIndex + 1 }}</td>
          <td>
            <VariableCellNameInput
                :placeholder="'Variable Name'"
                :variable-index="envVariableIndex"
            />
          </td>
          <td>
            <VariableCellValueInput
                :placeholder="'Variable Value (todo:1_name-n_value)'"
                :variable-index="envVariableIndex"
            />
          </td>
          <td>
            <div class="cell-icon-action">
              <VariableCellButton
                  :action="'delete'"
                  :env-variable-index="envVariableIndex"
              />
            </div>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.env-variable-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #888888;
  padding: 10px;
  max-height: 100%;
  min-height: 100%;
  overflow: hidden;
}

.env-variable-table-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
}

.env-variable-table-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
}

.env-table-scroll-wrapper {
  max-height: 30.7%; /* 48px cho mỗi hàng, 40px cho header */
  overflow-y: auto;
  box-sizing: border-box;

  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);

  &.no-data {
    border-bottom: none;
  }
}

.table-scroll-wrap {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  overflow: auto;
  @include elements.scrollbar-hidden;
  width: 100%;
  max-height: calc(3*(40px) + 3*(30px - 6px));

  border-bottom: var(--table-border);
}

.table-scroll {
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
  gap: 0;
  padding: 0;
  width: 100%;
  text-align: left;

  th, td {
    border-bottom: 1px solid #666666;
    border-left: 1px solid #666666;
    padding: 10px;
    height: 40px;
    vertical-align: middle;
    overflow: hidden;
  }

  th {
    border-top: 1px solid #666666;
    background-color: var(--table-header-bg-color);
    position: sticky;
    top: 0;
  }

  tr td:last-child, tr th:last-child {
    border-right: 1px solid #666666;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .text-value {
    display: flex;
    align-items: center;
    height: 30px;
  }

  .cell-icon {
    padding: 0px;
  }

  .icon-action-wrap {
    display: flex;
    justify-content: center;
  }

  .icon-action {
    width: 30px !important; /* Cố định kích thước */
    height: 30px !important;
    min-width: 30px; /* Ngăn co nhỏ */
    min-height: 30px;

    fill: var(--icon-bg-color);

    &:hover {
      fill: var(--icon-bg-color-active);
    }
  }
}

.env-variable-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  %env-variable-table-cell {
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 8px;
    vertical-align: middle;
    justify-content: center;
    max-height: 48px;
    min-height: 48px;
  }

  th {
    @extend %env-variable-table-cell;
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
  }

  tr th:last-child, td:last-child {
    border-right: var(--table-border);
    padding: 2px 2px;
  }

  td {
    @extend %env-variable-table-cell
  }

  tr:last-child {
    td {
      border-bottom: none;
    }
  }
}

.cell-icon-action {
  display: flex;
  justify-content: center; // nếu muốn icon ở giữa
  width: 100%; // hoặc kích thước phù hợp bạn mong muốn
  height: 100%;
  padding: 0;
}

.icon-button-add-row {
  width: 30px !important;
  height: 30px;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.icon-button {
  cursor: pointer;
  transition: fill 0.2s ease;
  fill: var(--icon-bg-color);

  &:hover {
    fill: var(--icon-bg-color-active);
  }
}
</style>