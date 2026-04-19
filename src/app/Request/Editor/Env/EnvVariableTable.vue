<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue'
import type {RouteInfo} from '@/types'
import {useEnvStorage} from "@/storages/env-variables-tmp.ts";
import VariableCellButton from "@/app/Request/Editor/Env/VariableTableCell/VariableCellButton.vue";
import VariableCellNameInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellNameInput.vue";
import VariableCellValueInput from "@/app/Request/Editor/Env/VariableTableCell/VariableCellValueInput.vue";
import {Eraser, ShieldAlert, SquarePlus, SquareX} from "lucide-vue-next";
import {IconSquareRoundedPlus} from "@tabler/icons-vue";
import EnvCellNameInput from "@/app/Request/Editor/Env/EnvTableCell/EnvCellNameInput.vue";

const props = defineProps<{
  route: RouteInfo
}>()

// Load env variables as an object { [variableName]: value }
const envStorage = useEnvStorage();
const envScrollWrapperRef = ref<HTMLDivElement | null>(null)
const envVariableScrollWrapperRef = ref<HTMLDivElement | null>(null)
const showEnvBottomDivider = ref(false)
const showEnvVariableBottomDivider = ref(false)
let envResizeObserver: ResizeObserver | null = null
let envVariableResizeObserver: ResizeObserver | null = null
const envDeleteConfirmIndex = ref<number | null>(null)
const envDeleteConfirmTimeoutRef = ref<ReturnType<typeof setTimeout> | null>(null)

console.log("env-table.run:");

const onClickAddRowButton = (event: MouseEvent): void => {
  envStorage.addVariableDefinition()
}

const onClickAddEnvRowButton = (): void => {
  envStorage.addDefinedEnv({
    name: '',
    code: '',
  })
  void envStorage.persistDefinedEnvs()
}

