<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { Save, FileUp, SquareCheck, Square, SquareX, ShieldAlert, Eraser, Edit2, Trash2, X } from 'lucide-vue-next';
import { IconSquareRoundedPlus } from "@tabler/icons-vue"
import type { RouteInfo } from '@/types'
import { usePresetStorage } from '@/storages/presets';
import { useRequestParamsStorage } from '@/storages/payload';
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue';
import TrackedVariableInput from '@/app/Generals/TrackedVariableInput.vue';

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()
const store = useRequestParamsStorage();
const presetStore = usePresetStorage();
const activeCategory = ref<'headers' | 'query' | 'body' | 'file'>('headers');
const theme = ref('eclipse');

// Editor State
const editingPresetId = ref<string | null>(null);
const editName = ref('');
const editType = ref<'json' | 'form-data'>('json');
const editItems = ref<{ key: string; value: string; description: string; enabled: boolean; type?: 'text' | 'file' }[]>([]);
const editJson = ref('');
const editFileInput = ref<HTMLInputElement | null>(null);
const editFileData = ref<File | null>(null);
const isFormData = computed(() => activeCategory.value === 'body' && editType.value === 'form-data');

const onThemeUpdate = (t: string) => {
  theme.value = t;
};

const startEdit = (category: 'headers' | 'query' | 'body' | 'file', preset?: any) => {
    activeCategory.value = category;
    if (preset) {
        editingPresetId.value = preset.id;
        editName.value = preset.name;
        if (category === 'body') {
            editType.value = (preset.type as any) || 'json';
            if (editType.value === 'json') editJson.value = preset.json || preset.value || '';
            else if (editType.value === 'form-data') editItems.value = JSON.parse(JSON.stringify(preset.formData || preset.items || [])).map((i: any) => ({ ...i, enabled: i.enabled ?? true, type: i.type || 'text' }));
        } else if (category === 'file') {
            editFileData.value = null;
        } else {
            editItems.value = JSON.parse(JSON.stringify(preset.items || [])).map((i: any) => ({ ...i, enabled: i.enabled ?? true }));
        }
    } else {
        editingPresetId.value = 'new';
        editName.value = '';
        editItems.value = [
            { key: '', value: '', description: '', enabled: true, type: category === 'body' ? 'text' : undefined },
            { key: '', value: '', description: '', enabled: true, type: category === 'body' ? 'text' : undefined },
            { key: '', value: '', description: '', enabled: true, type: category === 'body' ? 'text' : undefined }
        ];
        editJson.value = '';
        editFileData.value = null;
        if (category === 'body') editType.value = 'json';
    }
};

const cancelEdit = () => {
    editingPresetId.value = null;
};

const saveEdit = async () => {
    if (!editName.value.trim()) return;

    if (activeCategory.value === 'file') {
        const file = editFileData.value;
        if (!file) return;
        const presetMeta = {
            name: editName.value,
            fileName: file.name,
            fileSize: (file.size / 1024).toFixed(1) + ' KB',
            mimeType: file.type || 'application/octet-stream',
        };
        if (editingPresetId.value === 'new') {
            await presetStore.addFilePreset(presetMeta, file);
        } else if (editingPresetId.value) {
            presetStore.updatePreset(editingPresetId.value, presetMeta);
            const { saveFile } = await import('@/storages/file-db');
            await saveFile(editingPresetId.value, file);
        }
        editingPresetId.value = null;
        return;
    }

    const presetData: any = {
        name: editName.value,
        category: activeCategory.value,
    };

    if (activeCategory.value === 'body') {
        presetData.type = editType.value;
        if (editType.value === 'json') {
            presetData.json = editJson.value;
            presetData.value = editJson.value;
        } else {
            presetData.formData = editItems.value.filter(i => i.key.trim() || i.value.trim()).map(i => ({ key: i.key, value: i.value, description: i.description, type: i.type || 'text', enabled: i.enabled }));
            presetData.items = presetData.formData;
        }
    } else {
        presetData.items = editItems.value.filter(i => i.key.trim() || i.value.trim());
    }

    if (editingPresetId.value === 'new') {
        presetStore.addPreset(presetData);
    } else if (editingPresetId.value) {
        presetStore.updatePreset(editingPresetId.value, presetData);
    }

    editingPresetId.value = null;
};

const addItem = () => {
    editItems.value.push({ key: '', value: '', description: '', enabled: true, type: activeCategory.value === 'body' ? 'text' : undefined });
};

const removeItem = (idx: number) => {
    editItems.value.splice(idx, 1);
};

const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        editFileData.value = file;
    }
};

