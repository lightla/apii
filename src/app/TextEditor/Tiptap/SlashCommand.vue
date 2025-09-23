<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  command: { type: Function, required: true },
})

const selectedIndex = ref(0)

const selectItem = (index) => {
  const item = props.items[index]
  if (item) props.command(item)
}

const onKeyDown = ({ event }) => {
  if (event.key === 'ArrowUp') {
    selectedIndex.value = (selectedIndex.value + props.items.length - 1) % props.items.length
    return true
  }
  if (event.key === 'ArrowDown') {
    selectedIndex.value = (selectedIndex.value + 1) % props.items.length
    return true
  }
  if (event.key === 'Enter') {
    selectItem(selectedIndex.value)
    return true
  }
  return false
}

watch(() => props.items, () => { selectedIndex.value = 0 })

defineExpose({ onKeyDown })
</script>

<template>
  <div class="command-list">
    <template v-if="items.length">
      <button
          v-for="(item, index) in items"
          :key="index"
          class="command-item"
          :class="{ 'is-selected': index === selectedIndex }"
          @click="selectItem(index)"
      >
        {{ item.title }}
      </button>
    </template>
    <div v-else class="command-item">Không tìm thấy</div>
  </div>
</template>
