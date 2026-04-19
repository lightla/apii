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
const previousValidNameRef = ref('')
const hasError = ref(false)

const isDuplicateVariableName = (name: string): boolean => {
  const trimmedName = name.trim();
  if (!trimmedName) return false;
  return envStorage.variableDefinitions.some((v, index) => {
    return index !== props.variableIndex && v.name.trim() === trimmedName;
  });
}

onMounted(() => {
  if (envVariableValueInputRef.value) {
    envVariableValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envVariableValueInputRef.value) {
        e.preventDefault()
        envVariableValueInputRef.value.blur()
      }
    })

    const envVariable = envStorage.variableDefinitions[props.variableIndex];
    if (envVariable) {
      envVariableValueInputRef.value.textContent = envVariable.name;
      previousValidNameRef.value = envVariable.name;
    }

    highlightEnvVariable(envVariableValueInputRef.value, false)
  }
})

const onFocusEnvNameInput = () => {
  const varDef = envStorage.variableDefinitions[props.variableIndex]
  if (varDef) {
    previousValidNameRef.value = varDef.name
  }
  hasError.value = false
}

const onEnvValueInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const nextName = target.textContent ?? '';
  
  // Hiển thị lỗi đỏ khi đang gõ nếu trùng
  hasError.value = isDuplicateVariableName(nextName);

  // Cập nhật tạm thời vào store để các logic khác nhận diện (không persist ở đây nếu muốn chặt chẽ hơn, nhưng để đồng bộ tôi vẫn giữ update)
  envStorage.updateVariableName(props.variableIndex, nextName);

  highlightEnvVariable(target, true)
}

const onBlurEnvNameInput = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const currentName = target.textContent?.trim() ?? ''

  // Nếu rỗng hoặc trùng lặp thì revert về giá trị cũ y hệt Env
  if (!currentName || isDuplicateVariableName(currentName)) {
    envStorage.updateVariableName(props.variableIndex, previousValidNameRef.value);
    target.textContent = previousValidNameRef.value;
    hasError.value = false;
    highlightEnvVariable(target, false);
    return;
  }

  // Nếu hợp lệ thì chính thức ghi nhận
  previousValidNameRef.value = currentName;
  hasError.value = false;
  
  const highlightOptions = <HighlightVariableOptionParam>{
    definedEnvVariables: envStorage.collectEnvVariableNames(),
  };
  inputStorage.rescanHighlightAllInputs(null, highlightOptions);
}

</script>

<template>
  <div 
    class="var-value-input" 
    :class="{ 'has-error': hasError }"
    :style="{ '--var-input-width': props.width }"
  >
    <div
        ref="envVariableValueInputRef"
        class="var-input-content"
        contenteditable="true"
        :data-placeholder="props.placeholder"
        @input="onEnvValueInputChange"
        @focus="onFocusEnvNameInput"
        @blur="onBlurEnvNameInput"
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
  height: 30px; // Đảm bảo đồng bộ chiều cao với Env input
  display: flex;
  align-items: center;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.has-error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 1.3px rgba(220, 53, 69, 0.5) !important; // Chỉnh lại 1.3px cho mỏng giống Env
  }

  &:focus-within:not(.has-error) {
    border-color: transparent;
    box-shadow: 0 0 0 1.3px #007bff;
  }
}

.var-input-content {
  height: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  outline: none;
  width: 100%;
  max-width: 100%;
  overflow-x: scroll;
  white-space: nowrap;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }

  &:empty[data-placeholder=""]:before {
    content: 'transparent';
    color: transparent;
  }

  &:empty:not([data-placeholder=""])::before {
    content: attr(data-placeholder);
    color: #aaa;
    opacity: 0.6;
    pointer-events: none;
  }
}
</style>
