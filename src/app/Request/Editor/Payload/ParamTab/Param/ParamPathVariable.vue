<script setup lang="ts">
import { computed, watch } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()

// Extract path variable names from the live URL (store.baseUrl)
const pathVarNames = computed<string[]>(() => {
  const matches = [...(store.baseUrl || '').matchAll(/(?<!{)\{([^{}]+)\}(?!})/g)]
  return [...new Set(matches.map(m => m[1]))]
})

// Sync store.pathVariables when URL changes
watch(pathVarNames, (names) => {
  store.pathVariables = names.map(name => ({
    name,
    value: store.pathVariables.find(v => v.name === name)?.value ?? ''
  }))
}, { immediate: true })

function getVarValue(name: string) {
  return store.pathVariables.find(v => v.name === name)?.value ?? ''
}

</script>

<template>
  <div class="path-variable">
    <h4>Path Variables</h4>
    <table class="table-path-variable">
      <colgroup>
        <col style="width: 35%;">
        <col style="width: auto;">
      </colgroup>
      <thead>
        <tr>
          <th>Variable</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="name in pathVarNames" :key="name">
          <td><span class="defined-uri-param">{{ '{' + name + '}' }}</span></td>
          <td>
            <div class="uri-param-value">
              <TrackedVariableInput
                :route="props.route"
                :value="getVarValue(name)"
                :enabled-env-variable="true"
                @text-change="val => store.updatePathVariable(name, val)"
              />
            </div>
          </td>
        </tr>
        <tr v-if="pathVarNames.length === 0">
          <td colspan="2" class="empty-row">No path variables in URL</td>
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
  flex-shrink: 0;
}

.table-path-variable {
  table-layout: fixed;
  border: 1px solid #666666;
  width: 100%;

  th {
    border: 1px solid #666666;
    background-color: #dddddd;
    padding: 5px;
    font-size: 13px;
    text-align: left;
  }

  td {
    border: 1px solid #666666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 5px;
    vertical-align: middle;
  }

  .uri-param-value {
    padding: 2px 4px;
  }
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 12px;
  padding: 8px;
  border: 1px solid #666;
}

.defined-uri-param {
  color: var(--defined-uri-param);
  font-weight: 600;
  font-size: 13px;
}
</style>
