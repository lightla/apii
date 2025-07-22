<script setup lang="ts">
import {ref} from 'vue'
import type {RouteInfo} from '@/types'
import EnvVariableTable from "@/app/Request/Editor/Env/EnvVariableTable.vue"
import {useEnvStorage} from "@/storages/env-variables-tmp.ts"
import {IconSquareRoundedPlus, IconToggleLeftFilled, IconToggleRightFilled} from '@tabler/icons-vue'
import ToggleLeftIcon from '@/assets/svg/feathericons/toggle-left.svg'
import ToggleRightIcon from '@/assets/svg/feathericons/toggle-right.svg'

const props = defineProps<{
  route: RouteInfo
}>()

const envStorage = useEnvStorage();

console.log("envStorage.definedEnvVariables:" +envStorage.definedEnvVariables);

const toggleEnvTable = ref(false);

const clickConfigEnvironment = (event: MouseEvent): void => {
  toggleEnvTable.value = ! toggleEnvTable.value
}

const addEnv = (event: MouseEvent): void => {
  // todo: comming soon
}

</script>

<template>
  <div class="env-settings"
       :class="{ 'enabled': toggleEnvTable }"
  >
    <div class="env-controls">
      <select class="env-select">
        <option v-for="env in envStorage.definedEnvs" :key="env.id" :value="env.code">
          {{env.name}}
        </option>
      </select>
      <div class="env-actions">
        <ToggleLeftIcon v-if="! toggleEnvTable" @click="clickConfigEnvironment" class="env-action-svg"/>
        <ToggleRightIcon v-else @click="clickConfigEnvironment" class="env-action-svg"/>
      </div>
    </div>
    <div v-if="toggleEnvTable" class="env-variable-table-enabled">
      <EnvVariableTable :route="props.route"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .env-settings  {
    //padding: 10px 15px;
    //border: 1px solid #888888;
    display: flex;
    flex-direction: column;

    gap: 10px;

    &.enabled {
      min-height: 100%;
      max-height: 100%;
    }


  }

  .env-controls {
    display: flex;
    gap: 10px;
    //border: 1px solid #888888;
    flex-shrink: 0; // Ngăn env-controls bị co lại
  }

  .env-select {
    border: 1px solid #888888;
    padding: 5px;
    max-width: 140px;
    min-width: 140px;
    text-overflow: ellipsis;
  }

  .env-actions {
    display: flex;
    gap: 5px;
  }

  .env-action-1 {
    cursor: pointer;

    &:hover {
      fill: #cccccc;
    }
  }

  .env-action-svg {
    cursor: pointer;

    display: block;
    height: 100%;
    width: auto;
    stroke-width: 1;
    transform: scale(1.1, 1.0);

    &:hover {
      fill: #cccccc;
    }
  }

  .env-action-2 {
    cursor: pointer;
    fill: #4b4b4b;
    
    &:hover {
      fill: #000000;
    }
  }

  .env-variable-table-enabled {
    flex: 1; // Chiếm không gian còn lại
    max-height: 100%; // Giới hạn chiều cao
    overflow-y: auto; // Thêm thanh cuộn dọc nếu nội dung vượt quá
    display: flex; // Thêm flex để đồng bộ với con
    flex-direction: column;
  }

</style>
