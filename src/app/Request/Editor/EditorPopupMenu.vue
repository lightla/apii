<script setup lang="ts">
import {onMounted, onUnmounted, ref, nextTick} from 'vue'
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
  // Chỉ trigger khi nhấn Ctrl
  if (! event.ctrlKey || !popupRef.value || popupBlocked.value) {
    return
  }

  const { clientX, clientY } = lastMousePosition.value;
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null

  // Kiểm tra nếu phần tử dưới chuột là một biến env
  if (!(
      el?.classList.contains('undefined-env-variable')
      || el?.classList.contains('defined-env-variable')
  )) {
    return;
  }

  popupBlocked.value = true;
  lastElement.value = el;

  // Lấy text hiện tại của element (ví dụ: '{{v1}}')
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

  // Nếu click ra ngoài popup thì đóng popup
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
    // Tự động tạo định nghĩa biến nếu chưa có
    const newId = Math.random().toString(36).substr(2, 9);
    envStorage.variableDefinitions.push({
      id: newId,
      name: currentVarName.value
    });
    isDefined.value = true;
    index = envStorage.variableDefinitions.length - 1;
  }

  // Cập nhật giá trị vào Store
  if (index !== -1) {
    envStorage.updateVariableValue(index, currentVarValue.value);
  }

  // Đợi Vue cập nhật Store và Reactivity
  await nextTick();

  // Quét lại TOÀN BỘ input đang được track trên màn hình
  inputStorage.rescanHighlightAllInputs(null, {
    definedEnvVariables: envStorage.collectEnvVariableNames()
  });
}

</script>

<template>
  <div ref="popupRef" class="popup shadow-sm">
    <div class="popup-header">
      <span class="var-name">{{ currentVarName }}</span>
      <span v-if="!isDefined" class="badge bg-warning text-dark ms-2">Undefined</span>
    </div>
    <div class="popup-body">
      <div class="input-group input-group-sm">
        <span class="input-group-text">Value</span>
        <input
            :value="currentVarValue"
            class="form-control"
            placeholder="Enter value..."
            @input="onValueInput"
            @blur="onValueBlur"
            @keydown.stop
        />
      </div>
      <div class="mt-1 small text-muted">
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
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  width: 240px;
  padding: 0;
  font-family: sans-serif;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.popup-header {
  background-color: #f8f9fa;
  padding: 6px 10px;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  font-size: 0.85rem;
}

.var-name {
  font-weight: 600;
  color: var(--defined-env-variable-color);
  font-family: monospace;
}

.popup-body {
  padding: 10px;
}

.form-control {
  font-size: 0.8rem;
  &:focus {
    box-shadow: none;
    border-color: #80bdff;
  }
}

.input-group-text {
  font-size: 0.75rem;
  background-color: #f8f9fa;
}
</style>
