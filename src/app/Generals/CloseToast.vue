<script setup lang="ts">
import { IconX } from '@tabler/icons-vue';
</script>

<template>
  <div class="custom-close-toast">
    <IconX size="18" stroke-width="2" />
  </div>
</template>

<style scoped lang="scss">
.custom-close-toast {
  color: #666;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    color: #333;
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style>
