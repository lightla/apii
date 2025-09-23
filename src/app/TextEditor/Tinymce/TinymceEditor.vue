<script setup>
import { ref } from 'vue';      // 🔑 Đừng quên import ref
import Editor from '@tinymce/tinymce-vue';

const content = ref('<p>Chào mừng đến với TinyMCE!</p>');

const handleEditorChange = (newContent, editor) => {
  console.log('Nội dung thay đổi:', newContent);
};
</script>

<template>
  <Editor
      api-key="b6pcy8rp403qycqp3kyrrzpr6awhnjst37t7v393zztq8mfv"
      v-model="content"
      :init="{
      height: 400,
      menubar: true,
      plugins: 'link image code table lists',
      toolbar:
        'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist outdent indent | link image | code',
    }"
      @onEditorChange="handleEditorChange"
  />
</template>
