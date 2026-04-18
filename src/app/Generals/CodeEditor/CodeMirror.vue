<template>
  <div class="codemirror-container">
    <textarea ref="textarea"></textarea>
    <div v-if="showCopyButton" class="copy-code-button" @click="copyCode" title="Sao chép code">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
    </div>
    <!-- Nút theme sẽ được quản lý bởi component cha -->
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import CodeMirror from 'codemirror';
// Import các mode và CSS cần thiết cho CodeMirror
import 'codemirror/mode/javascript/javascript.js';
import 'codemirror/lib/codemirror.css';
// Import tất cả các theme bạn muốn hỗ trợ
// (Lưu ý: Trong một dự án thực tế, bạn có thể muốn import động để tối ưu )
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/theme/abbott.css';
import 'codemirror/theme/abcdef.css';
import 'codemirror/theme/ambiance.css';
import 'codemirror/theme/ayu-dark.css';
import 'codemirror/theme/ayu-mirage.css';
import 'codemirror/theme/base16-dark.css';
import 'codemirror/theme/base16-light.css';
import 'codemirror/theme/bespin.css';
import 'codemirror/theme/blackboard.css';
import 'codemirror/theme/cobalt.css';
import 'codemirror/theme/darcula.css';
import 'codemirror/theme/dracula.css';
import 'codemirrorm/theme/duotone-dark.css';
import 'codemirror/theme/duotone-light.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/elegant.css';
import 'codemirror/theme/erlang-dark.css';
import 'codemirror/theme/gruvbox-dark.css';
import 'codemirror/theme/hopscotch.css';
import 'codemirror/theme/icecoder.css';
import 'codemirror/theme/idea.css';
import 'codemirror/theme/isotope.css';
import 'codemirror/theme/juejin.css';
import 'codemirror/theme/lesser-dark.css';
import 'codemirror/theme/liquibyte.css';
import 'codemirror/theme/lucario.css';
import 'codemirror/theme/material-darker.css';
import 'codemirror/theme/material-ocean.css';
import 'codemirror/theme/material-palenight.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/mbo.css';
import 'codemirror/theme/mdn-like.css';
import 'codemirror/theme/midnight.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/theme/moxer.css';
import 'codemirror/theme/neat.css';
import 'codemirror/theme/neo.css';
import 'codemirror/theme/night.css';
import 'codemirror/theme/nord.css';
import 'codemirror/theme/oceanic-next.css';
import 'codemirror/theme/panda-syntax.css';
import 'codemirror/theme/paraiso-dark.css';
import 'codemirror/theme/paraiso-light.css';
import 'codemirror/theme/pastel-on-dark.css';
import 'codemirror/theme/railscasts.css';
import 'codemirror/theme/rubyblue.css';
import 'codemirror/theme/seti.css';
import 'codemirror/theme/shadowfox.css';
import 'codemirror/theme/solarized.css';
import 'codemirror/theme/ssms.css';
import 'codemirror/theme/the-matrix.css';
import 'codemirror/theme/tomorrow-night-bright.css';
import 'codemirror/theme/tomorrow-night-eighties.css';
import 'codemirror/theme/ttcn.css';
import 'codemirror/theme/twilight.css';
import 'codemirror/theme/vibrant-ink.css';
import 'codemirror/theme/xq-dark.css';
import 'codemirror/theme/xq-light.css';
import 'codemirror/theme/yeti.css';
import 'codemirror/theme/yonce.css';
import 'codemirror/theme/zenburn.css';


const props = defineProps({
  modelValue: { type: String, default: '' },
  theme: { type: String, default: 'eclipse' },
  showCopyButton: { type: Boolean, default: true },
});

const emit = defineEmits(['update:modelValue']);

const textarea = ref(null);
let editor = null;

onMounted(() => {
  editor = CodeMirror.fromTextArea(textarea.value, {
    lineNumbers: true,
    mode: { name: "javascript", json: true },
    theme: props.theme,
    lineWrapping: true,
  });

  editor.setValue(props.modelValue);

  editor.on('change', (instance) => {
    const currentValue = instance.getValue();
    if (currentValue !== props.modelValue) {
      emit('update:modelValue', currentValue);
    }
  });
});

// Cập nhật editor khi props thay đổi
watch(() => props.modelValue, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
});

watch(() => props.theme, (newTheme) => {
  if (editor) {
    editor.setOption('theme', newTheme);
  }
});

// Dọn dẹp khi component bị hủy
onBeforeUnmount(() => {
  if (editor) {
    editor.toTextArea();
  }
});

const copyCode = () => {
  if (editor) {
    navigator.clipboard.writeText(editor.getValue());
  }
};

// Expose phương thức refresh để component cha có thể gọi khi tab được active
defineExpose({
  refresh: () => {
    if (editor) {
      editor.refresh();
    }
  }
});
</script>

<style scoped>
.codemirror-container {
  position: relative;
  height: 100%;
  width: 100%;
}

/* Style cho CodeMirror sẽ được áp dụng toàn cục, nhưng các nút thì scoped */
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

<style>
/* CSS toàn cục cho CodeMirror để đảm bảo nó chiếm toàn bộ không gian */
.CodeMirror {
  height: 100% !important;
  font-size: 14px;
  border: none;
}
</style>
