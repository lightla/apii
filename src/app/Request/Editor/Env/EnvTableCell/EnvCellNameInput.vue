<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {highlightEnvVariable} from "@/utils/variable-input.ts";
import {useEnvStorage} from "@/storages/env-variables-tmp.ts";

const props = withDefaults(defineProps<{
  width?: string
  placeholder?: string,
  envIndex: number
}>(), {
  placeholder: '',
  width: '100%'
})

const envStorage = useEnvStorage();
const envValueInputRef = ref<HTMLDivElement | null>(null)
const previousValidNameRef = ref('')
const previousValidCodeRef = ref('')
const hasError = ref(false)

const toEnvCode = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, '-')
}

const isDuplicateCode = (code: string): boolean => {
  return envStorage.definedEnvs.some((env, index) => {
    return index !== props.envIndex && env.code === code
  })
}

const onFocusEnvNameInput = () => {
  const env = envStorage.definedEnvs[props.envIndex]
  if (!env) return

  previousValidNameRef.value = env.name
  previousValidCodeRef.value = env.code
  hasError.value = false
}

onMounted(() => {
  if (envValueInputRef.value) {
    envValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envValueInputRef.value) {
        e.preventDefault()
        envValueInputRef.value.blur()
      }
    })

    const envVariable = envStorage.definedEnvs[props.envIndex];
    if (envVariable) {
      envValueInputRef.value.textContent = envVariable.name;
    }

    highlightEnvVariable(envValueInputRef.value, false)
  }
})

const onEnvNameInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const nextName = target.textContent ?? ''
  const nextCode = toEnvCode(nextName)
  
  // Kiểm tra lỗi "nhẹ" để hiển thị UI (viền đỏ), không hiện alert
  hasError.value = nextCode === 'default' || isDuplicateCode(nextCode)
}

const onBlurEnvNameInput = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const env = envStorage.definedEnvs[props.envIndex]
  if (!env) return

  const nextName = target.textContent?.trim() ?? ''
  const nextCode = toEnvCode(nextName)

  // Nếu rỗng hoặc trùng lặp thì revert về giá trị cũ
  if (!nextCode || nextCode === 'default' || isDuplicateCode(nextCode)) {
    env.name = previousValidNameRef.value
    env.code = previousValidCodeRef.value
    target.textContent = previousValidNameRef.value
    hasError.value = false
    return
  }

  // Nếu hợp lệ thì mới cập nhật store
  env.name = nextName
  env.code = nextCode
  previousValidNameRef.value = env.name
  previousValidCodeRef.value = env.code
  hasError.value = false
  void envStorage.persistDefinedEnvs()
}

</script>

<template>
  <div 
    class="var-value-input" 
    :class="{ 'has-error': hasError }"
    :style="{ '--var-input-width': props.width }"
  >
    <div
        ref="envValueInputRef"
        class="var-input-content"
        contenteditable="true"
        :data-placeholder="props.placeholder"
        @input="onEnvNameInputChange"
        @focus="onFocusEnvNameInput"
        @blur="onBlurEnvNameInput"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.var-value-input {
  display: flex;
  background-color: whitesmoke;
  width: var(--var-input-width);
  border: 1px solid black;
  padding: 0 10px;
  height: 30px;
  justify-content: center;
  align-items: center;
  transition: border-color 0.2s, box-shadow 0.2s;

  &.has-error {
    border-color: #dc3545 !important;
    box-shadow: 0 0 0 1.3px rgba(220, 53, 69, 0.5) !important;
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
