<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEnvStorage } from "@/storages/env-variables-tmp.ts";
import { Eraser, ShieldAlert, SquareX } from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";
import EnvCellNameInput from "@/app/Request/Editor/Env/EnvTableCell/EnvCellNameInput.vue";

const envStorage = useEnvStorage();
const envDeleteConfirmIndex = ref<number | null>(null)
let envDeleteConfirmTimeout: ReturnType<typeof setTimeout> | null = null

const filteredEnvsForSelect = computed(() => {
  return envStorage.definedEnvs.filter(env => env.name.trim() !== '')
})

const onClickAddEnvRowButton = (): void => {
  envStorage.addDefinedEnv({ name: '', code: '' })
}

const isProtectedEnv = (env: { code: string }, envIndex: number): boolean => {
  return envIndex === 0 || env.code === 'default'
}

const normalizeInputText = (text: string | undefined | null): string => {
  return (text ?? '').replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

const onClickEnvEraserEmptyLine = (): void => {
  envStorage.definedEnvs = envStorage.definedEnvs.filter((env, envIndex) => {
    if (isProtectedEnv(env, envIndex)) return true
    return normalizeInputText(env.name) !== ''
  })
}

const onClickDeleteEnvRow = (envIndex: number): void => {
  const env = envStorage.definedEnvs[envIndex]
  if (!env || isProtectedEnv(env, envIndex)) return

  if (envDeleteConfirmIndex.value !== envIndex) {
    envDeleteConfirmIndex.value = envIndex
    if (envDeleteConfirmTimeout) clearTimeout(envDeleteConfirmTimeout)
    envDeleteConfirmTimeout = setTimeout(() => {
      envDeleteConfirmIndex.value = null
    }, 2000)
    return
  }

  envStorage.definedEnvs.splice(envIndex, 1)
  envDeleteConfirmIndex.value = null
}
</script>

<template>
  <div class="env-table-pane">
    <div class="env-variable-table-toolbar">
      <span class="env-variable-table-toolbar-title">ENV</span>
      <IconSquareRoundedPlus @click="onClickAddEnvRowButton" stroke-width="1" class="icon-button-add-row"/>

      <div class="env-toolbar-select-wrap">
        <select class="env-select-in-toolbar" v-model="envStorage.selectedEnvCode">
          <option v-for="env in filteredEnvsForSelect" :key="env.id" :value="env.code">
            {{env.name}}
          </option>
        </select>
      </div>
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
