<script setup lang="ts">
import {onMounted, ref, watch, nextTick} from 'vue'
import type {RouteInfo} from '@/types'
import {type HighlightInputParam, type HighlightVariableOptionParam} from "@/types/variable-input.ts";
import {useEnvStorage, useInputStorage} from "@/storages/env-variables-tmp.ts";

import {useInputState} from "@/composables/input"

const { highlightInput, rescanHighlightAllInputs } = useInputState()

const emit = defineEmits<{ 'text-change': [value: string] }>()

const props = withDefaults(defineProps<{
  route: RouteInfo
  width?: string
  placeholder?: string
  value?: string
  enabledUriParam?: boolean
  enabledEnvVariable?: boolean
}>(), {
  placeholder: '',
  value: '',
  width: '100%',
  enabledUriParam: false,
  enabledEnvVariable: false,
})

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();

const variableInputRef = ref<HTMLDivElement | null>(null)
const envVariableHighlightRef = ref<HTMLSpanElement | null>(null)
const envVariableUndefinedRef = ref<HTMLSpanElement | null>(null)
const uriParamHighlightRef = ref<HTMLSpanElement | null>(null)
const lastMousePosition = ref({ clientX: 0, clientY: 0 })

const showPopup = ref<boolean>(false)
const popupText = ref<string>("")

console.log("var-input:run:");

onMounted(() => {
  if (variableInputRef.value) {
    variableInputRef.value.innerText = props.value || '';

    inputStorage.trackedHighlightInputs.push(variableInputRef.value);
    variableIndex.value = inputStorage.trackedHighlightInputs.length - 1;
  }
})

watch(() => props.value, (newVal) => {
  if (variableInputRef.value && variableInputRef.value.innerText.trim() !== (newVal ?? '').trim()) {
    variableInputRef.value.innerText = newVal || '';
    
    // trigger highlight on update
    nextTick(() => {
      const highlightOptions = <HighlightVariableOptionParam>{
        definedEnvVariables: envStorage.collectEnvVariableNames(),
      };
      highlightInput({
        inputIndex: variableIndex.value,
        options: highlightOptions,
        withCursor: false
      });
    });
  }
})

const onKeyDown = (event: KeyboardEvent) => {
  showPopup.value = false

  // if (event.ctrlKey) {
  //   const { clientX, clientY } = lastMousePosition.value
  //   const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  //
  //   if (el && (el.classList.contains('undefined-env-variable') || el.classList.contains('defined-env-variable'))) {
  //     showPopup.value = true
  //     popupText.value = el.outerHTML
  //     return
  //   }
  // }
  //
  // showPopup.value = false
}

const onKeyUp = (event: KeyboardEvent) => {
  // if (showPopup.value === true) {
  //   showPopup.value = false
  // }
}

// function onMouseOut(event: MouseEvent) {
//   // Ẩn popup khi rời span hoặc container
//   const target = event.target as HTMLElement
//   if (target.classList.contains('undefined-env-variable')) {
//     showPopup.value = false
//   }
// }

const variableIndex = ref<number>(0)

defineExpose({
  getText: () => variableInputRef.value?.innerText?.trim() ?? ''
})

const onVariableInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  emit('text-change', target.textContent ?? '')
  console.log("var-input.onInputChange:" + target.innerText + "|")

  const isEmpty = !target.textContent?.trim();

  if (isEmpty) {
    target.textContent = '';
  }

  console.log("var-input.trackedHighlightInputs.onVariableInputChange:", inputStorage.trackedHighlightInputs.length);

  console.log("var-input.definedEnvVariables:" + JSON.stringify(envStorage.definedEnvVariables));


  console.log("var-input.trackedHighlightInputs.variableIndex:", variableIndex.value)
  console.log("var-input.trackedHighlightInputs.variable:", inputStorage.trackedHighlightInputs[variableIndex.value])

  const highlightOptions = <HighlightVariableOptionParam>{
    definedEnvVariables: envStorage.collectEnvVariableNames(),
  };

  highlightInput({
    inputIndex: variableIndex.value,
    options: highlightOptions,
    withCursor: true
  });

  rescanHighlightAllInputs({
    exceptInputIndex: variableIndex.value,
    options: highlightOptions
  });
}

</script>

<template>
  <div class="var-value-input" :style="{ '--var-input-width': props.width }">
    <div
        ref="variableInputRef"
        :data-enabled-uri-param="props.enabledUriParam"
        :data-enabled-env-variable="props.enabledEnvVariable"
        class="var-input-content"
        contenteditable="true"
        :data-placeholder="props.placeholder"
        @input="onVariableInputChange"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
    ></div>
  </div>

  <div v-if="showPopup" class="popup">
    Popup content for: {{ popupText }}
  </div>
</template>

<style scoped lang="scss">
.env-variable-highlight {
  color: #007bff;
  font-weight: 600;
}

.env-variable-undefined {
  color: #8B4513;
  font-weight: 600;
}

.uri-param-highlight {
  color: #369a6e;
  font-weight: 600;
}

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

  /* Ẩn thanh cuộn trên WebKit (Chrome, Safari) */
  ::-webkit-scrollbar {
    display: none; /* Ẩn thanh cuộn */
  }

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
</style>
