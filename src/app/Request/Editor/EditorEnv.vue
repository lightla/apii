<script setup lang="ts">
import type {RouteInfo} from '@/types'
import EnvVariableTable from "@/app/Request/Editor/Env/EnvVariableTable.vue"
import {useEnvStorage} from "@/storages/env-variables-tmp.ts"

const props = defineProps<{
  route: RouteInfo
}>()

const envStorage = useEnvStorage();

</script>

<template>
  <div class="env-settings enabled">
    <div class="env-controls">
      <!-- Chỉ giữ lại Select và dồn nó sang phải -->
      <select class="env-select">
        <option v-for="env in envStorage.definedEnvs" :key="env.id" :value="env.code">
          {{env.name}}
        </option>
      </select>
    </div>
    
    <div class="env-variable-table-enabled">
      <EnvVariableTable :route="props.route"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .env-settings  {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;  /* TRẢ LẠI FULL 100% (660px) */
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
  }

  .env-controls {
    display: flex;
    justify-content: flex-end; /* DỒN CÁI SELECT SANG PHẢI */
    width: 100%;
    flex-shrink: 0;
  }

  .env-select {
    border: 1px solid #888888;
    padding: 5px;
    max-width: 140px;
    min-width: 140px;
    text-overflow: ellipsis;
    background: #fff;
  }

  .env-variable-table-enabled {
    width: 100%; /* TRẢ LẠI FULL 100% (KHÔNG CÒN 500PX) */
    flex: 1;
    max-height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
</style>
