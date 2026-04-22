<script setup lang="ts">
import { ref } from 'vue';
import { Plus, Trash2, Edit2, Save, X, FileUp } from 'lucide-vue-next';
import { usePresetStorage } from '@/storages/presets';
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue';

const presetStore = usePresetStorage();
const activeCategory = ref<'headers' | 'query' | 'body'>('headers');
const theme = ref('eclipse'); 

// Editor State
const editingPresetId = ref<string | null>(null);
const editName = ref('');
const editType = ref<'json' | 'form-data' | 'binary'>('json');
const editItems = ref<{ key: string; value: string; description: string }[]>([]);
const editJson = ref('');
const editBinaryInfo = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const onThemeUpdate = (t: string) => {
  theme.value = t;
};

const startEdit = (category: 'headers' | 'query' | 'body', preset?: any) => {
    activeCategory.value = category;
    if (preset) {
        editingPresetId.value = preset.id;
        editName.value = preset.name;
        if (category === 'body') {
            editType.value = (preset.type as any) || 'json';
            if (editType.value === 'json') editJson.value = preset.json || preset.value || '';
            else if (editType.value === 'binary') editBinaryInfo.value = preset.value || '';
            else if (editType.value === 'form-data') editItems.value = JSON.parse(JSON.stringify(preset.formData || preset.items || []));
        } else {
            editItems.value = JSON.parse(JSON.stringify(preset.items || []));
        }
    } else {
        editingPresetId.value = 'new';
        editName.value = '';
        editItems.value = [{ key: '', value: '', description: '' }];
        editJson.value = '';
        editBinaryInfo.value = '';
        if (category === 'body') editType.value = 'json';
    }
};

const cancelEdit = () => {
    editingPresetId.value = null;
};

const saveEdit = () => {
    if (!editName.value.trim()) return;

    const presetData: any = {
        name: editName.value,
        category: activeCategory.value,
    };

    if (activeCategory.value === 'body') {
        presetData.type = editType.value;
        if (editType.value === 'json') {
            presetData.json = editJson.value;
            presetData.value = editJson.value;
        } else if (editType.value === 'binary') {
            presetData.value = editBinaryInfo.value;
        } else {
            presetData.formData = editItems.value.filter(i => i.key.trim());
            presetData.items = presetData.formData;
        }
    } else {
        presetData.items = editItems.value.filter(i => i.key.trim());
    }

    if (editingPresetId.value === 'new') {
        presetStore.addPreset(presetData);
    } else if (editingPresetId.value) {
        presetStore.updatePreset(editingPresetId.value, presetData);
    }

    editingPresetId.value = null;
};

const addItem = () => {
    editItems.value.push({ key: '', value: '', description: '' });
};

const removeItem = (idx: number) => {
    editItems.value.splice(idx, 1);
};

const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        editBinaryInfo.value = file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';
    }
};
</script>

<template>
  <div class="preset-tab p-3">
    <!-- List Section -->
    <div v-if="!editingPresetId">
      <!-- Category Tabs -->
      <div class="category-tabs d-flex gap-2 mb-4">
        <button 
          v-for="cat in ['headers', 'query', 'body']" 
          :key="cat"
          class="cat-btn"
          :class="{ active: activeCategory === cat }"
          @click="activeCategory = cat as any"
        >
          {{ cat.toUpperCase() }}
        </button>
      </div>

      <div class="preset-header mb-3 d-flex justify-content-between align-items-center">
        <h3 class="m-0 fs-6 text-uppercase fw-bold text-muted">Manage {{ activeCategory }} Presets</h3>
        <button class="btn-app-sm" @click="startEdit(activeCategory)">
          <Plus size="14" class="me-1" /> New Preset
        </button>
      </div>

      <div class="preset-grid">
        <div v-for="p in presetStore.getPresetsByCategory(activeCategory)" :key="p.id" class="preset-card">
          <div class="p-info">
            <div class="p-name">{{ p.name }}</div>
            <div class="p-meta">{{ p.type || activeCategory }}</div>
          </div>
          <div class="p-actions">
            <button class="btn-icon" @click="startEdit(activeCategory, p)"><Edit2 size="14" /></button>
            <button class="btn-icon text-danger" @click="presetStore.deletePreset(p.id)"><Trash2 size="14" /></button>
          </div>
        </div>
        
        <div v-if="!presetStore.getPresetsByCategory(activeCategory).length" class="empty-state">
          No presets found for this category.
        </div>
      </div>
    </div>

    <!-- Editor Section -->
    <div v-else class="preset-editor">
      <div class="editor-header d-flex justify-content-between align-items-center mb-4">
        <div>
           <label class="label-sm">Preset Name</label>
           <input v-model="editName" class="name-input" placeholder="Enter preset name..." />
        </div>
        <div class="d-flex gap-2">
           <button class="btn-app-secondary" @click="cancelEdit">Cancel</button>
           <button class="btn-app-primary" @click="saveEdit">
             <Save size="16" class="me-1" /> Save Preset
           </button>
        </div>
      </div>

      <div class="editor-body">
         <!-- Tabs for Body Type if Editing Body -->
         <div v-if="activeCategory === 'body'" class="d-flex gap-2 mb-3">
            <button class="type-btn" :class="{ active: editType === 'json' }" @click="editType = 'json'">JSON</button>
            <button class="type-btn" :class="{ active: editType === 'form-data' }" @click="editType = 'form-data'">Form Data</button>
            <button class="type-btn" :class="{ active: editType === 'binary' }" @click="editType = 'binary'">Binary</button>
         </div>

         <!-- JSON Editor -->
         <div v-if="editType === 'json'" class="json-wrap">
            <div class="editor-container-styled">
               <CodeMirrorContainer2 
                 v-model="editJson" 
                 :theme="theme" 
                 :show-beautify="true"
                 @update:theme="onThemeUpdate"
               />
            </div>
         </div>

         <!-- Binary Editor -->
         <div v-else-if="editType === 'binary'" class="binary-wrap">
            <div class="binary-uploader" @click="fileInput?.click()">
               <FileUp :size="40" :stroke-width="1" class="mb-3 text-muted" />
               <div v-if="editBinaryInfo" class="file-info text-center">
                  <div class="file-name fw-bold">{{ editBinaryInfo.split(' (')[0] }}</div>
                  <div class="file-size text-muted small">{{ editBinaryInfo.split(' (')[1]?.replace(')', '') }}</div>
               </div>
               <div v-else class="text-muted">
                  Click to select default file
               </div>
               <input type="file" ref="fileInput" class="d-none" @change="handleFileChange" />
            </div>
            
            <div class="help-text mt-3 text-center w-100">Note: Browser security prevents storing actual content. Metadata helps identification.</div>
            
            <button v-if="editBinaryInfo" class="btn-icon text-danger mt-2 mx-auto" @click.stop="editBinaryInfo = ''" title="Clear selection">
               <Trash2 size="16" class="me-1" /> Clear selection
            </button>
         </div>

         <!-- Table Editor for others (Headers, Query, Form Data) -->
         <div v-else class="table-wrap">
            <table class="config-table mb-2">
               <thead>
                 <tr>
                   <th style="width: 30%">Key</th>
                   <th style="width: 35%">Value</th>
                   <th style="width: 30%">Description</th>
                   <th style="width: 5%"></th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-for="(item, idx) in editItems" :key="idx">
                   <td><input v-model="item.key" class="cell-input" placeholder="key"/></td>
                   <td><input v-model="item.value" class="cell-input" placeholder="value"/></td>
                   <td><input v-model="item.description" class="cell-input" placeholder="desc"/></td>
                   <td class="text-center">
                     <button class="btn-icon text-danger" @click="removeItem(idx)"><X size="14"/></button>
                   </td>
                 </tr>
               </tbody>
            </table>
            <button class="add-row-btn mb-4" @click="addItem">
               <Plus size="14" class="me-1"/> Add Field
            </button>
            <div class="help-text">These fields will be injected/merged into your request.</div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.preset-tab {
  height: 100%;
  overflow-y: auto;
  background-color: #f4f4f4;
}

