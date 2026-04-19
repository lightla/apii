<script setup lang="ts">
import {onMounted, ref, watch, nextTick} from 'vue'
import type {RouteInfo} from '@/types'
import {type HighlightVariableOptionParam} from "@/types/variable-input.ts";
import {useEnvStorage, useInputStorage} from "@/storages/env-variables-tmp.ts";

import {useInputState} from "@/composables/input"

const { highlightInput, rescanHighlightAllInputs } = useInputState()

const emit = defineEmits<{ 'text-change': [value: string], 'enter': [value: HTMLDivElement] }>()

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
const variableIndex = ref<number>(0)
const showPopup = ref<boolean>(false)
const popupText = ref<string>("")

const triggerHighlight = (withCursor: boolean) => {
  if (variableIndex.value === undefined || variableIndex.value === null) return;
  
  const highlightOptions = <HighlightVariableOptionParam>{
    definedEnvVariables: envStorage.collectEnvVariableNames(),
  };
  highlightInput({
    inputIndex: variableIndex.value,
    options: highlightOptions,
    withCursor: withCursor
  });
}

onMounted(() => {
  if (variableInputRef.value) {
    variableInputRef.value.innerText = props.value || '';

    inputStorage.trackedHighlightInputs.push(variableInputRef.value);
    variableIndex.value = inputStorage.trackedHighlightInputs.length - 1;

    // trigger highlight on mount
    nextTick(() => {
      triggerHighlight(false);
    });
  }
})

watch(() => props.value, (newVal) => {
  if (variableInputRef.value && variableInputRef.value.innerText.trim() !== (newVal ?? '').trim()) {
    variableInputRef.value.innerText = newVal || '';
    
    // trigger highlight on update
    nextTick(() => {
      triggerHighlight(false);
    });
  }
}, { immediate: true })

const onKeyDown = (event: KeyboardEvent) => {
  showPopup.value = false
  if (event.key === 'Enter') {
    if (variableInputRef.value) {
      emit('enter', variableInputRef.value)
    }
  }
}

const onKeyUp = (event: KeyboardEvent) => {
}

defineExpose({
  getText: () => variableInputRef.value?.innerText?.trim() ?? ''
})

const onVariableInputChange = (event: Event): void => {
  const target = event.target as HTMLDivElement
  emit('text-change', target.textContent ?? '')

  const isEmpty = !target.textContent?.trim();
  if (isEmpty) {
    target.textContent = '';
  }

  triggerHighlight(true);

  const highlightOptions = <HighlightVariableOptionParam>{
    definedEnvVariables: envStorage.collectEnvVariableNames(),
  };

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
/* Chỉ highlight khi được cho phép thông qua thuộc tính data-enabled */
div[data-enabled-env-variable="true"] :deep(.defined-env-variable) {
  color: var(--defined-env-variable-color) !important;
  font-weight: 400 !important;
}

div[data-enabled-env-variable="true"] :deep(.undefined-env-variable) {
  color: var(--undefined-env-variable-color) !important;
  font-weight: 400 !important;
}

div[data-enabled-uri-param="true"] :deep(.defined-uri-param) {
  color: var(--defined-uri-param) !important;
  font-weight: 400 !important;
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

  &:focus-within {
    border-color: transparent;
    box-shadow: 0 0 0 1.3px #007bff;
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
  white-space: nowrap;

  &::-webkit-scrollbar {
    display: none;
  }

  scrollbar-width: none;
  scroll-behavior: smooth;

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
