<script setup lang="ts">
const props = defineProps<{ tag: string }>()
const emit = defineEmits(['remove'])
</script>

<template>
  <div class="request-tag">
    {{ props.tag }}
    <span class="remove" @click="emit('remove')">×</span>
  </div>
</template>

<style scoped>
.request-tag {
  background: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.remove {
  cursor: pointer;
  font-weight: bold;
}
</style>