<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import type { RouteInfo } from '@/types'
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { usePresetStorage } from '@/storages/presets.ts'
import { 
  SquareCheck, 
  Square, 
  SquareX, 
  ShieldAlert, 
  FileUp,
  FileCode,
  Box,
  Binary,
  Eraser,
  Lock,
  Plus,
  ChevronDown
} from "lucide-vue-next";
import { IconSquareRoundedPlus } from "@tabler/icons-vue";

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()
const store = useRequestParamsStorage()
const presetStore = usePresetStorage()
const theme = ref('one-dark')

const showPresetDropdown = ref(false)

// Active presets for display (filtered by current body type)
const activePresets = computed(() => {
  return presetStore.bodyPresets.filter(p => {
    if (!store.selectedBodyPresetIds.includes(p.id)) return false;
    const normalizedType = p.type?.replace('body-', '');
    return normalizedType === store.bodyType;
  })
})

const filteredBodyPresets = computed(() => {
  return presetStore.bodyPresets.filter(p => {
    const normalizedType = p.type?.replace('body-', '');
    return normalizedType === store.bodyType;
  })
})

const togglePreset = (id: string) => {
  const current = [...store.selectedBodyPresetIds]
  const idx = current.indexOf(id)
  if (idx === -1) current.push(id)
  else current.splice(idx, 1)
  
  store.selectedBodyPresetIds = current
  store.syncManagedBody()
  store.saveToStorage(props.storageKey ?? props.route.id)
}

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

const activeSelectIndex = ref<number | null>(null);
const activeSelectItem = ref<any>(null);
const dropdownStyle = ref<Record<string, string>>({ top: '0px', left: '0px', width: '0px' });

const closeCustomSelect = () => {
  activeSelectIndex.value = null;
  activeSelectItem.value = null;
}

onMounted(() => {
  window.addEventListener('click', closeCustomSelect);
  // Cập nhật lại vị trí khi scroll nếu cần thiết
  window.addEventListener('scroll', closeCustomSelect, true); // true để bắt scroll trên mọi element
})

onUnmounted(() => {
  window.removeEventListener('click', closeCustomSelect);
  window.removeEventListener('scroll', closeCustomSelect, true);
})

const toggleSelect = (index: number, item: any, event: Event) => {
  event.stopPropagation();
  if (activeSelectIndex.value === index) {
    closeCustomSelect();
  } else {
    activeSelectIndex.value = index;
    activeSelectItem.value = item;
    
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    // Tính toán xem có đủ chỗ bên dưới không (cần khoảng 70px cho 2 options)
    const spaceBelow = window.innerHeight - rect.bottom;
    
    if (spaceBelow < 70) {
      // Mở ngược lên trên
      dropdownStyle.value = {
        bottom: `${window.innerHeight - rect.top + 2}px`,
        top: 'auto',
        left: `${rect.left}px`,
        width: `${rect.width}px`
      };
    } else {
      // Mở xuống dưới bình thường
      dropdownStyle.value = {
        top: `${rect.bottom + 2}px`,
        bottom: 'auto',
        left: `${rect.left}px`,
        width: `${rect.width}px`
      };
    }
  }
}

const selectType = (type: string) => {
  if (activeSelectItem.value) {
    activeSelectItem.value.type = type;
  }
  closeCustomSelect();
}

