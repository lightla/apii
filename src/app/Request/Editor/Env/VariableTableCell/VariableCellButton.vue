<script setup lang="ts">
import {ref} from 'vue'
import {useEnvStorage} from "@/storages/env-variables-tmp.ts";
import {ShieldAlert, SquareX} from 'lucide-vue-next';

const props = withDefaults(defineProps<{
  action: string,
  width?: string,
  envVariableIndex: number
}>(), {
  width: '100%'
});

const envStorage = useEnvStorage();

const clickToConfirmed = ref(false);

const timeoutIdRef = ref<ReturnType<typeof setTimeout> | null>(null);

const onClickButton = (event: MouseEvent) => {

  switch (props.action) {
    case 'delete':
      if (! clickToConfirmed.value) {
        clickToConfirmed.value = true;

        timeoutIdRef.value = setTimeout(() => {
          clickToConfirmed.value = false;
          timeoutIdRef.value = null;
        }, 2000);

        console.log("props.envVariableIndex:" + props.envVariableIndex);
        console.log("definedEnvVariables:" , envStorage.definedEnvVariables[props.envVariableIndex]);

      } else {
        console.log("confirmed-props.envVariableIndex:" + props.envVariableIndex);
        console.log("confirmed-definedEnvVariables:" , envStorage.definedEnvVariables[props.envVariableIndex]);

        envStorage.definedEnvVariables.splice(props.envVariableIndex, 1);

        console.log("After-splice", envStorage.definedEnvVariables.map(v => v.name));

        clickToConfirmed.value = false;

        if (timeoutIdRef.value) {
          clearTimeout(timeoutIdRef.value);
          timeoutIdRef.value = null;
        }
      }
      break;
  }
};
</script>

<template>
  <div class="env-button">
    <div v-if="props.action === 'delete'">
      <SquareX v-if="! clickToConfirmed" @click="onClickButton" stroke-width="1" class="icon-button" width="100%" height="100%"/>
      <ShieldAlert v-else @click="onClickButton" stroke-width="1" class="icon-button" width="100%" height="100%"/>
<!--      <Warning3 v-else @click="onClickButton" stroke-width="1" class="icon-button-warning" />-->
    </div>
  </div>
</template>

<style scoped lang="scss">
.env-button {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
}

.icon-button {
  cursor: pointer;
  transition: fill 0.2s ease;
  fill: var(--icon-bg-color);

  &:hover {
    fill: var(--icon-bg-color-active);
  }
}
</style>
