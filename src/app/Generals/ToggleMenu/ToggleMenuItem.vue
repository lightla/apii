<script setup lang="ts">
import { ref, onMounted, defineProps, inject, provide, watch } from 'vue'

const props = withDefaults(
    defineProps<{ isActive?: boolean }>(),  // isActive là optional
    { isActive: true }                      // default = true
)

const registerItem = inject<(initialState: boolean) => number>('registerItem')!

const toggleMenuItemIndexRef = ref<number | null>(null)

provide('toggleMenuItemIndexRef', toggleMenuItemIndexRef)

onMounted(() => {
  toggleMenuItemIndexRef.value = registerItem(props.isActive)
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
  border: 1px solid #888;
  border-radius: 0;
  padding: 12px;
  background-color: var(--app-bg-color);
  transition: background-color 0.3s ease;
  position: relative;
}
.toggle-menu-item[data-active="true"] {
  background-color: #e8f0fe;
}
</style>
