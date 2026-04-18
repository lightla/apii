<script setup lang="ts">
import {ref, onMounted, watch, type Ref, computed} from 'vue'
import type { RouteInfo } from '@/types'
import {highlightEnvVariable} from "@/utils/variable-input.ts";
import {type HighlightVariableOptionParam, HighlightVariableTypeEnum} from "@/types/variable-input.ts";
import {useEnvStorage, useInputStorage} from "@/storages/env-variables-tmp.ts";

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

onMounted(() => {
  if (envValueInputRef.value) {
    envValueInputRef.value.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && envValueInputRef.value) {
        e.preventDefault()
      }
    })

    const envVariable = envStorage.definedEnvs[props.envIndex];
    envValueInputRef.value.textContent = envVariable.name;

    highlightEnvVariable(envValueInputRef.value, false)
  }
})

const onEnvNameInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  const isEmpty = !target.textContent?.trim();

  if (isEmpty) {
    target.textContent = '';
  }

  const env = envStorage.definedEnvs[props.envIndex];

  env.name = target.textContent ?? '';
  env.code = env.name.toLowerCase().replace(/\s+/g, '-');
}

</script>

<template>
  <div class="var-value-input" :style="{ '--var-input-width': props.width }">
    <div
        ref="envValueInputRef"
        class="var-input-content"
        contenteditable="true"
        :data-placeholder="props.placeholder"
        @input="onEnvNameInputChange"
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

  // Khi bên trong có phần tử được focus (như div contenteditable)
  &:focus-within {
    border-color: transparent;
    box-shadow: 0 0 0 1.3px #007bff; // "viền sáng" nhưng không đẩy layout
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

  &:empty[data-placeholder=""]:before {
    content: 'transparent'; // trick for display cursor position
    color: transparent;
  }

  &:empty:not([data-placeholder=""])::before {
    content: attr(data-placeholder);
    color: #aaa;
    opacity: 0.6;
    pointer-events: none;
  }
}

// Placeholder styling when empty
// .var-input-content:empty::before {
//  content: attr(data-placeholder);
//  color: #aaa;
//  pointer-events: none;
//  opacity: 0.6;
//}
</style>
