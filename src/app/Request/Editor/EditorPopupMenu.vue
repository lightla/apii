<script setup lang="ts">
import {onMounted, onUnmounted, ref, nextTick, computed} from 'vue'
import {useEnvStorage, useInputStorage} from "@/storages";

import VariableEditor from './Popup/VariableEditor.vue';
import InputMenu from './Popup/InputMenu.vue';
import VariablePicker from './Popup/VariablePicker.vue';

import { useToast } from "vue-toastification";

const lastMousePosition = ref({ clientX: 0, clientY: 0 })
const lastElement = ref<HTMLElement | null>(null)
const lastInput = ref<HTMLDivElement | null>(null)

const popupRef = ref<HTMLDivElement | null>(null)
const otherKeyPressed = ref<boolean>(false) 
const isCtrlDown = ref<boolean>(false)

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();
const toast = useToast();

const currentVarName = ref<string>('');
const currentVarValue = ref<string>('');
const isDefined = ref<boolean>(false);
const searchQuery = ref<string>('');

// 'variable' | 'input' | 'selection'
const menuMode = ref<'variable' | 'input' | 'selection'>('variable');

const allVariables = computed(() => envStorage.collectEnvVariableNames());
const filteredVariables = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allVariables.value.filter(v => 
    v.toLowerCase().includes(query) && 
    (menuMode.value !== 'variable' || v !== currentVarName.value)
  );
});

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener("mousedown", onGlobalClick)
  window.addEventListener("contextmenu", onContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener("mousedown", onGlobalClick)
  window.removeEventListener("contextmenu", onContextMenu)
})

const onMouseMove = (e: MouseEvent) => {
  lastMousePosition.value = { clientX: e.clientX, clientY: e.clientY }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    if (!isCtrlDown.value) {
      isCtrlDown.value = true;
      otherKeyPressed.value = false;
    }
  } else if (isCtrlDown.value) {
    otherKeyPressed.value = true;
  }
}

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    isCtrlDown.value = false;

    if (!otherKeyPressed.value && (!popupRef.value || popupRef.value.style.display !== 'flex')) {
      const { clientX, clientY } = lastMousePosition.value;
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null

      const varEl = el?.closest('.undefined-env-variable, .defined-env-variable') as HTMLElement | null;
      if (varEl) {
        menuMode.value = 'variable';
        showPopupAt(varEl, clientX, clientY);
      }
    }
    otherKeyPressed.value = false;
  }
}

const onGlobalClick = (e : MouseEvent) => {
  if (!popupRef.value) return;

  if (popupRef.value.style.display === "flex") {
    if (!popupRef.value.contains(e.target as Node)) {
      hidePopup();
    }
  }
}

const onContextMenu = (e: MouseEvent) => {
  const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
  
  const variableEl = el?.closest('.undefined-env-variable, .defined-env-variable') as HTMLElement | null;
  const inputEl = el?.closest('.var-input-content') as HTMLElement | null;

  e.preventDefault(); 

  if (variableEl) {
    menuMode.value = 'variable';
    showPopupAt(variableEl, e.clientX, e.clientY);
  } else if (inputEl) {
    menuMode.value = 'input';
    lastInput.value = inputEl;
    showPopupAt(inputEl, e.clientX, e.clientY);
  } else {
    menuMode.value = 'input';
    lastInput.value = null;
    showPopupAt(el as HTMLElement || document.body, e.clientX, e.clientY);
  }
}

function showPopupAt(el: HTMLElement, x: number, y: number) {
  if (!popupRef.value) return;

  lastElement.value = el;
  searchQuery.value = '';
  
  if (menuMode.value === 'variable') {
    currentVarName.value = el.textContent?.trim() || "";

    const isActuallyInDefinitions = envStorage.variableDefinitions.some(v => v.name === currentVarName.value);
    isDefined.value = isActuallyInDefinitions;

    const foundVar = envStorage.definedEnvVariables.find(v => v.name === currentVarName.value);
    currentVarValue.value = foundVar?.value || '';
  }

  popupRef.value.style.display = 'flex';
  popupRef.value.style.left = `${x + 5}px`
  popupRef.value.style.top = `${y + 5}px`
}

function hidePopup() {
  if (!popupRef.value) return;
  popupRef.value.style.display = "none";
}

const onVariableValueUpdate = (newValue: string) => {
  currentVarValue.value = newValue;
  const index = envStorage.variableDefinitions.findIndex(v => v.name === currentVarName.value);
  if (index !== -1) {
    envStorage.updateVariableValue(index, newValue);
  }
}