.cat-btn {
  background: #e0e0e0;
  border: 1px solid #ccc;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  &:hover { background: #d8d8d8; }
  &.active {
    background: #cccccc; 
    color: #333;
    border-color: #bbb;
  }
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.preset-card {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover { border-color: #bbb; background: #e8e8e8; }
  
  .p-info {
    flex: 1;
    min-width: 0;
  }
  .p-name { font-weight: 400; font-size: 14px; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .p-meta { font-size: 11px; color: #777; margin-top: 2px; text-transform: uppercase; }
  
  .p-actions {
    display: flex;
    gap: 4px;
  }
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #999;
  font-style: italic;
  font-size: 13px;
}

.preset-editor {
  background: #f0f0f0;
  border: 1px solid #ddd;
  padding: 20px;
}

.editor-container-styled {
    border: 1px solid #ccc;
    background: #fff;
    height: 300px;
    overflow: hidden;
}

.binary-wrap {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #fcfcfc;
    border-radius: 8px;
}

.binary-uploader {
    width: 100%;
    max-width: 400px;
    height: 160px;
    border: 2px dashed #ccc;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    background: #fff;
    &:hover {
        border-color: #888;
        background-color: rgba(0, 0, 0, 0.02);
    }
}

.file-info {
    .file-name {
        font-size: 14px;
        color: #333;
        margin-bottom: 2px;
    }
    .file-size {
        font-size: 12px;
        color: #777;
    }
}

.label-sm {
  font-size: 11px;
  text-transform: uppercase;
  color: #666;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}

.name-input {
  width: 300px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  background: #fcfcfc;
  font-size: 14px;
  outline: none;
  &:focus { border-color: #bbb; }
}

.type-btn {
  background: #ddd;
  border: 1px solid #bbb;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  &.active { background: #999; color: #222; border-color: #888; }
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { color: #000; }
  &.text-danger { color: #dc3545; }
  &.text-danger:hover { color: #bd2130; }
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  background: #fcfcfc;
  th {
    background: #e8e8e8;
    border: 1px solid #ddd;
    padding: 6px;
    font-size: 12px;
    color: #444;
  }
  td {
    border: 1px solid #ddd;
    padding: 0;
  }
}

.cell-input {
  width: 100%;
  border: none;
  padding: 8px;
  font-size: 13px;
  background: transparent;
  outline: none;
  &:focus { background: #f0f8ff; }
}

.add-row-btn {
  width: 100%;
  background: #f8f8f8;
  border: 1px solid #ccc;
  padding: 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover { background: #eee; }
}

.help-text {
  font-size: 11px;
  color: #777;
  margin-top: 4px;
}

.btn-app-primary {
  background: #007bff;
  color: white;
  border: 1px solid #0056b3;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover { background: #0069d9; }
}

.btn-app-secondary {
  background: #ffffff;
  border: 1px solid #ccc;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
  &:hover { background: #f8f8f8; }
}

.btn-app-sm {
  background: #ffffff;
  border: 1px solid #ccc;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #333;
  &:hover { background: #f8f8f8; }
}
</style>
