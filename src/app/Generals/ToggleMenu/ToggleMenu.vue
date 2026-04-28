<script setup lang="ts">
import { ref, provide, watch, nextTick } from 'vue'

const toggleStates = ref<Map<string, boolean>>(new Map())

function registerItem(id: string, defaultValue = true) {
  if (!toggleStates.value.has(id)) {
    toggleStates.value.set(id, defaultValue)
  }
}

function unregisterItem(id: string) {
  // We can keep the state or delete it. Let's keep it for persistence across remounts
  // but we won't let the map grow if items are same.
}

function toggle(id: string) {
  const current = toggleStates.value.get(id)
  toggleStates.value.set(id, !current)
}

provide('toggleStates', toggleStates)
provide('registerItem', registerItem)
provide('unregisterItem', unregisterItem)
provide('toggleItem', toggle)

const containerRef = ref<HTMLElement | null>(null)

watch(toggleStates, () => {
  nextTick(() => {
    if (!containerRef.value) return

    const children = Array.from(containerRef.value.children)
    const visibleCount = Array.from(toggleStates.value.values()).filter(v => v).length

    if (visibleCount === 0) {
      children.forEach((child) => {
        (child as HTMLElement).style.flex = '0 0 auto';
      })
      return;
    }

    if (visibleCount === children.length) {
      children.forEach((child) => {
        (child as HTMLElement).style.flex = '1 1 0';
      })
      return;
    }

    // This part is tricky because we need to know which child corresponds to which ID.
    // Let's assume the children are in the same order as registration? No.
    // For now, let's use a simpler flex logic or just set display.
    children.forEach((child, index) => {
      const element = child as HTMLElement;
      // We'll need a way to link element to state. 
      // For now, let's just use the index if possible.
      const statesArray = Array.from(toggleStates.value.values());
      const isVisible = statesArray[index];
      element.style.flex = isVisible ? '1 1 100%' : '0 0 auto';
    })
  })
}, { deep: true })
</script>

<template>
  <div class="toggle-menu" ref="containerRef">
    <slot />
  </div>
</template>

<style scoped lang="scss">
//.toggle-menu {
//  display: flex;
//  flex-direction: column;
//  gap: 10px;
//  height: 100%;
//  overflow: hidden;
//}

.toggle-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  overflow: hidden;
}
</style>
