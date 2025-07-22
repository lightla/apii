<script setup lang="ts">
import {ref} from 'vue'
import type {RouteInfo} from "@/types";
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";

const props = defineProps<{
  route: RouteInfo
}>()

// Fake URI params
const uriParams = ref<string[]>(['ab', 'dc', 'activeStructureCode',
  'activeStructureCodeactiveStructureCodeStructureCodeStructureCodeStructureCode',
  'activeStructureCodeactiveStructureCodeStructureCodeStf',
  'activeStructureCodeactiveStructureCodeStructureCods',
  'activeStructureCodeactiveStructureCodeStructureCod',
  'activeStructureCodeactiveStructu',
  'activeStructureCodeactiveStructureCo',
  'activeStructureCodeactiveStructureCodeStructureCodeStructureCodeSt',
  'activeStructureCodeactiveStructureCodeStructureCodeStructureCodeSt',
  'activeStructureCodeactiveS',
  'activeStructureCodeactiveStructureCodeStructureCodeStructureCodeSt',
  'activeStructureCodeacti',
  'activeStructureCodeactiveStructureCodeStructureCodeSgCodeSt',
  'activeStructureCodeactiveStructureCodeStructureCoffodeSt',
  'activeStructureCodeactiveStructureCodeStructureCodssodeSt',
  'activeStructureCodeactiveStructureCodeStructureCodeStructureCodeSt',
  'activeStructureCodeactiveStructureCodeStructuaa',
  'activeStructureCodeactiveStructureCodeStructuưuctureCodeSt',
  'activeStructureCodeactiveStructureCodeStructureCodeStrueeSt',
])

// Map value của từng param
const uriParamValues = ref<Record<string, string>>({
  ab: 'ff',
  dc: 'aa',
  activeStructureCode: 'activeStructureCode-activeStructureCode',
  // activeStructureCodeactiveStructureCode: 'activeStructureCodeactiveStructureCode'
})

// Khi user nhập vào input
function onInput(e: Event, param: string) {
  const target = e.target as HTMLElement
  uriParamValues.value[param] = target.innerText
  console.log('Param input:', param, '->', target.innerText)
}
</script>

<template>
  <div class="path-variable">
    <h4>Path Variables</h4>
    <table class="table-path-variable">
      <colgroup>
        <col style="width: 30%;">
        <col style="width: auto;">
      </colgroup>
      <thead></thead>
      <tbody>
        <tr
            v-for="param in uriParams"
            :key="param"
            class="uri-param-row11123223"
        >
          <td><span class="defined-uri-param">{{ `\{${param}\}` }}</span></td>
          <td>
            <div class="uri-param-value">
              <TrackedVariableInput
                  :route="props.route"
                  :enabled-env-variable="true"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">
.path-variable {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.table-path-variable {
  table-layout: fixed;
  border: 1px solid #666666;
  width: 100%;

  td {
    border: 1px solid #666666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 5px;
    vertical-align: middle;
  }

  .uri-param-value {
    padding: 4px 6px;
  }
}

//
//.uri-params-container {
//  display: flex;
//  flex-direction: column;
//  gap: 10px;
//}
//
//.param-row {
//  display: flex;
//  align-items: center;
//  gap: 10px;
//}
//
//.uri-param {
//  color: #369a6e;
//  font-weight: 600;
//  border: 1px solid #ccc;
//  padding: 6px 10px;
//  min-width: 150px;
//  min-height: 24px;
//}
</style>