const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    store.binaryFile = target.files[0]
    store.selectedBodyPresetId = null
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
        <component :is="type.icon" :size="20" class="me-2" :stroke-width="1.5" />
        {{ type.label }}
      </div>

      <!-- Active Presets with Inline Selector -->
      <div class="ms-auto d-flex align-items-center flex-shrink-0 gap-1 overflow-visible position-relative pe-2" v-if="store.bodyType !== 'none'">
        <span v-if="activePresets.length" class="preset-label">ACTIVE:</span>
        <div v-for="p in activePresets" :key="p.id" class="active-preset-tag" :title="p.name">
          {{ p.name }}
        </div>
        
        <div class="preset-selector-wrap ms-1" v-click-outside="() => showPresetDropdown = false">
          <button class="btn-add-preset" @click.stop="showPresetDropdown = !showPresetDropdown" title="Toggle Presets">
            <Plus :size="14" stroke-width="3" />
            <ChevronDown :size="10" stroke-width="2" class="ms-1" />
          </button>
          
          <div v-if="showPresetDropdown" class="preset-dropdown-menu">
            <div class="dropdown-header">Select {{ store.bodyType }} Presets</div>
            <div class="dropdown-list">
              <div 
                v-for="p in filteredBodyPresets" 
                :key="p.id" 
                class="dropdown-item" 
                @click="togglePreset(p.id)"
              >
                <SquareCheck v-if="store.selectedBodyPresetIds.includes(p.id)" :size="16" class="text-primary me-2" />
                <Square v-else :size="16" class="text-muted me-2" />
                <span class="item-name">{{ p.name }}</span>
              </div>
              <div v-if="!filteredBodyPresets.length" class="dropdown-empty">No {{ store.bodyType }} presets</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Body Content Area -->
    <div class="body-content-area">
      <!-- None -->
      <div v-if="store.bodyType === 'none'" class="no-body-wrapper">
        <div class="no-body-content">
          <p class="mb-0 text-muted">This request does not have a body</p>
        </div>
      </div>
      
      <!-- JSON Editor -->
      <div v-else-if="store.bodyType === 'json'" class="json-editor-wrap">
        <CodeMirrorContainer2
          v-model="store.body"
          :theme="theme"
          :show-beautify="true"
          :show-copy="true"
          @update:theme="onThemeUpdate"
        />
      </div>

      <!-- Form Data Table -->
      <div v-else-if="store.bodyType === 'form-data'" class="form-data-wrap">
        <div class="form-data-toolbar">
          <div class="d-flex align-items-center">
            <span class="form-data-toolbar-title">Form Data Parameters</span>
            <IconSquareRoundedPlus @click="store.addFormData()" :stroke-width="1" class="icon-button-add-row ms-3"/>
            
            <div @click="onTrashClick" title="Delete all form-data" class="d-flex align-items-center cursor-pointer ms-1">
              <ShieldAlert v-if="isConfirmingDeleteAll" :stroke-width="1" class="icon-button icon-button-trash-x" />
              <SquareX v-else :stroke-width="1" class="icon-button icon-button-trash-x" />
            </div>
          </div>
        </div>
        
        <div class="table-scroll-wrapper">
          <table class="form-data-table">
            <colgroup>
              <col style="width: 40px;" />
              <col style="width: 30%;" />
              <col style="width: 100px;" />
              <col style="width: auto;" />
              <col style="width: 40px;" />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <div class="cell-icon-action" @click="toggleAllFormData">
                    <SquareCheck v-if="isAnyFormDataEnabled" :stroke-width="1" class="icon-button-checkbox"/>
                    <Square v-else :stroke-width="1" class="icon-button-checkbox"/>
                  </div>
                </th>
                <th class="text-center">Key</th>
                <th class="text-center">Type</th>
                <th class="text-center">Value</th>
                <th>
                  <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                    <Eraser :stroke-width="1" class="icon-button-eraser" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in store.formData" :key="item.id" :class="{ 'is-preset': item.isPreset }">
                <td>
                  <div class="cell-icon-action" @click="item.enabled = !item.enabled">
                    <template v-if="false">
                       <!-- Removed special disabled state -->
                    </template>
                    <template v-else>
                       <SquareCheck v-if="item.enabled" :stroke-width="1" class="icon-button-checkbox" />
                       <Square v-else :stroke-width="1" class="icon-button-checkbox" />
                    </template>
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
                  <div class="custom-type-select" :class="{ 'is-active': activeSelectIndex === index }">
                    <div class="type-select-trigger" @click="toggleSelect(index, item, $event)">
                      <span>{{ item.type === 'text' ? 'Text' : 'File' }}</span>
                      <span class="dropdown-arrow">▼</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="param-input-wrap">
                    <div v-if="item.type === 'text'">
                      <TrackedVariableInput
                        :route="props.route"
                        :value="item.value"
                        :enabled-env-variable="true"
                        @text-change="val => item.value = val"
                      />
                    </div>
                    <div v-else>
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
                    </div>
                  </div>
                </td>
                <td>
                  <div class="cell-icon-action" @click="onDeleteClick(index)">
                    <ShieldAlert v-if="confirmDeleteIndex === index" :stroke-width="1" class="icon-button icon-button-row-action" />
                    <SquareX v-else :stroke-width="1" class="icon-button icon-button-row-action" />
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
          <FileUp :size="40" :stroke-width="1" class="mb-3 text-muted" />
          <div v-if="store.binaryFile" class="file-info">
            <div class="file-name">{{ store.binaryFile.name }}</div>
            <div class="file-size text-muted small">{{ (store.binaryFile.size / 1024).toFixed(2) }} KB</div>
          </div>
          <div v-else-if="activePresets.length > 0 && activePresets[0].value" class="file-info">
            <div class="file-name">{{ activePresets[0].value.split(' (')[0] }}</div>
            <div class="file-size text-muted small">{{ activePresets[0].value.split(' (')[1]?.replace(')', '') }}</div>
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

  <Teleport to="body">
    <div class="type-select-dropdown" v-if="activeSelectIndex !== null" :style="dropdownStyle">
      <div class="type-select-option" @click="selectType('text')">Text</div>
      <div class="type-select-option" @click="selectType('file')">File</div>
    </div>
  </Teleport>
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
  font-size: 14px; /* Giảm từ 15px xuống 14px */
  display: flex;
  align-items: center;
  color: #333;
  transition: background-color 0.2s;
  
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
  background-color: #f4f4f4;
}

