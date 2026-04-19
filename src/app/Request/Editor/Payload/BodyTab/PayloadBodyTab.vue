<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import type { RouteInfo } from '@/types'
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { 
  SquareCheck, 
  Square, 
  SquareX, 
  ShieldAlert, 
  FileUp,
  FileCode,
  Box,
  Binary,
  Eraser
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";

const props = defineProps<{ route: RouteInfo }>()
const store = useRequestParamsStorage()
const theme = ref('one-dark')

const bodyTypes = [
  { label: 'JSON', value: 'json', icon: FileCode },
  { label: 'Form Data', value: 'form-data', icon: Box },
  { label: 'Binary', value: 'binary', icon: Binary },
  { label: 'None', value: 'none', icon: SquareX },
]

// Logic Master Toggle Form Data
const isAnyFormDataEnabled = computed(() => {
  return store.formData.length > 0 && store.formData.some(i => i.enabled)
})

function toggleAllFormData() {
  const target = !isAnyFormDataEnabled.value
  store.formData.forEach(i => i.enabled = target)
}

// Logic Master Delete (Eraser) - Xóa hàng rỗng
function onMasterDeleteClick() {
  store.formData = store.formData.filter(i => i.key.trim() !== '' || i.value.trim() !== '')
}

// Logic Delete All (X) - Cạnh nút +
const isConfirmingDeleteAll = ref(false)
let confirmAllTimer: ReturnType<typeof setTimeout> | undefined

function onTrashClick() {
  if (isConfirmingDeleteAll.value) {
    store.formData = []
    isConfirmingDeleteAll.value = false
    clearTimeout(confirmAllTimer)
  } else {
    isConfirmingDeleteAll.value = true
    clearTimeout(confirmAllTimer)
    confirmAllTimer = setTimeout(() => {
      isConfirmingDeleteAll.value = false
    }, 3000)
  }
}

// Per-row delete confirm state
const confirmDeleteIndex = ref<number | null>(null)
let confirmTimer: ReturnType<typeof setTimeout> | undefined

function onDeleteClick(index: number) {
  if (confirmDeleteIndex.value === index) {
    store.removeFormData(index)
    confirmDeleteIndex.value = null
    clearTimeout(confirmTimer)
  } else {
    confirmDeleteIndex.value = index
    clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => {
      confirmDeleteIndex.value = null
    }, 3000)
  }
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    store.binaryFile = target.files[0]
  }
}

const onFormDataFileChange = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    store.formData[index].file = target.files[0]
    store.formData[index].value = target.files[0].name
  }
}

const triggerFileInput = (id: string) => {
  document.getElementById(id)?.click()
}
</script>

<template>
  <div class="body-tab-container">
    <!-- Body Type Selector -->
    <div class="body-type-toolbar">
      <div 
        v-for="type in bodyTypes" 
        :key="type.value"
        class="body-type-item"
        :class="{ 'active': store.bodyType === type.value }"
        @click="store.setBodyType(type.value as any)"
      >
        <component :is="type.icon" size="20" class="me-2" stroke-width="1.5" />
        {{ type.label }}
      </div>
    </div>

    <!-- Body Content Area -->
    <div class="body-content-area">
      <!-- JSON Editor -->
      <div v-if="store.bodyType === 'json'" class="json-editor-wrap">
        <CodeMirrorContainer2
          v-model="store.body"
          :theme="theme"
          :show-beautify="true"
          :show-copy="true"
          @update:theme="t => theme = t"
        />
      </div>

      <!-- Form Data Table -->
      <div v-else-if="store.bodyType === 'form-data'" class="form-data-wrap">
        <div class="form-data-toolbar">
          <div class="d-flex align-items-center">
            <IconSquareRoundedPlus @click="store.addFormData()" stroke-width="1" class="icon-button-add-row"/>
            
            <div @click="onTrashClick" title="Delete all form-data" class="d-flex align-items-center cursor-pointer ms-1">
              <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-trash-x" />
              <SquareX v-else stroke-width="1" class="icon-button icon-button-trash-x" />
            </div>
          </div>
        </div>
        
        <div class="table-scroll-wrapper">
          <table class="form-data-table">
            <colgroup>
              <col style="width: 40px;">
              <col style="width: 30%;">
              <col style="width: 100px;">
              <col style="width: auto;">
              <col style="width: 40px;">
            </colgroup>
            <thead>
              <tr>
                <th>
                  <div class="cell-icon-action" @click="toggleAllFormData">
                    <SquareCheck v-if="isAnyFormDataEnabled" stroke-width="1" class="icon-button-checkbox"/>
                    <Square v-else stroke-width="1" class="icon-button-checkbox"/>
                  </div>
                </th>
                <th class="text-center">Key</th>
                <th class="text-center">Type</th>
                <th class="text-center">Value</th>
                <th>
                  <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                    <Eraser stroke-width="1" class="icon-button-eraser" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in store.formData" :key="item.id">
                <td>
                  <div class="cell-icon-action" @click="item.enabled = !item.enabled">
                    <SquareCheck v-if="item.enabled" stroke-width="1" class="icon-button-checkbox" />
                    <Square v-else stroke-width="1" class="icon-button-checkbox" />
                  </div>
                </td>
                <td>
                  <div class="param-input-wrap">
                    <TrackedVariableInput
                      :route="props.route"
                      :value="item.key"
                      :enabled-env-variable="true"
                      @text-change="val => item.key = val"
                    />
                  </div>
                </td>
                <td>
                  <select v-model="item.type" class="type-select">
                    <option value="text">Text</option>
                    <option value="file">File</option>
                  </select>
                </td>
                <td>
                  <div class="param-input-wrap">
                    <template v-if="item.type === 'text'">
                      <TrackedVariableInput
                        :route="props.route"
                        :value="item.value"
                        :enabled-env-variable="true"
                        @text-change="val => item.value = val"
                      />
                    </template>
                    <template v-else>
                      <div class="file-input-wrap">
                        <button class="btn-select-file" @click="triggerFileInput('fd-file-' + index)">
                          {{ item.file ? item.file.name : 'Select File' }}
                        </button>
                        <input 
                          :id="'fd-file-' + index" 
                          type="file" 
                          class="d-none" 
                          @change="onFormDataFileChange(index, $event)"
                        />
                      </div>
                    </template>
                  </div>
                </td>
                <td>
                  <div class="cell-icon-action" @click="onDeleteClick(index)">
                    <ShieldAlert v-if="confirmDeleteIndex === index" stroke-width="1" class="icon-button icon-button-row-action" />
                    <SquareX v-else stroke-width="1" class="icon-button icon-button-row-action" />
                  </div>
                </td>
              </tr>
              <tr v-if="store.formData.length === 0">
                <td colspan="5" class="empty-row">No form-data parameters</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Binary File Upload -->
      <div v-else-if="store.bodyType === 'binary'" class="binary-wrap">
        <div class="binary-uploader" @click="triggerFileInput('binary-file-input')">
          <FileUp size="48" stroke-width="1" class="mb-3 text-muted" />
          <div v-if="store.binaryFile" class="file-info">
            <div class="file-name">{{ store.binaryFile.name }}</div>
            <div class="file-size text-muted small">{{ (store.binaryFile.size / 1024).toFixed(2) }} KB</div>
          </div>
          <div v-else class="text-muted">
            Click to select binary file
          </div>
          <input 
            id="binary-file-input" 
            type="file" 
            class="d-none" 
            @change="onFileChange"
          />
        </div>
      </div>

      <!-- None -->
      <div v-else class="none-wrap">
        <div class="text-muted">This request does not have a body</div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.body-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.body-type-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  border: var(--tab-border);
  background-color: var(--tab-bg-color);
  flex-shrink: 0;
  margin-bottom: 10px;
}

