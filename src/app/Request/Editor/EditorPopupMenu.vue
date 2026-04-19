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
  <div ref="popupRef" class="popup">
    <div class="popup-header">
      <div class="d-flex align-items-center w-100">
        <span class="var-label me-2">Variable:</span>
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

      <div class="mt-2 pt-2 extra-info">
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
  background-color: #dddddd; 
  border: 1px solid #888888;
  border-radius: 0;
  width: 260px;
  padding: 0;
  font-family: "Calibri", Arial, sans-serif;
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

.popup-body {
  padding: 12px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #555;
  margin-bottom: 6px;
}

.value-input {
  background-color: transparent !important;
  border: 1px solid #888888 !important;
  font-size: 13px;
  font-family: 'Consolas', monospace;
  color: #000;
  border-radius: 0;
  padding: 5px 8px;
  height: 28px;
  
  &:focus {
    background-color: rgba(255, 255, 255, 0.05) !important;
    border-color: #007bff !important;
    box-shadow: none !important;
  }

  &::placeholder {
    color: #888;
    font-style: italic;
  }
}

.search-input {
  background-color: transparent !important;
  border: 1px solid #888888 !important;
  font-size: 12px;
  border-radius: 0;
  color: #000;
  height: 26px;
  
  &:focus {
    background-color: rgba(255, 255, 255, 0.05) !important;
    box-shadow: none !important;
    border-color: #007bff !important;
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
  font-size: 12px;
  cursor: pointer;
  font-family: monospace;
  color: #333;
  transition: all 0.1s;

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
