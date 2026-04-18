<template>
  <!-- Thêm sự kiện mousemove để reset cờ điều hướng phím -->
  <div class="theme-popup" ref="themePopupRef" @keydown="handleThemeKeyboardNav" @mousemove="isKeyboardNavigating = false" tabindex="-1">
    <div
        v-for="(theme, index) in themes"
        :key="theme.name"
        :ref="el => themeRefs[index] = el"
        class="theme-option"
        :class="{
        highlighted: index === highlightedThemeIndex,
        selected: theme.name === currentTheme
      }"
        @mouseenter="handleMouseEnter(theme.name, index)"
        @click="$emit('theme-select', theme.name)"
    >
      {{ theme.name }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';

const props = defineProps({
  themes: { type: Array, required: true },
  currentTheme: { type: String, required: true },
});

const emit = defineEmits(['theme-preview', 'theme-select', 'close-popup']);

const highlightedThemeIndex = ref(0);
const themePopupRef = ref(null);
const themeRefs = ref([]);
const isKeyboardNavigating = ref(false); // SỬA LỖI: Thêm cờ điều hướng phím

// SỬA LỖI: Hàm xử lý mouseenter
const handleMouseEnter = (themeName, index) => {
  // Chỉ xử lý preview bằng chuột nếu không đang dùng phím
  if (!isKeyboardNavigating.value) {
    emit('theme-preview', { theme: themeName, index });
  }
};

const handleThemeKeyboardNav = (event) => {
  isKeyboardNavigating.value = true; // Bật cờ khi bắt đầu dùng phím
  event.preventDefault();
  const maxIndex = props.themes.length - 1;
  let newIndex = highlightedThemeIndex.value;

  if (event.key === 'ArrowDown') {
    newIndex = newIndex >= maxIndex ? 0 : newIndex + 1;
  } else if (event.key === 'ArrowUp') {
    newIndex = newIndex <= 0 ? maxIndex : newIndex - 1;
  } else if (event.key === 'Enter') {
    emit('theme-select', props.themes[highlightedThemeIndex.value].name);
    return;
  } else if (event.key === 'Escape') {
    emit('close-popup');
    return;
  }

  if (newIndex !== highlightedThemeIndex.value) {
    emit('theme-preview', { theme: props.themes[newIndex].name, index: newIndex });
    themeRefs.value[newIndex]?.scrollIntoView({ block: 'nearest' });
  }
};

const setHighlightedIndex = (index) => {
  highlightedThemeIndex.value = index;
};

onMounted(() => {
  highlightedThemeIndex.value = Math.max(0, props.themes.findIndex(t => t.name === props.currentTheme));
  nextTick(() => {
    themePopupRef.value?.focus();
  });
});

defineExpose({ setHighlightedIndex });
</script>

<style scoped>
/* SỬA LỖI: Copy chính xác 100% CSS từ V1 */
.theme-popup {
  background: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .15);
  max-height: 250px;
  overflow-y: auto;
  padding: 5px 0;
  min-width: 200px;
}
.theme-popup:focus {
  outline: none;
}
.theme-option {
  padding: 8px 15px;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
}
.theme-option.highlighted {
  background-color: #e9e9e9;
}
.theme-option.selected::before {
  content: '✓';
  position: absolute;
  left: 15px;
  color: #007aff;
  font-weight: bold;
}
.theme-option.selected {
  padding-left: 35px;
}
</style>