.body-type-item {
  padding: 9px 15px;
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  color: #333;
  transition: background-color 0.2s;
  
  &:hover { background-color: rgba(0, 0, 0, 0.03); }
  
  &.active {
    background-color: var(--tab-bg-color-active);
    font-weight: 500;
  }
}

.body-content-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.json-editor-wrap {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.form-data-wrap {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.form-data-toolbar {
  display: flex;
  margin-bottom: 2px;
  padding-left: 0;
  flex-shrink: 0;
}

.table-scroll-wrapper {
  overflow-y: auto;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);
  flex: 1;
}

.form-data-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-right: var(--table-border);

  th {
    height: 36px;
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    font-size: 15px;
    font-weight: 500;
    padding: 0;
    &.text-center { text-align: center !important; }
  }

  td {
    height: 40px;
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 0 8px;
    vertical-align: middle;
  }

  tr:hover td {
    background-color: rgba(0, 0, 0, 0.02);
  }

  th:first-child, td:first-child,
  th:last-child, td:last-child {
    width: 40px;
    padding: 4px;
    text-align: center;
  }

  tr:last-child td { border-bottom: none !important; }
}

.type-select {
  width: 100%;
  height: 28px;
  background: transparent;
  border: 1px solid #888888;
  padding: 2px 4px;
  font-size: 13px;
  outline: none;
}

.file-input-wrap {
  display: flex;
  align-items: center;
  height: 28px;
}

.btn-select-file {
  background: #eee;
  border: 1px solid #888888;
  padding: 0 10px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  height: 100%;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { background: #e0e0e0; }
}

.icon-button-add-row {
  width: 30px !important;
  height: 30px;
  cursor: pointer;
  &:hover { fill: #cccccc; }
}

.icon-button {
  cursor: pointer;
  fill: var(--icon-bg-color);
  transition: fill 0.2s ease;
  &:hover { fill: var(--icon-bg-color-active); }
}

.icon-button-trash-x {
  width: 30px;
  height: 30px;
}

.icon-button-checkbox, .icon-button-row-action, .icon-button-eraser {
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  fill: var(--icon-bg-color);
  transition: fill 0.2s ease;
  &:hover { fill: var(--icon-bg-color-active); }
}

.cell-icon-action {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.param-input-wrap {
  padding: 2px 0;
}

.empty-row {
  text-align: center;
  color: #aaa;
  font-size: 15px;
  height: 40px;
  vertical-align: middle;
}

.binary-wrap { padding: 30px; height: 100%; display: flex; justify-content: center; align-items: center; }
.binary-uploader {
  width: 100%; max-width: 400px; height: 200px; border: 2px dashed #ccc;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  cursor: pointer; border-radius: 8px; &:hover { border-color: #888; background-color: rgba(0,0,0,0.02); }
}

.none-wrap {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
