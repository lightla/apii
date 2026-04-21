<script setup lang="ts">
import { IconChevronRight, IconVariable } from '@tabler/icons-vue';

const emit = defineEmits<{
  'select-variable': []
}>();
</script>

<template>
  <div class="context-menu-list">
    <div class="context-menu-item" @click="emit('select-variable')">
      <IconVariable size="16" class="me-2" />
      <span>Select Variable</span>
      <IconChevronRight size="14" class="ms-auto" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.context-menu-list {
  padding: 4px 0;
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
  transition: all 0.1s;
  
  &:hover {
    background-color: #cccccc;
    color: #000;
  }
}
</style>
