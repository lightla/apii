<script setup lang="ts">
import { ref, onMounted, inject, provide, onUnmounted } from 'vue'
import { nanoid } from 'nanoid'

const props = withDefaults(
    defineProps<{ isActive?: boolean, id?: string }>(),
    { isActive: true }
)

const registerItem = inject<(id: string, initialState: boolean) => void>('registerItem')!
const unregisterItem = inject<(id: string) => void>('unregisterItem')!

const itemId = props.id || nanoid()
const toggleMenuItemIdRef = ref<string>(itemId)

provide('toggleMenuItemIdRef', toggleMenuItemIdRef)

onMounted(() => {
  registerItem(itemId, props.isActive)
})

onUnmounted(() => {
  unregisterItem(itemId)
})

</script>

<template>
  <div class="toggle-menu-item">
    <slot />
  </div>
</template>

<style scoped>
.toggle-menu-item {
  max-height: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  padding: 0;
  background-color: var(--app-bg-color);
  transition: background-color 0.3s ease;
  position: relative;
}
.toggle-menu-item[data-active="true"] {
  background-color: #e8f0fe;
}
</style>
