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
    align-items: flex-end; /* Dồn nội dung sang phải */
    gap: 10px;
    width: 100%;
    height: 100%;
    padding: 0; /* Đặt về 0 để bằng với Editor (vì cha đã có 10px) */
    box-sizing: border-box;
  }

  .env-controls {
    display: flex;
    justify-content: flex-end;
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
    width: 100%; /* Để tự nhiên cho dài ra */
    flex: 1;
    max-height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    border: none; /* Bỏ border để đồng nhất với Editor */
  }

</style>
