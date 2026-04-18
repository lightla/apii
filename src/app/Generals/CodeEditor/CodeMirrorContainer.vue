<template>
  <div class="codemirror-wrapper" @wheel="handleWheel">
    <codemirror
        ref="cm"
        :model-value="modelValue"
        @update:model-value="value => $emit('update:modelValue', value)"
        :style="{ height: '100%' }"
        :autofocus="true"
        :indent-with-tab="true"
        :tab-size="2"
        :extensions="extensions"
        :disabled="isReadOnly"
    />
    <button class="copy-code-button" title="Sao chép code" @click="copyCode">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
    </button>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

// --- Import các theme ---
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
  'one-dark': oneDark,
  'dracula': dracula,
  'material': material,
  'monokai': monokai,
  'nord': nord,
  'eclipse': eclipse,
  'bespin': bespin,
  'duotone-dark': duotoneDark,
  'duotone-light': duotoneLight,
  'github-dark': githubDark,
  'github-light': githubLight,
  'okaidia': okaidia,
  'sublime': sublime,
  'tokyo-night': tokyoNight,
  'xcode-dark': xcodeDark,
  'xcode-light': xcodeLight,
};

export default {
  name: 'CodeMirrorContainer',
  components: { Codemirror },
  props: {
    modelValue: { type: String, default: '' },
    theme: { type: String, default: 'one-dark' },
    isReadOnly: { type: Boolean, default: false },
    fontSize: { type: Number, default: 14 }, // <<< ĐÃ THAY ĐỔI FONT SIZE MẶC ĐỊNH TỪ 14 XUỐNG 12
  },
  emits: ['update:modelValue'],
  setup(props  ) {
    const cm = ref(null);

    const handleWheel = (event) => {
      const editorEl = cm.value?.container;
      if (!editorEl) return;
      const scroller = editorEl.querySelector('.cm-scroller');
      if (!scroller) return;
      const { scrollTop, scrollHeight, clientHeight } = scroller;
      const { deltaY } = event;
      const PADDING = 1;
      if (scrollTop <= 0 && deltaY < 0) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (scrollTop + clientHeight >= scrollHeight - PADDING && deltaY > 0) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    };

    const fontSizeTheme = computed(() => EditorView.theme({
      '&': {
        fontSize: `${props.fontSize}px`,
      },
      '.cm-scroller': {
        fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
      }
    }));

    const extensions = computed(() => {
      const language = json();
      const themeExtension = themeMap[props.theme] || oneDark;
      return [language, themeExtension, fontSizeTheme.value];
    });

    const copyCode = () => {
      if (props.modelValue) {
        navigator.clipboard.writeText(props.modelValue);
      }
    };

    return {
      cm,
      extensions,
      copyCode,
      handleWheel,
    };
  },
};
</script>

<style scoped>
.codemirror-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  text-align: left;
}
.copy-code-button {
  position: absolute;
  top: 10px;
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
  opacity: 0.8;
  transition: opacity 0.2s, background-color 0.2s;
}
.copy-code-button:hover {
  opacity: 1;
  background-color: #e0e0e0;
}
.copy-code-button svg {
  width: 16px;
  height: 16px;
}
</style>
