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
    <!-- Header đã được chuyển vào Toolbar của EnvVariableTable -->
    <div class="env-variable-table-enabled">
      <EnvVariableTable :route="props.route"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .env-settings  {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 0;
    padding: 0;
    box-sizing: border-box;
    overflow: hidden;
  }

  .env-variable-table-enabled {
    width: 100%;
    height: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
</style>