const isProtectedEnv = (env: { code: string }, envIndex: number): boolean => {
  return envIndex === 0 || env.code === 'default'
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

const onClickEnvEraserEmptyLine = (): void => {
  envStorage.definedEnvs = envStorage.definedEnvs.filter((env, envIndex) => {
    if (isProtectedEnv(env, envIndex)) {
      return true
    }
    const normalizedName = normalizeInputText(env.name)
    return normalizedName !== ''
  })
  void envStorage.persistDefinedEnvs()
}

const onClickDeleteEnvRow = (envIndex: number): void => {
  const env = envStorage.definedEnvs[envIndex]
  if (!env || isProtectedEnv(env, envIndex)) {
    return
  }

  if (envDeleteConfirmIndex.value !== envIndex) {
    envDeleteConfirmIndex.value = envIndex
    if (envDeleteConfirmTimeoutRef.value) {
      clearTimeout(envDeleteConfirmTimeoutRef.value)
    }
    envDeleteConfirmTimeoutRef.value = setTimeout(() => {
      envDeleteConfirmIndex.value = null
      envDeleteConfirmTimeoutRef.value = null
    }, 2000)
    return
  }

  envStorage.definedEnvs.splice(envIndex, 1)
  void envStorage.persistDefinedEnvs()
  envDeleteConfirmIndex.value = null
  if (envDeleteConfirmTimeoutRef.value) {
    clearTimeout(envDeleteConfirmTimeoutRef.value)
    envDeleteConfirmTimeoutRef.value = null
  }
}

const updateBottomDividerState = (
  wrapperRef: { value: HTMLDivElement | null },
  dividerStateRef: { value: boolean }
): void => {
  const el = wrapperRef.value
  if (!el) return

  const hasOverflow = el.scrollHeight > el.clientHeight + 1
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
  dividerStateRef.value = hasOverflow && !atBottom
}

const updateAllBottomDividerStates = (): void => {
  updateBottomDividerState(envScrollWrapperRef, showEnvBottomDivider)
  updateBottomDividerState(envVariableScrollWrapperRef, showEnvVariableBottomDivider)
}

onMounted(() => {
  const envEl = envScrollWrapperRef.value
  const envVariableEl = envVariableScrollWrapperRef.value

  if (envEl) {
    envEl.addEventListener('scroll', updateAllBottomDividerStates, { passive: true })
    envResizeObserver = new ResizeObserver(updateAllBottomDividerStates)
    envResizeObserver.observe(envEl)
  }

  if (envVariableEl) {
    envVariableEl.addEventListener('scroll', updateAllBottomDividerStates, { passive: true })
    envVariableResizeObserver = new ResizeObserver(updateAllBottomDividerStates)
    envVariableResizeObserver.observe(envVariableEl)
  }

  updateAllBottomDividerStates()
})

watch(() => envStorage.definedEnvs.length, () => {
  requestAnimationFrame(() => updateAllBottomDividerStates())
})

watch(() => envStorage.definedEnvVariables.length, () => {
  requestAnimationFrame(() => updateAllBottomDividerStates())
})

onBeforeUnmount(() => {
  const envEl = envScrollWrapperRef.value
  const envVariableEl = envVariableScrollWrapperRef.value

  if (envEl) {
    envEl.removeEventListener('scroll', updateAllBottomDividerStates)
  }
  if (envVariableEl) {
    envVariableEl.removeEventListener('scroll', updateAllBottomDividerStates)
  }

  if (envResizeObserver) {
    envResizeObserver.disconnect()
    envResizeObserver = null
  }
  if (envVariableResizeObserver) {
    envVariableResizeObserver.disconnect()
    envVariableResizeObserver = null
  }
  if (envDeleteConfirmTimeoutRef.value) {
    clearTimeout(envDeleteConfirmTimeoutRef.value)
    envDeleteConfirmTimeoutRef.value = null
  }
})

</script>

<template>
  <div class="env-variable-controls">
    <div class="env-table-split">
      <div class="env-table-pane">
        <div class="env-variable-table-toolbar">
          <span class="env-variable-table-toolbar-title">ENV</span>
          <IconSquareRoundedPlus @click="onClickAddEnvRowButton" stroke-width="1" class="icon-button-add-row"/>

          <div class="env-toolbar-select-wrap">
            <select class="env-select-in-toolbar" v-model="envStorage.selectedEnvCode">
              <option v-for="env in envStorage.definedEnvs" :key="env.id" :value="env.code">
                {{env.name}}
              </option>
            </select>
          </div>
        </div>

        <div
             ref="envScrollWrapperRef"
             class="env-table-scroll-wrapper"
             :class="{ 'show-bottom-divider': showEnvBottomDivider }"
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
                <th>Code</th>
                <th>
                  <Eraser @click="onClickEnvEraserEmptyLine" stroke-width="1" class="icon-button icon-button-eraser"/>
                </th>
              </tr>
            </thead>
            <tbody v-if="envStorage.definedEnvs.length">
              <tr v-for="(item, index) in envStorage.definedEnvs" :key="item.id">
                <td>{{ index + 1 }}</td>
                <td>
                  <div v-if="isProtectedEnv(item, index)" class="protected-env-name-text">
                    {{ item.name }}
                  </div>
                  <EnvCellNameInput v-else :placeholder="'Env Name'" :env-index="index" />
                </td>
                <td>{{ item.code }}</td>
                <td>
                  <div class="cell-icon-action">
                    <template v-if="!isProtectedEnv(item, index)">
                      <SquareX
                        v-if="envDeleteConfirmIndex !== index"
                        @click="onClickDeleteEnvRow(index)"
                        stroke-width="1"
                        class="icon-button icon-button-row-action"
                      />
                      <ShieldAlert
                        v-else
                        @click="onClickDeleteEnvRow(index)"
                        stroke-width="1"
                        class="icon-button icon-button-row-action"
                      />
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td class="table-empty" colspan="4">Chưa có biến môi trường</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="env-table-pane">
        <div class="env-variable-table-toolbar">
          <span class="env-variable-table-toolbar-title">ENV Variable</span>
          <SquarePlus @click="onClickAddRowButton" stroke-width="1" class="icon-button-add-row"/>
        </div>

        <div
             ref="envVariableScrollWrapperRef"
             class="env-table-scroll-wrapper"
             :class="{
               'show-bottom-divider': showEnvVariableBottomDivider,
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
  th:first-child,
  td:first-child {
    text-align: center;
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

.env-variable-table tbody td {
  border-left: var(--table-border);
  border-bottom: var(--table-border);
  padding: 8px;
  background-color: transparent;
}

.protected-env-name-text {
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  font-weight: 500;
  color: #666;
}

.table-empty {
  text-align: center;
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

.icon-button-row-action {
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  display: block;
  margin: 0 auto;
}
</style>
