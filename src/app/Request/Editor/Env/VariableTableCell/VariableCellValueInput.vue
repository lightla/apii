<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {replaceInputTextContent} from "@/utils/variable-input.ts";
import {useEnvStorage} from "@/storages/env-variables-tmp.ts";

const props = withDefaults(defineProps<{
  width?: string
  placeholder?: string,
  variableIndex: number
}>(), {
  placeholder: '',
  width: '100%'
})

const envStorage = useEnvStorage();
const envVariableValueInputRef = ref<HTMLDivElement | null>(null)

const updateDisplay = () => {
  if (envVariableValueInputRef.value) {
    const envVariable = envStorage.definedEnvVariables[props.variableIndex];
    const newValue = envVariable?.value || '';
    if (envVariableValueInputRef.value.textContent !== newValue) {
      envVariableValueInputRef.value.textContent = newValue;
    }
  }
}

onMounted(() => {
  if (envVariableValueInputRef.value) {
    envVariableValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envVariableValueInputRef.value) {
        e.preventDefault()
      }
    })
    updateDisplay();
  }
})

// Cập nhật hiển thị khi chuyển môi trường hoặc danh sách biến thay đổi
watch(() => envStorage.selectedEnvCode, updateDisplay)
watch(() => envStorage.definedEnvVariables[props.variableIndex]?.value, updateDisplay)

const onEnvValueInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  replaceInputTextContent(target);
  envStorage.updateVariableValue(props.variableIndex, target.textContent ?? '');
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
