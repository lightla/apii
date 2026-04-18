<template>
  <div class="codemirror-wrapper">
    <!-- Lớp Overlay trong suốt để bắt sự kiện click ra ngoài -->
    <!-- Nó chỉ xuất hiện khi popup mở và nằm ngay dưới popup -->
    <div v-if="isThemePopupVisible" class="theme-overlay" @click="closeAndRestore"></div>

    <codemirror
        :model-value="modelValue"
        @update:model-value="value => $emit('update:modelValue', value)"
        :style="{ height: '100%' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
    />

    <button v-if="props.showCopy" class="code-action-button copy-button" title="Sao chép code" @click="copyCode">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
    </button>

    <button v-if="props.showBeautify" class="code-action-button beautify-button" title="Định dạng JSON" @click="beautifyCode">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.143-7.714L1 12l6.857-2.286L11 3z"></path></svg>
    </button>

    <div class="theme-selector-container">
      <button class="theme-icon-button" title="Chọn theme" @click.stop="toggleThemePopup">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
      </button>

      <!-- Component chọn theme sẽ nằm trên lớp overlay -->
      <CodeMirrorThemeSelector
          v-if="isThemePopupVisible"
          ref="themeSelectorRef"
          :themes="themes"
          :current-theme="props.theme"
          @theme-preview="handleThemePreview"
          @theme-select="handleThemeSelect"
          @close-popup="closeAndRestore"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';
import CodeMirrorThemeSelector from './CodeMirrorThemeSelector.vue';

// --- Import và Map đầy đủ theme ---
import { oneDark } from '@codemirror/theme-one-dark';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { material } from '@uiw/codemirror-theme-material';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { nord } from '@uiw/codemirror-theme-nord';
import { eclipse } from '@uiw/codemirror-theme-eclipse';
import { bespin } from '@uiw/codemirror-theme-bespin';
import { duotoneDark, duotoneLight } from '@uiw/codemirror-theme-duotone';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { sublime } from '@uiw/codemirror-theme-sublime';
import { tokyoNight } from '@uiw/codemirror-theme-tokyo-night';
import { xcodeDark, xcodeLight } from '@uiw/codemirror-theme-xcode';

const themeMap = {
  'one-dark': oneDark, 'dracula': dracula, 'material': material, 'monokai': monokai,
  'nord': nord, 'eclipse': eclipse, 'bespin': bespin, 'duotone-dark': duotoneDark,
  'duotone-light': duotoneLight, 'github-dark': githubDark, 'github-light': githubLight,
  'okaidia': okaidia, 'sublime': sublime, 'tokyo-night': tokyoNight,
  'xcode-dark': xcodeDark, 'xcode-light': xcodeLight,
};

const props = defineProps({
  modelValue: { type: String, default: '' },
  theme: { type: String, default: 'one-dark' },
  isReadOnly: { type: Boolean, default: false },
  showBeautify: { type: Boolean, default: false },
  showCopy: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue', 'update:theme']);

const themes = ref(Object.keys(themeMap).map(name => ({ name })));
const isThemePopupVisible = ref(false);
const themeForPreview = ref(props.theme);
const themeSelectorRef = ref(null);

const beautifyCode = () => {
  try {
    if (props.modelValue) {
      const parsed = JSON.parse(props.modelValue);
      const beautified = JSON.stringify(parsed, null, 2);
      emit('update:modelValue', beautified);
    }
  } catch (e) {
    console.warn('Cannot beautify: Invalid JSON', e);
  }
};

const toggleThemePopup = () => {
  isThemePopupVisible.value = !isThemePopupVisible.value;
  // Nếu popup vừa đóng (bằng cách nhấn lại nút), khôi phục theme
  if (!isThemePopupVisible.value) {
    themeForPreview.value = props.theme;
  }
};

const handleThemePreview = ({ theme, index }) => {
  themeForPreview.value = theme;
  themeSelectorRef.value?.setHighlightedIndex(index);
};

// Hàm chọn theme (khi click hoặc Enter)
const handleThemeSelect = (themeName) => {
  themeForPreview.value = themeName; // Cập nhật preview
  emit('update:theme', themeName);   // Báo cho cha
  isThemePopupVisible.value = false;  // Đóng popup
};

// Hàm đóng và khôi phục (khi click ra ngoài hoặc nhấn Esc)
const closeAndRestore = () => {
  if (isThemePopupVisible.value) {
    isThemePopupVisible.value = false;
    themeForPreview.value = props.theme; // Khôi phục lại theme từ prop
  }
};

const fontTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '13px' },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
    scrollbarWidth: 'thin',
    scrollbarColor: '#555 transparent',
  },
  '.cm-scroller::-webkit-scrollbar': { width: '5px', height: '5px' },
  '.cm-scroller::-webkit-scrollbar-track': { background: 'transparent' },
  '.cm-scroller::-webkit-scrollbar-thumb': { background: '#555', borderRadius: '3px' },
  '.cm-scroller::-webkit-scrollbar-thumb:hover': { background: '#888' },
})

const extensions = computed(() => [
  json(),
  themeMap[themeForPreview.value] || oneDark,
  EditorView.lineWrapping,
  fontTheme,
  ...(props.isReadOnly ? [EditorView.editable.of(false)] : []),
]);

const copyCode = () => {
  if (props.modelValue) {
    navigator.clipboard.writeText(props.modelValue);
  }
};

// Đồng bộ theme preview khi prop từ cha thay đổi
watch(() => props.theme, (newTheme) => {
  themeForPreview.value = newTheme;
});
</script>

<style scoped>
.codemirror-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  text-align: left;
}

.code-action-button {
  position: absolute;
  right: 10px;
  z-index: 10;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.code-action-button:hover {
  background-color: #e0e0e0;
}
.code-action-button svg {
  width: 16px;
  height: 16px;
}

.copy-button {
  top: 10px;
}

.beautify-button {
  top: 48px;
}

/* Lớp overlay trong suốt để bắt sự kiện click */
.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 19; /* Nằm ngay dưới popup */
}

.theme-selector-container {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 20;
}

.theme-icon-button {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.theme-icon-button:hover {
  background-color: #f0f0f0;
}
.theme-icon-button svg {
  width: 18px;
  height: 18px;
}

/* Định vị component CodeMirrorThemeSelector */
.theme-selector-container > :deep(.theme-popup) {
  position: absolute;
  bottom: 110%;
  right: 0;
}
</style>