// Form-data type select dropdown in preset editor
const presetFdSelectIndex = ref<number | null>(null);
const presetFdSelectItem = ref<any>(null);
const presetFdSelectStyle = ref<Record<string, string>>({ top: '0px', left: '0px' });

const togglePresetFdSelect = (idx: number, item: any, event: Event) => {
  if (presetFdSelectIndex.value === idx) {
    presetFdSelectIndex.value = null;
    document.removeEventListener('click', closePresetFdSelect);
    return;
  }
  presetFdSelectIndex.value = idx;
  presetFdSelectItem.value = item;
  nextTick(() => {
    const el = (event.target as HTMLElement).closest('.custom-type-select') as HTMLElement;
    if (el) {
      const rect = el.getBoundingClientRect();
      presetFdSelectStyle.value = {
        top: `${rect.bottom + 2}px`,
        left: `${rect.left}px`,
      };
    }
    document.addEventListener('click', closePresetFdSelect);
  });
};

const closePresetFdSelect = () => {
  presetFdSelectIndex.value = null;
  document.removeEventListener('click', closePresetFdSelect);
};

const selectPresetFdType = (type: 'text' | 'file') => {
  if (presetFdSelectItem.value) presetFdSelectItem.value.type = type;
  presetFdSelectIndex.value = null;
  document.removeEventListener('click', closePresetFdSelect);
};

// File handling for preset form-data rows
const presetFdFiles = ref<Record<number, File>>({});

const triggerPresetFileInput = (idx: number) => {
  document.getElementById('preset-fd-file-' + idx)?.click()
};

const onPresetFdFileChange = (idx: number, e: any) => {
  const file = e.target.files[0];
  if (file) presetFdFiles.value[idx] = file;
};

// Row delete confirm logic (Copy from HeaderTab)
const confirmDeleteIndex = ref<number | null>(null);
let confirmTimer: ReturnType<typeof setTimeout> | undefined;

