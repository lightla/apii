<script setup lang="ts">
import {onMounted, onUnmounted, ref, nextTick, computed} from 'vue'
import {useEnvStorage, useInputStorage} from "@/storages";

const lastMousePosition = ref({ clientX: 0, clientY: 0 })
const lastElement = ref<HTMLElement | null>(null)

const popupRef = ref<HTMLDivElement | null>(null)
const popupBlocked = ref<boolean>(false)

const envStorage = useEnvStorage();
const inputStorage = useInputStorage();

const currentVarName = ref<string>('');
const currentVarValue = ref<string>('');
const isDefined = ref<boolean>(false);
const searchQuery = ref<string>('');

const allVariables = computed(() => envStorage.collectEnvVariableNames());
const filteredVariables = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return allVariables.value.filter(v => v.toLowerCase().includes(query) && v !== currentVarName.value);
});

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener("mousedown", onGlobalClick)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener("mousedown", onGlobalClick)
})

const onMouseMove = (e: MouseEvent) => {
  lastMousePosition.value = { clientX: e.clientX, clientY: e.clientY }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (! event.ctrlKey || !popupRef.value || popupBlocked.value) {
    return
  }

  const { clientX, clientY } = lastMousePosition.value;
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null

  if (!(
      el?.classList.contains('undefined-env-variable')
      || el?.classList.contains('defined-env-variable')
  )) {
    return;
  }

  popupBlocked.value = true;
  lastElement.value = el;
  searchQuery.value = '';

  currentVarName.value = el.textContent?.trim() || "";

  const foundVar = envStorage.definedEnvVariables.find(v => v.name === currentVarName.value);
  if (foundVar) {
    currentVarValue.value = foundVar.value;
    isDefined.value = true;
  } else {
    currentVarValue.value = '';
    isDefined.value = false;
  }

  popupRef.value.style.display = 'flex';
  popupRef.value.style.left = `${lastMousePosition.value.clientX + 5}px`
  popupRef.value.style.top = `${lastMousePosition.value.clientY + 5}px`
}

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Control') {
    popupBlocked.value = false;
  }
}

const onGlobalClick = (e : MouseEvent) => {
  if (!popupRef.value || popupRef.value.style.display === "none") return;

  if (!popupRef.value.contains(e.target as Node)) {
    hidePopup();
  }
}

function hidePopup() {
  if (!popupRef.value) return;
  popupRef.value.style.display = "none";
  popupBlocked.value = false;
}

const onValueInput = (e: Event) => {
  const newValue = (e.target as HTMLInputElement).value;
  currentVarValue.value = newValue;

  const index = envStorage.variableDefinitions.findIndex(v => v.name === currentVarName.value);
  if (index !== -1) {
    envStorage.updateVariableValue(index, newValue);
  }
}

const onValueBlur = async () => {
  if (!currentVarName.value) return;

  let index = envStorage.variableDefinitions.findIndex(v => v.name === currentVarName.value);

  if (index === -1) {
    const newId = Math.random().toString(36).substr(2, 9);
    envStorage.variableDefinitions.push({
      id: newId,
      name: currentVarName.value
    });
    isDefined.value = true;
    index = envStorage.variableDefinitions.length - 1;
  }

  if (index !== -1) {
    envStorage.updateVariableValue(index, currentVarValue.value);
  }

  await nextTick();

  inputStorage.rescanHighlightAllInputs(null, {
    definedEnvVariables: envStorage.collectEnvVariableNames()
  });
}

const selectVariable = (newName: string) => {
  if (lastElement.value) {
    lastElement.value.textContent = newName;
    
    // Tìm thẻ cha contenteditable để trigger highlight lại cho riêng ô input này
    const parentInput = lastElement.value.closest('.var-input-content') as HTMLDivElement;
    if (parentInput) {
      const inputIndex = inputStorage.trackedHighlightInputs.indexOf(parentInput);
      if (inputIndex !== -1) {
        inputStorage.highlightInput({
          inputIndex,
          options: { definedEnvVariables: envStorage.collectEnvVariableNames() },
          withCursor: false
        });
      }
    }
    hidePopup();
  }
}

</script>

<template>
  <div ref="popupRef" class="popup shadow-lg">
    <div class="popup-header">
      <div class="d-flex align-items-center w-100">
        <span class="var-label text-muted me-2">Variable:</span>
        <span class="var-name">{{ currentVarName }}</span>
        <span v-if="!isDefined" class="badge bg-warning text-dark ms-auto" style="font-size: 0.65rem">Undefined</span>
      </div>
    </div>
    
    <div class="popup-body">
      <!-- Edit Value Section -->
      <div class="section-label">Current Value</div>
      <div class="input-group input-group-sm mb-3">
        <input
            :value="currentVarValue"
            class="form-control value-input"
            placeholder="No value set..."
            @input="onValueInput"
            @blur="onValueBlur"
            @keydown.stop
        />
      </div>

      <!-- Switch Variable Section -->
      <div class="section-label d-flex justify-content-between">
        <span>Switch To...</span>
        <span class="text-muted" style="font-size: 0.65rem">{{ filteredVariables.length }} found</span>
      </div>
      <div class="search-box mb-2">
        <input 
            v-model="searchQuery" 
            class="form-control form-control-sm search-input" 
            placeholder="Search variables..." 
            @keydown.stop
        />
      </div>
      
      <div class="variable-list custom-scrollbar">
        <div 
            v-for="v in filteredVariables" 
            :key="v" 
            class="variable-item"
            @click="selectVariable(v)"
        >
          {{ v }}
        </div>
        <div v-if="filteredVariables.length === 0" class="text-center p-2 text-muted small">
          No other variables
        </div>
      </div>

      <div class="mt-2 pt-2 border-top extra-info">
        Env: <span class="fw-bold">{{ envStorage.selectedEnvCode }}</span>
      </div>
    </div>
  </div>
</template>


<style scoped lang="scss">
.popup {
  position: fixed;
  z-index: 100000;
  display: none;
  flex-direction: column;
  background-color: #f0f0f0; /* Màu xám dịu */
  border: 1px solid #bcbcbc;
  border-radius: 6px;
  width: 260px;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
}

.popup-header {
  background-color: #e0e0e0; /* Màu xám đậm hơn một chút cho header */
  padding: 8px 12px;
  border-bottom: 1px solid #bcbcbc;
  font-size: 0.85rem;
}

.var-label {
  font-size: 0.75rem;
}

.var-name {
  font-weight: 700;
  color: #0056b3;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.popup-body {
  padding: 12px;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.value-input {
  background-color: #ffffff;
  border: 1px solid #bbb;
  font-size: 0.85rem;
  font-family: 'Consolas', monospace;
  
  &:focus {
    background-color: #fff;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
  }
}

.search-input {
  background-color: #e8e8e8;
  border: 1px solid #ccc;
  font-size: 0.75rem;
  border-radius: 4px;
  
  &:focus {
    background-color: #fff;
  }
}

.variable-list {
  max-height: 120px;
  overflow-y: auto;
  background: #e8e8e8;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.variable-item {
  padding: 4px 10px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: monospace;
  color: #333;
  transition: all 0.1s;

  &:hover {
    background-color: #007bff;
    color: white;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #ddd;
  }
}

.extra-info {
  font-size: 0.7rem;
  color: #777;
}

.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: #bbb;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
}

.shadow-lg {
  box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
}
</style>
