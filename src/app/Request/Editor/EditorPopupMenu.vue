<script setup lang="ts">
import {onMounted, ref, watch} from 'vue'
import {useEnvStorage} from "@/storages";

const props = defineProps<{
  editor: HTMLDivElement | null
}>()

const lastMousePosition = ref({ clientX: 0, clientY: 0 })
const lastElement = ref<HTMLElement | null>(null)

const popupRef = ref<HTMLDivElement | null>(null)
const popupBlocked = ref<boolean>(false)

const envStorage = useEnvStorage();
const selectedNewEnvVariable = ref<number>(-1)

const currentText = ref<string>('');

watch(() => props.editor, (newValue: HTMLDivElement | null) => {
  if (newValue) {
    newValue.tabIndex = 1;
    newValue.addEventListener('mousemove', onMouseMove)
    newValue.addEventListener('keydown', onKeyDown)
    newValue.addEventListener('keyup', onKeyUp)
    newValue.addEventListener("click", onMouseClick)
  }
})

const onMouseMove = (e: MouseEvent) => {
  lastMousePosition.value = { clientX: e.clientX, clientY: e.clientY }
}

const onKeyDown = (event: KeyboardEvent) => {
  if (! event.ctrlKey || !popupRef.value || popupBlocked.value) {
    return
  }

  popupBlocked.value = true;

  const { clientX, clientY } = lastMousePosition.value;
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null

  if (!(
      el?.classList.contains('undefined-env-variable')
      || el?.classList.contains('defined-env-variable')
  )) {
    return;
  }

  lastElement.value = el;

  // Lấy text hiện tại của element (ví dụ: '{{v1}}')
  currentText.value = el.textContent?.trim() || "";

  selectedNewEnvVariable.value = envStorage.definedEnvVariables.findIndex(
      envVar => (envVar.name === currentText.value)
  );

  popupRef.value.style.display = 'flex';
  popupRef.value.style.left = `${lastMousePosition.value.clientX + 10}px`
  popupRef.value.style.top = `${lastMousePosition.value.clientY + 10}px`
}

const onKeyUp = (event: KeyboardEvent) => {
  popupBlocked.value = false;
}

const onMouseClick = (e : MouseEvent) => {
  if (!popupRef.value) return;

  if (!popupRef.value.contains(e.target as Node)) {
    hidePopup();
  }
}

function hidePopup() {
  if (!popupRef.value) return;

  popupRef.value.style.display = "none";
}

watch(selectedNewEnvVariable, (newVal: any) => {
  if (lastElement.value && newVal >= 0 && newVal < envStorage.definedEnvVariables.length) {
    const envVariable = envStorage.definedEnvVariables[newVal];
    if (envVariable && newVal !== -1) {
      lastElement.value.textContent = envVariable.name;
    }
  }
})

const currentValue = ref('')
const selectedVariable = ref<{ name: string; isDefined: boolean } | null>(null)

const handleSelect = (variable: { name: string; isDefined: boolean }) => {
  if (lastElement.value) {
    selectedVariable.value = variable
    const match = envStorage.definedEnvVariables.find(v => v.name === variable.name)
    currentValue.value = match?.value || ''
    lastElement.value.textContent = variable.name;
  }

}

const updateValue = () => {
  if (!selectedVariable.value) return
  const index = envStorage.definedEnvVariables.findIndex(
      v => v.name === selectedVariable.value!.name
  )
  if (index === -1) {
    envStorage.addDefinedEnvVariable({
      name: selectedVariable.value.name,
      value: currentValue.value,
      isValidFormat: true
    })
    selectedVariable.value.isDefined = true
  } else {
    envStorage.definedEnvVariables[index].value = currentValue.value
  }
}

</script>

<template>
  <div ref="popupRef" class="popup">
    <!--    <PopupDropdown  :initial-value="currentText" @select="handleSelect" />-->
    <div>
      <input
          v-model="currentValue"
          class="env-variable-value"
          placeholder="Enter value"
          @input="updateValue"
      />
    </div>
  </div>
</template>


<style scoped lang="scss">
.popup {
  position: fixed;
  z-index: 999;

  display: none;
  flex-direction: column;

  justify-content: center;
  border: 1px solid black;
  background-color: #cccccc;
  width: 300px;
  height: 300px;
  padding: 10px;
}

.method-select-cover {
  position: relative;
}

.method-select {
  //width: 10%;
  //background-color: #888888;
  display: flex;
  border: 1px solid #888888;
  //border: none;
  //padding: 5px;
  padding-left: 5px;
  justify-content: center;
  height: 27px;
}

.method-select {
  width: 100%;
  height: 30px;
  padding-left: 8px;
  border: 1px solid #aaa;
}

.dropdown-list {
  position: absolute;
  top: 32px;
  left: 0;
  width: 100%;
  border: 1px solid #ccc;
  max-height: 150px;
  overflow-y: auto;
  background: white;
  z-index: 10;
}

.dropdown-list li {
  padding: 5px 10px;
  cursor: pointer;
}

.env-variable-value {
  margin-top: 10px;
  width: 100%;
  height: 30px;
  padding-left: 8px;
  border: 1px solid black;
}

</style>
