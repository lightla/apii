<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
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
const envTableScrollWrapperRef = ref<HTMLDivElement | null>(null)
const showViewportBottomDivider = ref(false)
let envTableResizeObserver: ResizeObserver | null = null

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

const normalizeInputText = (text: string | undefined | null): string => {
  return (text ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

const onClickEraserEmptyLine = (): void => {
  envStorage.definedEnvVariables = envStorage.definedEnvVariables.filter((envVariable) => {
    const normalizedName = normalizeInputText(envVariable.name);
    return normalizedName !== '';
  })
}

const updateBottomDividerState = (): void => {
  const el = envTableScrollWrapperRef.value
  if (!el) return

  const hasOverflow = el.scrollHeight > el.clientHeight + 1
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
  showViewportBottomDivider.value = hasOverflow && !atBottom
}

onMounted(() => {
  const el = envTableScrollWrapperRef.value
  if (!el) return

  el.addEventListener('scroll', updateBottomDividerState, { passive: true })

  envTableResizeObserver = new ResizeObserver(() => {
    updateBottomDividerState()
  })
  envTableResizeObserver.observe(el)
  updateBottomDividerState()
})

watch(() => envStorage.definedEnvVariables.length, () => {
  requestAnimationFrame(() => updateBottomDividerState())
})

onBeforeUnmount(() => {
  const el = envTableScrollWrapperRef.value
  if (el) {
    el.removeEventListener('scroll', updateBottomDividerState)
  }
  if (envTableResizeObserver) {
    envTableResizeObserver.disconnect()
    envTableResizeObserver = null
  }
})

</script>

<template>
  <div class="env-variable-controls">
    <div class="env-table-split">
      <div class="env-table-pane">
        <div class="env-variable-table-toolbar">
          <span class="env-variable-table-toolbar-title">ENV</span>
          <IconSquareRoundedPlus @click="" stroke-width="1" class="icon-button-add-row"/>

          <div class="env-toolbar-select-wrap">
            <select class="env-select-in-toolbar">
              <option v-for="env in envStorage.definedEnvs" :key="env.id" :value="env.code">
                {{env.name}}
              </option>
            </select>
          </div>
        </div>

        <div class="env-pane-content">
          <ScrollTable :items="envStorage.definedEnvs" height="100%" :striped="false">
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
        </div>
      </div>

      <div class="env-table-pane">
        <div class="env-variable-table-toolbar">
          <span class="env-variable-table-toolbar-title">ENV Variable</span>
          <SquarePlus @click="onClickAddRowButton" stroke-width="1" class="icon-button-add-row"/>
        </div>

        <div
             ref="envTableScrollWrapperRef"
             class="env-table-scroll-wrapper"
             :class="{
               'show-bottom-divider': showViewportBottomDivider,
               'no-data': envStorage.definedEnvVariables.length === 0
             }"
        >
          <table class="env-variable-table">
            <colgroup>
              <col style="width: 7%;">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.env-variable-controls {
  --env-action-col-width: 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: none;
  padding: 0;
  height: 100%;
  max-height: 100%;
  min-height: 100%;
  overflow: hidden;
}

.env-table-split {
  --split-gap: 28px;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: var(--split-gap);
  box-sizing: border-box;
  height: 100%;
}

.env-table-pane {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
}

.env-pane-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.env-variable-table-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.env-toolbar-select-wrap {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.env-select-in-toolbar {
  border: 1px solid #888888;
  padding: 5px 10px;
  font-size: 14px;
  min-width: 140px;
  min-height: 32px;
  background-color: #f8f9fa;
  cursor: pointer;
}

.env-variable-table-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
}

.env-table-scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  box-sizing: border-box;
  @include elements.scrollbar-hidden;

  &.show-bottom-divider {
    border-bottom: var(--table-border);
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
  position: relative;
  border-bottom: var(--table-border);
}

.table-scroll {
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
  width: 100%;
  text-align: left;
  th, td { height: 40px; vertical-align: middle; overflow: hidden; }
  th {
    border-bottom: 1px solid #666666;
    border-left: 1px solid #666666;
    padding: 10px;
    border-top: 1px solid #666666;
    background-color: var(--table-header-bg-color);
    position: sticky;
    top: 0;
  }
  td {
    border-bottom: var(--table-border);
    border-left: var(--table-border);
    padding: 8px;
    background-color: transparent;
  }
  tr th:last-child { border-right: 1px solid #666666; }
  tr td:last-child { border-right: var(--table-border); }
  tr:last-child td { border-bottom: none !important; }
}

.env-pane-content :deep(.table-scroll-wrap),
.env-pane-content :deep(.table-scroll) {
  background: transparent !important;
}

.env-pane-content :deep(.table-scroll tbody td) {
  background: transparent !important;
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
  th:last-child, td:last-child {
    width: var(--env-action-col-width);
    min-width: var(--env-action-col-width);
    max-width: var(--env-action-col-width);
    padding: 4px;
    text-align: center;
  }
  tr th:last-child, td:last-child { border-right: var(--table-border); }
  tr:last-child td { border-bottom: var(--table-border); }
}

.table-scroll tbody td,
.env-variable-table tbody td {
  border-left: var(--table-border);
  border-bottom: var(--table-border);
  padding: 8px;
  background-color: transparent;
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

.icon-button-eraser {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  display: block;
  margin: 0 auto;
}
</style>
