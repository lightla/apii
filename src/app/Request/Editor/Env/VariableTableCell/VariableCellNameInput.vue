<script setup lang="ts">
import {ref, onMounted, watch, type Ref, computed} from 'vue'
import type { RouteInfo } from '@/types'
import {highlightEnvVariable} from "@/utils/variable-input.ts";
import {type HighlightVariableOptionParam, HighlightVariableTypeEnum} from "@/types/variable-input.ts";
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

console.log("env-var-name:run:");

onMounted(() => {
  console.log("env-var-name.onMounted:");

  if (envVariableValueInputRef.value) {
    console.log("env-var-name.onMounted.hasRef:");

    envVariableValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envVariableValueInputRef.value) {
        e.preventDefault()
      }
    })

    const envVariable = envStorage.definedEnvVariables[props.variableIndex];
    envVariableValueInputRef.value.textContent = envVariable.name;

    highlightEnvVariable(envVariableValueInputRef.value, false)
  }
})

const onEnvValueInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  console.log("env-var-name.onInputChange:" + target.innerText + "|")

  const isEmpty = !target.textContent?.trim();

  if (isEmpty) {
    target.textContent = '';
  }

  envStorage.definedEnvVariables[props.variableIndex].name = target.textContent ?? '';

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

  // Khi bên trong có phần tử được focus (như div contenteditable)
  &:focus-within {
    border-color: transparent;
    box-shadow: 0 0 0 2px #007bff; // "viền sáng" nhưng không đẩy layout
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

  /* Ngăn nội dung xuống dòng để cuộn ngang */
  white-space: nowrap;

  /* Ẩn thanh cuộn trên WebKit (Chrome, Safari) */
  ::-webkit-scrollbar {
    display: none; /* Ẩn thanh cuộn */
  }

  /* Ẩn thanh cuộn trên Firefox */
  scrollbar-width: none; /* Không hiển thị thanh cuộn */

  /* Tùy chọn: Nếu bạn muốn giữ hiệu ứng cuộn mượt mà */
  scroll-behavior: smooth;

}

// Placeholder styling when empty
.var-input-content:empty::before {
  content: attr(data-placeholder);
  color: #aaa;
  pointer-events: none;
  opacity: 0.6;
}
</style>
