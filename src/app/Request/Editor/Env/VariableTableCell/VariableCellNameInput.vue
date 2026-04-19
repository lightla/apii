<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {highlightEnvVariable} from "@/utils/variable-input.ts";
import {type HighlightVariableOptionParam} from "@/types/variable-input.ts";
import {useEnvStorage, useInputStorage} from "@/storages/env-variables-tmp.ts";

const props = withDefaults(defineProps<{
  width?: string
  placeholder?: string,
  variableIndex: number
}>(), {
  placeholder: '',
  width: '100%'
})

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();

const envVariableValueInputRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  if (envVariableValueInputRef.value) {
    envVariableValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envVariableValueInputRef.value) {
        e.preventDefault()
      }
    })

    const envVariable = envStorage.definedEnvVariables[props.variableIndex];
    if (envVariable) {
      envVariableValueInputRef.value.textContent = envVariable.name;
    }

    highlightEnvVariable(envVariableValueInputRef.value, false)
  }
})

const onEnvValueInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const isEmpty = !target.textContent?.trim();

  if (isEmpty) {
    target.textContent = '';
  }

  envStorage.updateVariableName(props.variableIndex, target.textContent ?? '');

  highlightEnvVariable(target, true)

  const highlightOptions = <HighlightVariableOptionParam>{
    definedEnvVariables: envStorage.collectEnvVariableNames(),
  };

  inputStorage.rescanHighlightAllInputs(null, highlightOptions);
}

</script>

<template>
  <div class="var-value-input" :style="{ '--var-input-width': props.width }">
    <div
        ref="envVariableValueInputRef"
        class="var-input-content"
        contenteditable="true"
        :data-placeholder="props.placeholder"
        @input="onEnvValueInputChange"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.var-value-input {
  box-sizing: border-box;
  background-color: whitesmoke;
  width: var(--var-input-width);
  border: 1px solid black;
  padding: 0 10px;

  &:focus-within {
    border-color: transparent;
    box-shadow: 0 0 0 2px #007bff;
  }
}

.var-input-content {
  box-sizing: border-box;
  padding-top: 6px;
  padding-bottom: 6px;
  outline: none;
  width: 100%;
  max-width: 100%;
  overflow-x: scroll;
  white-space: nowrap;
  scrollbar-width: none;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
}

.var-input-content:empty::before {
  content: attr(data-placeholder);
  color: #aaa;
  pointer-events: none;
  opacity: 0.6;
}
</style>
