<script setup lang="ts">
import { ref, provide, watch, nextTick } from 'vue'

const toggleStates = ref<boolean[]>([])

function registerItem(defaultValue = true) {
  toggleStates.value.push(defaultValue)

  return toggleStates.value.length - 1
}

function toggle(index: number) {
  toggleStates.value[index] = !toggleStates.value[index]
}

provide('toggleStates', toggleStates)
provide('registerItem', registerItem)
provide('toggleItem', toggle)

const containerRef = ref<HTMLElement | null>(null)

watch(toggleStates, () => {
  nextTick(() => {
    if (!containerRef.value) return

    const children = Array.from(containerRef.value.children)
    const visibleCount = toggleStates.value.filter(v => v).length

    console.log("visibleCount: ", visibleCount)
    console.log("children.length: ", children.length)

    if (visibleCount === 0) {
      children.forEach((child, childIndex) => {
        const element = child as HTMLElement;
        element.style.flex = '0 0 auto';
      })

      return;
    }

    if (visibleCount === children.length) {
      children.forEach((child, childIndex) => {
        const element = child as HTMLElement;

        element.style.flex = '1 1 0';
      })

      return;
    }

    children.forEach((child, childIndex) => {
      const element = child as HTMLElement;
      const isVisible = toggleStates.value[childIndex];

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
