<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, ChevronRight, SquareX, ShieldAlert, Lock, Trash2, Edit2, Plus, Save, X } from 'lucide-vue-next'
import { IconPlus, IconDeviceFloppy, IconTrash } from "@tabler/icons-vue"
import { usePresetStorage } from '@/storages/presets.ts'
import type { RouteInfo } from '@/types'

const props = defineProps<{ route: RouteInfo }>()
const presetStore = usePresetStorage()

const activeCategory = ref<'headers' | 'query' | 'body'>('headers')

// --- Editing State ---
const editingPresetId = ref<string | null>(null)
const editName = ref('')
const editItems = ref<any[]>([])
const editType = ref<'headers' | 'query' | 'body-json' | 'body-form'>('headers')
const editJson = ref('')

const startEdit = (category: string, preset?: any) => {
    if (preset) {
        editingPresetId.value = preset.id;
        editName.value = preset.name;
        if (category === 'body' && preset.type === 'json') {
            editType.value = 'body-json';
            editJson.value = preset.json || '';
        } else if (category === 'body' && preset.type === 'form-data') {
            editType.value = 'body-form';
            editItems.value = preset.formData.map((i: any) => ({ ...i }));
        } else {
            editType.value = category as any;
            editItems.value = (preset.items || []).map((i: any) => ({ ...i }));
        }
    } else {
        editingPresetId.value = 'new';
        editName.value = 'New Preset';
        if (category === 'headers') {
            editType.value = 'headers';
            editItems.value = [{ key: '', value: '', description: '' }];
        } else if (category === 'query') {
            editType.value = 'query';
            editItems.value = [{ key: '', value: '', description: '' }];
        } else if (category === 'body') {
            editType.value = 'body-json';
            editJson.value = '{\n  "key": "value"\n}';
        }
    }
};

const cancelEdit = () => {
    editingPresetId.value = null;
};

const saveEdit = () => {
    if (!editName.value.trim()) return;
    
    if (editType.value === 'headers') {
        const items = editItems.value.filter(i => i.key.trim());
        if (editingPresetId.value === 'new') {
            presetStore.headerPresets.push({ id: 'h-' + Date.now(), name: editName.value, items });
        } else {
            const p = presetStore.headerPresets.find(p => p.id === editingPresetId.value);
            if (p) { p.name = editName.value; p.items = items; }
        }
    } else if (editType.value === 'query') {
        const items = editItems.value.filter(i => i.key.trim());
        if (editingPresetId.value === 'new') {
            presetStore.queryPresets.push({ id: 'q-' + Date.now(), name: editName.value, items });
        } else {
            const p = presetStore.queryPresets.find(p => p.id === editingPresetId.value);
            if (p) { p.name = editName.value; p.items = items; }
        }
    } else if (editType.value === 'body-json') {
        if (editingPresetId.value === 'new') {
            presetStore.bodyPresets.push({ id: 'bj-' + Date.now(), name: editName.value, type: 'json', json: editJson.value });
        } else {
            const p = presetStore.bodyPresets.find(p => p.id === editingPresetId.value);
            if (p) { p.name = editName.value; p.json = editJson.value; p.type = 'json'; }
        }
    } else if (editType.value === 'body-form') {
        const items = editItems.value.filter(i => i.key.trim());
        if (editingPresetId.value === 'new') {
            presetStore.bodyPresets.push({ id: 'bf-' + Date.now(), name: editName.value, type: 'form-data', formData: items });
        } else {
            const p = presetStore.bodyPresets.find(p => p.id === editingPresetId.value);
            if (p) { p.name = editName.value; p.formData = items; p.type = 'form-data'; }
        }
    }
    
    presetStore.persist();
    editingPresetId.value = null;
};

const deletePreset = (category: string, id: string) => {
    if (confirm('Delete this preset?')) {
        if (category === 'headers') presetStore.headerPresets = presetStore.headerPresets.filter(p => p.id !== id);
        if (category === 'query') presetStore.queryPresets = presetStore.queryPresets.filter(p => p.id !== id);
        if (category === 'body') presetStore.bodyPresets = presetStore.bodyPresets.filter(p => p.id !== id);
        presetStore.persist();
    }
};

const addItem = () => {
    editItems.value.push({ key: '', value: '', description: '' });
};

const removeItem = (idx: number) => {
    editItems.value.splice(idx, 1);
};
</script>