const onVariableValueBlur = async () => {
  if (!currentVarName.value) return;

  let index = envStorage.variableDefinitions.findIndex(v => v.name === currentVarName.value);
  if (index === -1) {
    if (currentVarValue.value.trim() !== '') {
      const newId = Math.random().toString(36).substr(2, 9);
      envStorage.variableDefinitions.push({ id: newId, name: currentVarName.value });
      isDefined.value = true;
      index = envStorage.variableDefinitions.length - 1;
      envStorage.updateVariableValue(index, currentVarValue.value);
    }
  } else {
    envStorage.updateVariableValue(index, currentVarValue.value);
  }

  await nextTick();
  inputStorage.rescanHighlightAllInputs(null, { definedEnvVariables: envStorage.collectEnvVariableNames() });
}

const deleteVariable = async () => {
  const index = envStorage.variableDefinitions.findIndex(v => v.name === currentVarName.value);
  if (index !== -1) {
    envStorage.removeVariableDefinition(index);
    isDefined.value = false;
    currentVarValue.value = '';
    await nextTick();
    inputStorage.rescanHighlightAllInputs(null, { definedEnvVariables: envStorage.collectEnvVariableNames() });
    hidePopup();
  }
}

const selectVariable = (newName: string) => {
  navigator.clipboard.writeText(newName).then(() => {
    toast.success('Variable Copied!', { timeout: 2000 });
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });

  if (menuMode.value === 'variable' && lastElement.value) {
    lastElement.value.textContent = newName;
    const parentInput = lastElement.value.closest('.var-input-content') as HTMLDivElement;
    if (parentInput) {
      const inputIndex = inputStorage.trackedHighlightInputs.indexOf(parentInput);
      if (inputIndex !== -1) {
        inputStorage.highlightInput({ inputIndex, options: { definedEnvVariables: envStorage.collectEnvVariableNames() }, withCursor: false });
      }
    }
  } else if (menuMode.value === 'selection' && lastInput.value) {
    insertAtCursor(lastInput.value, newName);
    const inputIndex = inputStorage.trackedHighlightInputs.indexOf(lastInput.value);
    if (inputIndex !== -1) {
      inputStorage.highlightInput({ inputIndex, options: { definedEnvVariables: envStorage.collectEnvVariableNames() }, withCursor: true });
    }
  }
  hidePopup();
}

function insertAtCursor(el: HTMLDivElement, text: string) {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    el.textContent = (el.textContent || "") + text;
  }
}

const switchToSelection = () => {
  menuMode.value = 'selection';
}

</script>

<template>
  <div ref="popupRef" class="popup shadow-lg">
    <!-- Modular Content -->
    <VariableEditor 
      v-if="menuMode === 'variable'"
      :varName="currentVarName"
      :varValue="currentVarValue"
      :isDefined="isDefined"
      :searchQuery="searchQuery"
      :filteredVariables="filteredVariables"
      @update:varValue="onVariableValueUpdate"
      @update:searchQuery="searchQuery = $event"
      @delete="deleteVariable"
      @select="selectVariable"
      @input-blur="onVariableValueBlur"
    />
    
    <InputMenu 
      v-else-if="menuMode === 'input'"
      @select-variable="switchToSelection"
    />
    
    <VariablePicker 
      v-else-if="menuMode === 'selection'"
      :searchQuery="searchQuery"
      :filteredVariables="filteredVariables"
      @update:searchQuery="searchQuery = $event"
      @select="selectVariable"
    />
  </div>
</template>


<style lang="scss">
/* THIẾT LẬP LẠI STYLE GỐC (Calibri/Gray) */

.popup {
  position: fixed;
  z-index: 100000;
  display: none;
  flex-direction: column;
  background-color: #dddddd; 
  border: 1px solid #888888;
  border-radius: 0;
  width: 260px;
  padding: 0;
  font-family: "Calibri", Arial, sans-serif;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  overflow: hidden;
}

.popup-header {
  background-color: rgba(221, 221, 221, 1);
  padding: 8px 12px;
  border-bottom: 1px solid #888888;
  font-size: 13px;
}

.var-label {
  font-size: 12px;
  color: #444;
}

.var-name {
  font-weight: 700;
  color: var(--defined-env-variable-color);
  font-family: 'Consolas', monospace;
}

.btn-delete-var {
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
  &:hover {
    color: #dc3545;
  }
}

.popup-body {
  padding: 12px;
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 6px;
}

.popup-input {
  width: 100%;
  background-color: transparent !important;
  border: 1px solid #888888 !important;
  font-size: 13px !important;
  font-family: 'Consolas', monospace;
  color: #000;
  border-radius: 0;
  padding: 5px 8px;
  height: 28px;
  font-weight: 400 !important;
  outline: none;
  display: block;
  
  &:focus {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: #007bff !important;
  }

  &::placeholder {
    color: #888;
    font-style: italic;
  }
}

.variable-list {
  max-height: 120px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0;
  border: 1px solid #888888;
}

.variable-item {
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  font-family: monospace;
  color: #333;
  transition: all 0.1s;
  font-weight: 400 !important;

  &:hover {
    background-color: #cccccc;
    color: #000;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #888888;
  }
}

.extra-info {
  font-size: 11px;
  color: #555;
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
  -ms-overflow-style: none;
}
</style>