function onDeleteClick(index: number) {
  if (confirmDeleteIndex.value === index) {
    removeItem(index)
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

function onMasterDeleteClick() {
  editItems.value = editItems.value.filter(i => i.key.trim() !== '' || i.value.trim() !== '')
}

function toggleAll() {
  const isAnyEnabled = editItems.value.some(i => i.enabled)
  const target = !isAnyEnabled
  editItems.value.forEach(i => i.enabled = target)
}

const isAnyItemEnabled = computed(() => {
  return editItems.value.length > 0 && editItems.value.some(h => h.enabled)
})

const isConfirmingDeleteAll = ref(false)
let confirmAllTimer: ReturnType<typeof setTimeout> | undefined

function onTrashClick() {
  if (isConfirmingDeleteAll.value) {
    editItems.value = []
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
</script>

<template>
  <div class="preset-tab">
    <!-- Toolbar (Cloned from HeaderTab) -->
    <div class="header-toolbar">
      <div v-if="!editingPresetId" class="d-flex align-items-center w-100">
        <div class="d-flex me-auto">
          <button
            v-for="cat in ['headers', 'query', 'body', 'file']"
            :key="cat"
            class="header-toolbar-title text-uppercase px-3 me-1"
            :class="{ active: activeCategory === cat }"
            @click="activeCategory = cat as any"
          >
            {{ cat }}
          </button>
        </div>
        <IconSquareRoundedPlus @click="startEdit(activeCategory)" stroke-width="1" class="icon-button-add-row ms-2" title="New Preset"/>
      </div>
      
      <div v-else class="d-flex align-items-center w-100">
        <span class="header-toolbar-title me-2 text-uppercase">Preset Name</span>
        <input v-model="editName" class="preset-name-input flex-1 me-2" placeholder="Enter preset name..." />
        
        <IconSquareRoundedPlus v-if="activeCategory !== 'file'" @click="addItem" stroke-width="1" class="icon-button-add-row me-1"/>

        <div v-if="activeCategory !== 'file'" @click="onTrashClick" title="Delete all items" class="d-flex align-items-center cursor-pointer me-3">
          <ShieldAlert v-if="isConfirmingDeleteAll" stroke-width="1" class="icon-button icon-button-trash-x" />
          <SquareX v-else stroke-width="1" class="icon-button icon-button-trash-x" />
        </div>

        <div class="d-flex gap-2 ms-auto">
           <button class="btn-cancel" @click="cancelEdit">CANCEL</button>
           <button class="btn-save d-flex align-items-center" @click="saveEdit">
             <Save size="14" class="me-1" /> SAVE
           </button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="preset-content mt-2">
      <!-- List View -->
      <div v-if="!editingPresetId">
        <div class="preset-grid">
          <div v-for="p in presetStore.getPresetsByCategory(activeCategory)" :key="p.id" class="preset-card">
            <div class="p-info" @click="startEdit(activeCategory, p)">
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta">{{ p.type || p.fileName || activeCategory }}</div>
            </div>
            <div class="p-actions">
              <button class="btn-icon" @click.stop="startEdit(activeCategory, p)"><Edit2 size="14" /></button>
              <button class="btn-icon text-danger" @click.stop="activeCategory === 'file' ? presetStore.deleteFilePreset(p.id) : presetStore.deletePreset(p.id)"><Trash2 size="14" /></button>
            </div>
          </div>
          <div v-if="!presetStore.getPresetsByCategory(activeCategory).length" class="empty-state">
            No presets found for this category.
          </div>
        </div>
      </div>

      <!-- Editor View -->
      <div v-else class="preset-editor">
         <div v-if="activeCategory === 'body'" class="d-flex gap-1 mb-2">
            <button class="type-btn" :class="{ active: editType === 'json' }" @click="editType = 'json'">JSON</button>
            <button class="type-btn" :class="{ active: editType === 'form-data' }" @click="editType = 'form-data'">FORM DATA</button>
         </div>

         <!-- Table Editor -->
         <div v-if="activeCategory !== 'body' || isFormData" class="table-outer-wrap">
            <div class="header-table-scroll-wrapper">
               <table class="header-param-table">
                  <colgroup>
                    <col style="width: 40px;">
                    <col :style="isFormData ? 'width: 30%' : 'width: 25%'">
                    <col v-if="isFormData" style="width: 100px;">
                    <col :style="isFormData ? 'width: auto' : 'width: 25%'">
                    <col v-if="!isFormData" style="width: auto;">
                    <col style="width: 40px;">
                  </colgroup>
                  <thead>
                    <tr>
                      <th>
                        <div class="cell-icon-action" @click="toggleAll">
                          <SquareCheck v-if="isAnyItemEnabled" stroke-width="1" class="icon-button-checkbox"/>
                          <Square v-else stroke-width="1" class="icon-button-checkbox"/>
                        </div>
                      </th>
                      <th class="text-center">Key</th>
                      <th v-if="isFormData" class="text-center">Type</th>
                      <th class="text-center">Value</th>
                      <th v-if="!isFormData" class="text-center">Description</th>
                      <th>
                        <div class="cell-icon-action" @click="onMasterDeleteClick" title="Clear empty rows">
                          <Eraser stroke-width="1" class="icon-button-eraser" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in editItems" :key="idx">
                      <td>
                        <div class="cell-icon-action" @click="item.enabled = !item.enabled">
                          <SquareCheck v-if="item.enabled" :stroke-width="1" class="icon-button-checkbox"/>
                          <Square v-else :stroke-width="1" class="icon-button-checkbox"/>
                        </div>
                      </td>
                      <td>
                        <div class="param-input-wrap">
                          <TrackedVariableInput
                            :value="item.key"
                            :enabled-env-variable="true"
                            @text-change="val => item.key = val"
                          />
                        </div>
                      </td>
                      <td v-if="isFormData">
                        <div class="custom-type-select" :class="{ 'is-active': presetFdSelectIndex === idx }">
                          <div class="type-select-trigger" @click="togglePresetFdSelect(idx, item, $event)">
                            <span>{{ item.type === 'file' ? 'File' : 'Text' }}</span>
                            <span class="dropdown-arrow">▼</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="param-input-wrap">
                          <div v-if="isFormData && item.type === 'text'">
                            <TrackedVariableInput
                              :value="item.value"
                              :enabled-env-variable="true"
                              @text-change="val => item.value = val"
                            />
                          </div>
                          <div v-else-if="isFormData && item.type === 'file'">
                            <div class="file-input-wrap">
                              <button class="btn-select-file" @click="triggerPresetFileInput(idx)">
                                {{ presetFdFiles[idx]?.name || 'Select File' }}
                              </button>
                              <input
                                :id="'preset-fd-file-' + idx"
                                type="file"
                                class="d-none"
                                @change="onPresetFdFileChange(idx, $event)"
                              />
                            </div>
                          </div>
                          <TrackedVariableInput v-else
                            :value="item.value"
                            :enabled-env-variable="true"
                            @text-change="val => item.value = val"
                          />
                        </div>
                      </td>
                      <td v-if="!isFormData">
                        <div class="param-input-wrap">
                          <TrackedVariableInput
                            :value="item.description"
                            :enabled-env-variable="false"
                            @text-change="val => item.description = val"
                          />
                        </div>
                      </td>
                      <td>
                        <div class="cell-icon-action" @click="onDeleteClick(idx)">
                          <ShieldAlert v-if="confirmDeleteIndex === idx" :stroke-width="1" class="icon-button icon-button-row-action" />
                          <SquareX v-else :stroke-width="1" class="icon-button icon-button-row-action" />
                        </div>
                      </td>
                    </tr>
                    <tr v-if="editItems.length === 0">
                      <td :colspan="isFormData ? 5 : 6" class="empty-row">No items</td>
                    </tr>
                  </tbody>
               </table>
            </div>
         </div>

         <!-- JSON Editor -->
         <div v-else-if="activeCategory === 'body' && editType === 'json'" class="json-wrap">
            <CodeMirrorContainer2
              v-model="editJson"
              :theme="theme"
              :show-beautify="true"
              :show-copy="true"
              @update:theme="onThemeUpdate"
            />
         </div>

         <!-- File Editor -->
         <div v-else-if="activeCategory === 'file'" class="binary-wrap">
            <div class="binary-uploader" @click="editFileInput?.click()">
               <FileUp :size="40" :stroke-width="1" class="mb-3 text-muted" />
               <div v-if="editFileData" class="file-info text-center">
                  <div class="file-name fw-bold">{{ editFileData.name }}</div>
                  <div class="file-size text-muted small">{{ (editFileData.size / 1024).toFixed(1) }} KB</div>
               </div>
               <div v-else class="text-muted">Click to select file</div>
               <input type="file" ref="editFileInput" class="d-none" @change="handleFileChange" />
            </div>
         </div>
         <div class="help-text mt-2 text-muted">These fields will be injected/merged into your request.</div>
      </div>
    </div>

    <Teleport to="body">
      <div class="type-select-dropdown" v-if="presetFdSelectIndex !== null" :style="presetFdSelectStyle" @click.stop>
        <div class="type-select-option" @click="selectPresetFdType('text')">Text</div>
        <div class="type-select-option" @click="selectPresetFdType('file')">File</div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.preset-tab {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: auto;
  padding: 8px;
}

.header-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 2px;
  height: 32px;
}

.header-toolbar-title {
  padding: 0 8px;
  height: 28px;
  display: flex;
  align-items: center;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  &.active {
    background-color: #bbbbbb;
    border-color: #666;
  }
}

.preset-name-input {
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  height: 28px;
  padding: 0 8px;
  font-size: 13px;
  outline: none;
  &:focus { background: #fff; }
}

.header-table-scroll-wrapper {
  min-height: 0;
  height: fit-content;
  max-height: 400px; 
  overflow-y: auto;
  @include elements.scrollbar-hidden;
}

.header-param-table {
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
}

.cell-icon-action {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
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

.icon-button-checkbox, .icon-button-eraser, .icon-button-row-action {
  width: 26px;
  height: 26px;
  cursor: pointer;
  display: block;
  margin: 0 auto;
  fill: var(--icon-bg-color);
  transition: fill 0.2s ease;
  &:hover { fill: var(--icon-bg-color-active); }
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

.btn-save {
  background: #007bff;
  color: white;
  border: 1px solid #0056b3;
  padding: 0 12px;
  height: 28px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #0069d9; }
}

.btn-cancel {
  background: #fff;
  border: 1px solid #ccc;
  padding: 0 12px;
  height: 28px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f8f8f8; }
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.preset-card {
  background: #f8f8f8;
  border: 1px solid #ddd;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
  &:hover { border-color: #bbb; background: #f0f0f0; }
  .p-info { flex: 1; padding: 8px 12px; cursor: pointer; min-width: 0; }
  .p-name { font-weight: 500; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .p-meta { font-size: 10px; color: #888; text-transform: uppercase; }
  .p-actions { display: flex; padding-right: 4px; align-items: center; }
}

.text-primary { color: #007bff; }

.btn-icon { background: none; border: none; padding: 4px; color: #888; cursor: pointer; &:hover { color: #333; } }

.type-btn {
  background: rgba(221, 221, 221, 0.4);
  border: 1px solid #888888;
  padding: 0 8px;
  height: 24px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  &.active { background: #666; color: white; border-color: #333; }
}

.json-wrap { border: 1px solid #ddd; height: 100%; min-height: 350px; overflow: hidden; }
.binary-wrap { padding: 30px; background: #fcfcfc; border: 1px solid #ddd; }
.binary-uploader { width: 100%; height: 120px; border: 2px dashed #ccc; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; &:hover { border-color: #999; } }

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
    background-color: #e2e2e2;
  }
}

.dropdown-arrow {
  font-size: 9px;
  color: #666;
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
  flex: 1;
  height: 100%;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover { background: #e0e0e0; }
}

.type-select-dropdown {
  position: fixed;
  min-width: 80px;
  background-color: #f4f4f4;
  border: 1px solid #888888;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  z-index: 100000;
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

.help-text { font-size: 11px; }
</style>