<template>
  <div class="preset-tab p-3">
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

      <!-- List Section -->
      <div class="preset-header mb-3 d-flex justify-content-between align-items-center">
        <h3 class="m-0 fs-6 text-uppercase fw-bold text-muted">Manage {{ activeCategory }} Presets</h3>
        <button class="btn-app-sm" @click="startEdit(activeCategory)">
          <Plus size="14" class="me-1" /> New Preset
        </button>
      </div>

      <div class="preset-grid">
        <template v-if="activeCategory === 'headers'">
          <div v-for="p in presetStore.headerPresets" :key="p.id" class="preset-card">
            <div class="p-info">
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta">{{ p.items?.length || 0 }} headers</div>
            </div>
            <div class="p-actions">
              <button class="btn-icon" @click="startEdit('headers', p)"><Edit2 size="14" /></button>
              <button class="btn-icon text-danger" @click="deletePreset('headers', p.id)"><Trash2 size="14" /></button>
            </div>
          </div>
        </template>

        <template v-if="activeCategory === 'query'">
          <div v-for="p in presetStore.queryPresets" :key="p.id" class="preset-card">
            <div class="p-info">
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta">{{ p.items?.length || 0 }} params</div>
            </div>
            <div class="p-actions">
              <button class="btn-icon" @click="startEdit('query', p)"><Edit2 size="14" /></button>
              <button class="btn-icon text-danger" @click="deletePreset('query', p.id)"><Trash2 size="14" /></button>
            </div>
          </div>
        </template>

        <template v-if="activeCategory === 'body'">
          <div v-for="p in presetStore.bodyPresets" :key="p.id" class="preset-card">
            <div class="p-info">
              <div class="p-name">{{ p.name }}</div>
              <div class="p-meta text-uppercase">{{ p.type }}</div>
            </div>
            <div class="p-actions">
              <button class="btn-icon" @click="startEdit('body', p)"><Edit2 size="14" /></button>
              <button class="btn-icon text-danger" @click="deletePreset('body', p.id)"><Trash2 size="14" /></button>
            </div>
          </div>
        </template>
        
        <div v-if="(activeCategory === 'headers' && (presetStore.headerPresets?.length === 0)) || 
                   (activeCategory === 'query' && (presetStore.queryPresets?.length === 0)) || 
                   (activeCategory === 'body' && (presetStore.bodyPresets?.length === 0))"
             class="empty-state">
           No presets found for this category.
        </div>
      </div>
    </div>

    <!-- Edit Form -->
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
            <button class="type-btn" :class="{ active: editType === 'body-json' }" @click="editType = 'body-json'">JSON</button>
            <button class="type-btn" :class="{ active: editType === 'body-form' }" @click="editType = 'body-form'">Form Data</button>
         </div>

         <!-- JSON Editor -->
         <div v-if="editType === 'body-json'" class="json-wrap">
            <textarea v-model="editJson" class="json-area" placeholder='{ "key": "value" }'></textarea>
            <div class="help-text">JSON supports environment variables like {{variable}}</div>
         </div>

         <!-- Table Editor for others -->
         <div v-else class="table-wrap">
            <table class="config-table">
               <thead>
                 <tr>
                   <th>Key</th>
                   <th>Value</th>
                   <th>Description</th>
                   <th style="width: 40px;"></th>
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
                 <tr>
                   <td colspan="4" class="p-0">
                     <button class="add-row-btn" @click="addItem">
                        <Plus size="14" class="me-1"/> Add Row
                     </button>
                   </td>
                 </tr>
               </tbody>
            </table>
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

.category-tabs {
  border-bottom: 2px solid #ddd;
  padding-bottom: 8px;
}

.cat-btn {
  background: #e8e8e8;
  border: 1px solid #ccc;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  color: #666;
  &:hover { background: #dfdfdf; }
  &.active {
    background: #555;
    color: white;
    border-color: #444;
  }
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.preset-card {
  background: #fdfdfd;
  border: 1px solid #ccc;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:hover { border-color: #999; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
  
  .p-name { font-weight: 600; font-size: 14px; color: #333; }
  .p-meta { font-size: 11px; color: #888; margin-top: 2px; }
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  &:hover { color: #000; }
  &.text-danger:hover { color: #dc3545; }
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
  background: #ebebeb;
  border: 1px solid #ccc;
  padding: 20px;
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
  font-size: 14px;
  outline: none;
  &:focus { border-color: #007bff; }
}

.type-btn {
  background: #ddd;
  border: 1px solid #bbb;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  &.active { background: #555; color: white; border-color: #444; }
}

.json-area {
  width: 100%;
  height: 300px;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  padding: 12px;
  border: 1px solid #ccc;
  background: #fdfdfd;
  outline: none;
  resize: vertical;
  &:focus { border-color: #007bff; }
}

.help-text {
  font-size: 11px;
  color: #777;
  margin-top: 4px;
}

.config-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  th {
    background: #e0e0e0;
    border: 1px solid #ccc;
    padding: 6px;
    font-size: 12px;
  }
  td {
    border: 1px solid #ccc;
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
  background: #fff;
  border: 1px solid #ccc;
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  &:hover { background: #f0f0f0; }
}

.btn-app-sm {
  background: #fff;
  border: 1px solid #ccc;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  &:hover { background: #f0f0f0; }
}
</style>
