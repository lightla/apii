<script setup lang="ts">
import { useEnvStorage } from "@/storages";
import { IconTrash } from '@tabler/icons-vue';
import { computed } from 'vue';

const props = defineProps<{
  varName: string;
  varValue: string;
  isDefined: boolean;
  searchQuery: string;
  filteredVariables: string[];
}>();

const emit = defineEmits<{
  'update:varValue': [value: string];
  'update:searchQuery': [value: string];
  'delete': [];
  'select': [name: string];
  'input-blur': [];
}>();

const envStorage = useEnvStorage();

const onValueInput = (e: Event) => {
  emit('update:varValue', (e.target as HTMLInputElement).value);
};

const onSearchInput = (e: Event) => {
  emit('update:searchQuery', (e.target as HTMLInputElement).value);
};

</script>

<template>
  <div class="popup-header">
    <div class="d-flex align-items-center w-100">
      <span class="var-label me-2">Variable:</span>
      <span class="var-name text-truncate" style="max-width: 140px;">{{ varName }}</span>
      <div class="ms-auto d-flex align-items-center">
        <IconTrash 
          v-if="isDefined" 
          @click="emit('delete')" 
          class="btn-delete-var" 
          size="24" 
          stroke-width="1.5"
        />
        <span v-if="!isDefined" class="badge bg-warning text-dark" style="font-size: 0.65rem">Undefined</span>
      </div>
    </div>
  </div>
  
  <div class="popup-body">
    <div class="section-label">Current Value</div>
    <div class="mb-3">
      <input
          :value="varValue"
          class="popup-input"
          placeholder="No value set..."
          @input="onValueInput"
          @blur="emit('input-blur')"
          @keydown.stop
      />
    </div>

    <div class="section-label d-flex justify-content-between">
      <span>Switch To...</span>
      <span class="text-muted" style="font-size: 0.65rem">{{ filteredVariables.length }} found</span>
    </div>
    <div class="mb-2">
      <input 
          :value="searchQuery" 
          class="popup-input" 
          placeholder="Search variables..." 
          @input="onSearchInput"
          @keydown.stop
      />
    </div>
    
    <div class="variable-list custom-scrollbar">
      <div 
          v-for="v in filteredVariables" 
          :key="v" 
          class="variable-item"
          @click="emit('select', v)"
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
</template>

<style scoped lang="scss">
/* Styles are inherited from parent or duplicated if needed */
</style>
