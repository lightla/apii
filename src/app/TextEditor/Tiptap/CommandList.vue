<template>
  <div class="command-list">
    <button
        v-for="(item, index) in items"
        :key="index"
        class="command-item"
        :class="{ 'is-selected': index === selectedIndex }"
        @click="selectItem(index)"
    >
      {{ item.title }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  command: { type: Function, required: true },
})

const selectedIndex = ref(0)

const selectItem = index => {
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

defineExpose({ onKeyDown })
</script>

<style>
.command-list {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.command-item {
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
}
.command-item.is-selected,
.command-item:hover {
  background-color: #f3f4f6;
}
</style>
