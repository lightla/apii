<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  searchQuery: string;
  filteredVariables: string[];
}>();

const emit = defineEmits<{
  'update:searchQuery': [value: string];
  'select': [name: string];
}>();

const searchInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  searchInputRef.value?.focus();
});

const onSearchInput = (e: Event) => {
  emit('update:searchQuery', (e.target as HTMLInputElement).value);
};
</script>

<template>
  <div class="popup-header">
    <div class="d-flex align-items-center">
      <span class="var-label">Select Variable to Copy & Insert</span>
    </div>
  </div>
  <div class="popup-body">
    <div class="mb-2">
      <input 
          ref="searchInputRef"
          :value="searchQuery" 
          class="popup-input" 
          placeholder="Search variables..." 
          @input="onSearchInput"
          @keydown.stop
      />
    </div>
    
    <div class="variable-list custom-scrollbar" style="max-height: 200px;">
      <div 
          v-for="v in filteredVariables" 
          :key="v" 
          class="variable-item"
          @click="emit('select', v)"
      >
        {{ v }}
      </div>
      <div v-if="filteredVariables.length === 0" class="text-center p-2 text-muted small">
        No variables found
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
</style>
