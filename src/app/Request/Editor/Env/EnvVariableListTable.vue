<script setup lang="ts">
import { useEnvStorage } from "@/storages/env-variables-tmp.ts";
import VariableCellButton from "@/app/Request/Editor/Env/VariableTableCell/VariableCellButton.vue";
import VariableCellNameInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellNameInput.vue";
import VariableCellValueInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellValueInput.vue";
import { Eraser } from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";

const envStorage = useEnvStorage();

const onClickAddRowButton = (): void => {
  envStorage.addVariableDefinition()
}

const normalizeInputText = (text: string | undefined | null): string => {
  return (text ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

const onClickEraserEmptyLine = (): void => {
  envStorage.variableDefinitions = envStorage.variableDefinitions.filter((v) => {
    return normalizeInputText(v.name) !== '';
  })
}
</script>

<template>
  <div class="env-table-pane">
    <div class="env-variable-table-toolbar">
      <span class="env-variable-table-toolbar-title">ENV Variable</span>
      <IconSquareRoundedPlus @click="onClickAddRowButton" stroke-width="1" class="icon-button-add-row"/>
    </div>

    <div class="env-table-scroll-wrapper">
      <table class="env-variable-table">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: auto;">
          <col style="width: auto;">
          <col style="width: 40px;">
        </colgroup>
        <thead>
          <tr>
            <th>No</th>
            <th>Name</th>
            <th>Value</th>
            <th>
              <Eraser @click="onClickEraserEmptyLine" stroke-width="1" class="icon-button icon-button-eraser"/>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, envVariableIndex) in envStorage.definedEnvVariables" :key="item.id">
            <td>{{ envVariableIndex + 1 }}</td>
            <td>
              <VariableCellNameInput :placeholder="'Variable Name'" :variable-index="envVariableIndex" />
            </td>
            <td>
              <VariableCellValueInput :placeholder="'Variable Value'" :variable-index="envVariableIndex" />
            </td>
            <td>
              <div class="cell-icon-action">
                <VariableCellButton :action="'delete'" :env-variable-index="envVariableIndex" />
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
@use "./env-table-styles";

.env-table-pane {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
}
</style>
