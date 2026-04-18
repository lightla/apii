<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits([
  'update:modelValue',
  'search'
])

// --- THAY ĐỔI DUY NHẤT LÀ Ở ĐÂY ---
const inputElement = ref<HTMLInputElement | null>(null)

// Cho phép component cha truy cập vào phương thức `blur` của thẻ input
defineExpose({
  blur: () => inputElement.value?.blur()
})
</script>

<template>
  <div class="search-input-wrapper">
    <input
        ref="inputElement"
        type="text"
        :value="modelValue"
        :placeholder="placeholder || 'Tìm kiếm...'"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="emit('search')"
    />
    <svg @click="emit('search')" class="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</template>

<style scoped lang="scss">
/* CSS không thay đổi */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  box-sizing: border-box;
}
.search-icon {
  position: absolute;
  right: 12px;
  width: 20px;
  height: 20px;
  cursor: pointer;
  color: #888;
  &:hover { color: #333; }
}
</style>
