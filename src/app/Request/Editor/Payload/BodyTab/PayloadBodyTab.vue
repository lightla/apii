<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  Binary
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
    <!-- Body Type Selector with Full Border -->
    <div class="body-type-toolbar">
      <div 
        v-for="type in bodyTypes" 
        :key="type.value"
        class="body-type-item"
        :class="{ 'active': store.bodyType === type.value }"
        @click="store.setBodyType(type.value as any)"
      >
        <component :is="type.icon" size="18" class="me-2" stroke-width="1.5" />
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
          <IconSquareRoundedPlus @click="store.addFormData()" stroke-width="1.5" class="icon-plus"/>
          <span class="ms-2 small text-muted">Add Form-Data pair</span>
        </div>
        
        <table class="form-data-table">
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              <th style="width: 30%;">Key</th>
              <th style="width: 100px;">Type</th>
              <th>Value</th>
              <th style="width: 40px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in store.formData" :key="item.id">
              <td>
                <div class="cell-icon-action" @click="item.enabled = !item.enabled">
                  <SquareCheck v-if="item.enabled" stroke-width="1" size="18" />
                  <Square v-else stroke-width="1" size="18" />
                </div>
              </td>
              <td>
                <TrackedVariableInput
                  :route="props.route"
                  :value="item.key"
                  :enabled-env-variable="true"
                  @text-change="val => item.key = val"
                />
              </td>
              <td>
                <select v-model="item.type" class="type-select">
                  <option value="text">Text</option>
                  <option value="file">File</option>
                </select>
              </td>
              <td>
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
              </td>
              <td>
                <div class="cell-icon-action" @click="store.removeFormData(index)">
                  <SquareX stroke-width="1" size="18" />
                </div>
              </td>
            </tr>
            <tr v-if="store.formData.length === 0">
              <td colspan="5" class="empty-text">No form-data parameters</td>
            </tr>
          </tbody>
        </table>
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
.body-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: transparent;
}

.body-type-toolbar {
  display: flex;
  gap: 2px;
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.4);
  border: 1px solid #888888; /* Full border cho container */
  margin-bottom: 5px;
}

.body-type-item {
  padding: 6px 16px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  border: 1px solid transparent;
  color: #555;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &.active {
    background-color: #dddddd;
    border: 1px solid #888888;
    color: #000;
    font-weight: 500;
  }
}

.body-content-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.json-editor-wrap {
  height: 100%;
}

.form-data-wrap {
  padding: 10px;
}

.form-data-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.icon-plus {
  width: 30px;
  height: 30px;
  cursor: pointer;
  color: #888;
  &:hover { color: #000; }
}

.form-data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th {
    text-align: left;
    padding: 8px;
    background-color: #eeeeee;
    border: 1px solid #888888;
    font-weight: 500;
  }
  
  td {
    padding: 4px 8px;
    border: 1px solid #888888;
    vertical-align: middle;
  }
}

.type-select {
  width: 100%;
  background: transparent;
  border: 1px solid #ccc;
  padding: 2px 4px;
  font-size: 12px;
  outline: none;
}

.file-input-wrap {
  display: flex;
  align-items: center;
}

.btn-select-file {
  background: #eee;
  border: 1px solid #bbb;
  padding: 2px 10px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &:hover { background: #e0e0e0; }
}

.binary-wrap {
  padding: 30px;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.binary-uploader {
  width: 100%;
  max-width: 400px;
  height: 200px;
  border: 2px dashed #ccc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    border-color: #888;
    background-color: rgba(0,0,0,0.02);
  }
}

.file-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.none-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.empty-text {
  text-align: center;
  padding: 20px !important;
  color: #aaa;
}

.cell-icon-action {
  display: flex;
  justify-content: center;
  cursor: pointer;
  color: #666;
  &:hover { color: #000; }
}
</style>