.json-editor-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-color: #f4f4f4;
}

.form-data-wrap {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 8px;
}

.form-data-toolbar {
  display: flex;
  margin-bottom: 2px;
  padding-left: 0;
  flex-shrink: 0;
}

.form-data-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
}

.table-scroll-wrapper {
  min-height: 0;
  height: fit-content;
  overflow-y: auto;
  @include elements.scrollbar-hidden;
  border-bottom: var(--table-border);
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
    text-align: center !important;
    vertical-align: middle !important;
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

.custom-type-select {
  position: relative;
  width: 100%;
  height: 28px;
  font-size: 13px;
  color: #333;
  
  &.is-active {
    z-index: 1000;
  }
}

.type-select-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  background-color: transparent;
  border: 1px solid #888888;
  padding: 2px 8px;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background-color: #e2e2e2; /* Tăng độ đậm để thấy rõ hiệu ứng hover khi chưa chọn */
  }

  &.is-disabled {
    cursor: not-allowed;
    background-color: transparent !important;
    border-color: #aaa;
    color: #666;
  }
}

.dropdown-arrow {
  font-size: 9px;
  color: #666;
}

.type-select-dropdown {
  position: fixed; /* Chuyển từ absolute sang fixed */
  background-color: #f4f4f4;
  border: 1px solid #888888;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 100000; /* Nâng z-index lên mức cao nhất */
  font-family: "Calibri", Arial, sans-serif;
  font-size: 13px;
  color: #333;
}

.type-select-option {
  padding: 6px 8px;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background-color: #cccccc;
    color: #000;
  }
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
  &:hover { fill: var(--icon-bg-color-active); }
  
  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(1);
  }
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

.binary-wrap { padding: 20px; height: 100%; display: flex; justify-content: center; align-items: center; }
.binary-uploader {
  width: 100%; max-width: 400px; height: 160px; border: 2px dashed #ccc;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  cursor: pointer; border-radius: 8px; &:hover { border-color: #888; background-color: rgba(0,0,0,0.02); }
}

.active-preset-tag {
  background-color: #f0f7ff;
  border: 1px solid #007bff;
  color: #007bff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.preset-label-none {
  font-size: 11px;
  color: #aaa;
  font-weight: 500;
}

.preset-selector-wrap {
  position: relative;
}

.btn-add-preset {
  background: #eee;
  border: 1px solid #888;
  height: 24px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  cursor: pointer;
  border-radius: 2px;
  color: #333;
  &:hover { background: #ddd; }
}

.preset-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background: white;
  border: 1px solid #888;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 4px;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: 6px 10px;
  background: #f4f4f4;
  border-bottom: 1px solid #ddd;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #666;
}

.dropdown-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  &:hover { background: #f0f7ff; }
  
  .item-name {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.dropdown-empty {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.text-primary { color: #007bff; }

.form-data-table {
  tr.is-preset, tr.is-managed {
    background-color: #f0f7ff;
  }
}
.no-body-wrapper {
  padding: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-body-content {
  width: 100%;
  max-width: 400px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border: var(--table-border);
  border-radius: 8px;
  font-size: 13px;
}
</style>
