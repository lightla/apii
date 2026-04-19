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
    <div class="path-variable-toolbar">
      <span class="path-variable-toolbar-title">Path Variables</span>
    </div>

    <div class="query-table-scroll-wrapper">
      <table class="query-param-table">
        <colgroup>
          <col style="width: 40px;">
          <col style="width: 30%;">
          <col style="width: auto;">
        </colgroup>
        <thead>
          <tr>
            <th>No</th>
            <th>Variable</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(name, index) in pathVarNames" :key="name">
            <td class="cell-no">{{ index + 1 }}</td>
            <td>
              <div class="param-input-wrap">
                <span class="defined-uri-param">{{ '{' + name + '}' }}</span>
              </div>
            </td>
            <td>
              <div class="param-input-wrap">
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
            <td colspan="3" class="empty-row">No path variables in URL</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.path-variable {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
}

.path-variable-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.path-variable-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
}

.query-table-scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  @include elements.scrollbar-hidden;
}

.query-param-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-right: var(--table-border);

  th, td {
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 4px 8px;
    vertical-align: middle;
    height: 36px; /* Cố định chiều cao hàng */
  }

  th {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
    font-size: 13px;
    font-weight: 600;
    text-align: left;
    padding: 0 8px; /* Giảm padding dọc để khớp height */
  }

  th:first-child, td:first-child {
    width: 40px;
    padding: 4px;
    text-align: center;
  }

  tr:last-child td {
    border-bottom: var(--table-border);
  }
}

.cell-no {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.param-input-wrap {
  padding: 2px 0;
  display: flex;
  align-items: center;
}

.defined-uri-param {
  color: var(--defined-uri-param);
  font-weight: 600;
  font-size: 13px;
  padding-left: 4px;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 20px !important;
}
</style>
