
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import SearchInput from './SearchInput.vue'
import SearchHistory from './SearchHistory.vue'

const props = defineProps<{
  items: any[],
  fields: string[]
}>()

const emit = defineEmits(['search:value'])

const keyword = ref('')
const fullHistory = ref<string[]>([])
const isHistoryVisible = ref(false)
const searchWrapper = ref<HTMLElement | null>(null)
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null) // Ref trỏ tới component SearchInput
const isShowingAll = ref(false)
const HISTORY_KEY = 'request_search_history'

// --- LOGIC HIỂN THỊ LỊCH SỬ (Không đổi) ---
const displayedHistory = computed(() => {
  if (isShowingAll.value) {
    return fullHistory.value
  }
  const term = keyword.value.trim().toLowerCase()
  if (!term) {
    return fullHistory.value
  }
  return fullHistory.value.filter(item => item.toLowerCase().includes(term))
})

// --- LOGIC TÌM KIẾM (Đã sửa lỗi) ---
function performSearchAndSaveHistory() {
  const term = keyword.value.trim()
  if (term) {
    const existingIndex = fullHistory.value.indexOf(term)
    if (existingIndex > -1) {
      fullHistory.value.splice(existingIndex, 1)
    }
    fullHistory.value.unshift(term)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(fullHistory.value))
  }
  const lowerCaseTerm = term.toLowerCase()
  const results = lowerCaseTerm
      ? props.items.filter(item =>
          props.fields.some(field =>
              item[field] && String(item[field]).toLowerCase().includes(lowerCaseTerm)
          )
      )
      : [...props.items]
  emit('search:value', term)

  // Yêu cầu 2: Đóng popup lịch sử sau khi tìm kiếm
  isHistoryVisible.value = false
  isShowingAll.value = false // Reset lại trạng thái "xem tất cả"

  // Yêu cầu 1: Bỏ trỏ chuột (blur) khỏi ô input
  searchInputRef.value?.blur()
}

// --- CÁC HÀM XỬ LÝ SỰ KIỆN KHÁC ---
onMounted(() => {
  const savedHistory = localStorage.getItem(HISTORY_KEY)
  if (savedHistory) fullHistory.value = JSON.parse(savedHistory)
  emit('update:results', [...props.items])
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
})

function onSelectFromHistory(selected: string) {
  keyword.value = selected
  performSearchAndSaveHistory()
}

function onDeleteItem(itemToDelete: string) {
  const index = fullHistory.value.indexOf(itemToDelete)
  if (index > -1) {
    fullHistory.value.splice(index, 1)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(fullHistory.value))
  }
}

function onClearHistory() {
  fullHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

function onShowAllHistory() {
  isShowingAll.value = true
  isHistoryVisible.value = true
  searchInputRef.value?.blur()
}

// Khi con trỏ đi vào khu vực search
function handleFocusIn() {
  isHistoryVisible.value = true
  isShowingAll.value = false // Quay lại chế độ lọc reactive bình thường
}

function handleClickOutside(event: MouseEvent) {
  if (searchWrapper.value && !searchWrapper.value.contains(event.target as Node)) {
    isHistoryVisible.value = false
    isShowingAll.value = false
  }
}
</script>

<template>
  <!--
    QUAY LẠI LOGIC DÙNG @focusin
    Bỏ hoàn toàn @click
  -->
  <div class="search-wrapper" ref="searchWrapper" @focusin="handleFocusIn">
    <SearchInput
        ref="searchInputRef"
        v-model="keyword"
        placeholder="Tìm kiếm route, group..."
        @search="performSearchAndSaveHistory"
    />

    <SearchHistory
        v-if="isHistoryVisible"
        :items="displayedHistory"
        @select="onSelectFromHistory"
        @clear="onClearHistory"
        @show-all="onShowAllHistory"
        @delete-item="onDeleteItem"
    />
  </div>
</template>

<style scoped lang="scss">
.search-wrapper {
  position: relative;
  z-index: 100;
}
</style>
