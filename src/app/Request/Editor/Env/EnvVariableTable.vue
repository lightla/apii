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
import ScrollTable from "@/app/Generals/ScrollTable/ScrollTable.vue";

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
      
      <!-- ĐƯA SELECT VÀO ĐÂY VÀ DỒN SANG PHẢI -->
      <div class="env-toolbar-select-wrap">
        <select class="env-select-in-toolbar">
          <option v-for="env in envStorage.definedEnvs" :key="env.id" :value="env.code">
            {{env.name}}
          </option>
        </select>
      </div>
    </div>

    <ScrollTable :items="envStorage.definedEnvs" height="360px">
      <template #header>
        <th style="width:7%">No</th>
        <th>Name</th>
        <th>Code</th>
        <th style="width:5%">Tmp</th>
      </template>

      <template #row="{ item, index }">
        <td>{{ index + 1 }}</td>
        <td>
          <EnvCellNameInput :placeholder="'Env Name'" :env-index="index" />
        </td>
        <td>{{ item.code }}</td>
        <td>
          Tmp
          <div class="cell-icon-action"></div>
        </td>
      </template>

      <template #empty>
        Chưa có biến môi trường
      </template>
    </ScrollTable>

    <div class="env-variable-table-toolbar" style="margin-top: 20px;">
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
  border: none;
  padding: 0;
  max-height: 100%;
  min-height: 100%;
  overflow: visible;
}

.env-variable-table-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
}

.env-toolbar-select-wrap {
  margin-left: auto; /* LỆNH QUAN TRỌNG ĐỂ CĂN PHẢI */
  display: flex;
  align-items: center;
}

.env-select-in-toolbar {
  border: 1px solid #888888;
  padding: 2px 5px;
  font-size: 12px;
  min-width: 120px;
  background: #fff;
}

.env-variable-table-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
}

.env-table-scroll-wrapper {
  flex: 1;
  overflow-y: auto;
  box-sizing: border-box;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);
  &.no-data { border-bottom: none; }
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
  position: relative;
  border-bottom: var(--table-border);
}

.table-scroll {
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
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
  tr td:last-child, tr th:last-child { border-right: 1px solid #666666; }
  tr:last-child td { border-bottom: none !important; }
}

.env-variable-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  th, td {
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 8px;
    vertical-align: middle;
  }
  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
  }
  tr th:last-child, td:last-child { border-right: var(--table-border); }
  tr:last-child td { border-bottom: none; }
}

.cell-icon-action { display: flex; justify-content: center; width: 100%; }

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
}
</style>
