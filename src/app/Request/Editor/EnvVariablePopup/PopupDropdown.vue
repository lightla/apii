<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEnvStorage } from '@/storages'

const props = defineProps<{
  initialValue: string
}>()

const emit = defineEmits<{
  (e: 'select', variable: { name: string; isDefined: boolean }): void
}>()

const value = ref('') // phần giữa, không có {{ }}
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const wrapperRef = ref<HTMLElement | null>(null)
const searchMode = ref(false)

const selectedItemName = ref('') // giữ lại item đã được chọn

const envStorage = useEnvStorage()

// Loại bỏ {{ và }} + trim khi nhận initialValue
const normalize = (str: string) => {
  return str.trim().replace(/^{{\s*/, '').replace(/\s*}}$/, '')
}

const filteredItems = computed(() => {
  const q = value.value.toLowerCase()
  if (!searchMode.value) {
    // List all mode
    return envStorage.definedEnvVariables.map(v => ({
      name: v.name,
      isDefined: true
    }))
  }

  // Search mode
  return envStorage.definedEnvVariables
      .filter(v => v.name.toLowerCase().includes(q))
      .map(v => ({ name: v.name, isDefined: true }))
})

const updateSelectedIndexByValue = (val: string) => {
  const normalized = normalize(val)
  const idx = filteredItems.value.findIndex(item => item.name === normalized)
  if (idx !== -1) {
    highlightedIndex.value = idx
    selectedItemName.value = filteredItems.value[idx].name
  } else {
    highlightedIndex.value = 0
    selectedItemName.value = ''
  }
}

watch(() => props.initialValue, (val) => {
  value.value = normalize(val)
  updateSelectedIndexByValue(val)
}, { immediate: true })

const selectItem = (item: { name: string; isDefined: boolean }) => {
  const rawName = item.name.trim().replace(/^{{\s*/, '').replace(/\s*}}$/, '')
  value.value = rawName
  selectedItemName.value = item.name
  emit('select', {
    name: `{{${rawName}}}`,
    isDefined: item.isDefined
  })
  searchMode.value = false
}

const onInput = () => {
  highlightedIndex.value = 0
  showDropdown.value = true
  searchMode.value = true
}

const selectHighlighted = () => {
  const trimmedValue = value.value.trim()
  if (filteredItems.value.length === 0 && trimmedValue) {
    emit('select', {
      name: `{{${trimmedValue}}}`,
      isDefined: false
    })
    searchMode.value = false
    return
  }

  const item = filteredItems.value[highlightedIndex.value]
  if (item) selectItem(item)
}

const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    showDropdown.value = false
    // ** Không reset selectedItemName hay highlightedIndex khi dropdown đóng **
  }
}

// Chặn nhập { hoặc } trong input
const preventBraces = (e: KeyboardEvent) => {
  if (e.key === '{' || e.key === '}') {
    e.preventDefault()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.code === 'Space') {
    e.preventDefault()
    showDropdown.value = true
    searchMode.value = true
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

const onInputClick = () => {
  showDropdown.value = true
  searchMode.value = false
  // Giữ nguyên highlightedIndex và selectedItemName
}

// Hàm mới: show dropdown và highlight biến truyền vào ngay lập tức
const showDropdownWithVariable = (variableName: string) => {
  const normName = normalize(variableName)
  value.value = normName
  showDropdown.value = true
  searchMode.value = false
  updateSelectedIndexByValue(normName)
}
</script>

<template>
  <div class="dropdown-wrapper" ref="wrapperRef">
    <div class="input-wrapper">
      <span class="bracket">{{ '\{\{' }}</span>
      <input
          class="dropdown-input"
          v-model="value"
          @click="onInputClick"
          @input="onInput"
          @keydown.enter.prevent="selectHighlighted"
          @keydown="preventBraces"
          placeholder="Type variable..."
          autocomplete="off"
      />
      <span class="bracket">{{ '/}/}' }}</span>
    </div>

    <ul v-if="showDropdown" class="dropdown-list">
      <li
          v-for="(item, index) in filteredItems"
          :key="index"
          :class="[
          'dropdown-item',
          item.isDefined ? 'defined' : 'undefined',
          index === highlightedIndex ? 'highlighted' : '',
          item.name === selectedItemName ? 'selected' : ''
        ]"
          @click="selectItem(item)"
          @mouseenter="highlightedIndex = index"
      >
        {{ item.name }}
      </li>
      <li v-if="filteredItems.length === 0" class="dropdown-item no-result">
        <em>&lt;Empty&gt;</em>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.dropdown-wrapper {
  position: relative;
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
}

.bracket {
  user-select: none;
  padding: 6px 4px;
  font-size: 14px;
  color: #666;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px 0 0 4px;
}

.dropdown-input {
  flex-grow: 1;
  height: 32px;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-left: none;
  border-right: none;
  font-size: 14px;
  outline: none;
}

.input-wrapper > .bracket:last-child {
  border-radius: 0 4px 4px 0;
  border-left: none;
  border: 1px solid #ccc;
  padding-left: 8px;
  padding-right: 8px;
  background: #f0f0f0;
}

.dropdown-list {
  position: absolute;
  top: 36px;
  left: 0;
  width: 100%;
  border: 1px solid #ccc;
  max-height: 160px;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.dropdown-item {
  padding: 8px 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background-color: #f2f2f2;
}

.defined {
  background-color: #e8fbe8;
}

.undefined {
  background-color: #fff1e0;
}

.selected {
  background-color: #dbeafe !important;
  font-weight: bold;
}

.no-result {
  font-style: italic;
  color: #888;
}
</style>