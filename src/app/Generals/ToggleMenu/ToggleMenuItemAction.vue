<script setup lang="ts">
import {inject, type Ref} from 'vue'

const toggleStates = inject<Ref<Map<string, boolean>>>('toggleStates')!
const toggleMenuItemIdRef = inject<Ref<string>>('toggleMenuItemIdRef')!

const onClick = (event: MouseEvent) => {
  console.log("action-toggleMenuItemId: ", toggleMenuItemIdRef.value)
  const current = toggleStates.value.get(toggleMenuItemIdRef.value)
  toggleStates.value.set(toggleMenuItemIdRef.value, !current)
}
</script>

<template>
  <div class="toggle-menu-item-action" @click="onClick">
    <slot />
  </div>
</template>

<style scoped>
.toggle-menu-item-action {
  position: absolute;
  top: 0;
  right: 1.2rem;
  cursor: pointer;
  user-select: none;
  color: #666;
  transition: color 0.2s ease;
  z-index: 10;
}

.toggle-menu-item-action:hover {
  color: #333;
}
</style>
