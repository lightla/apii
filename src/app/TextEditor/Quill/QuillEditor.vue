<template>
  <div class="quill-container">
    <!-- Component QuillEditor đã có sẵn mọi thứ -->
    <BaseQuillEditor
        theme="snow"
        toolbar="full"
        v-model:content="editorContent"
        contentType="html"
    />
  </div>

  <!-- Hiển thị nội dung để kiểm tra -->
  <div class="content-preview">
    <h3>Nội dung đang soạn thảo (dạng HTML):</h3>
    <pre>{{ editorContent }}</pre>
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 1. Import component và CSS
import { QuillEditor as BaseQuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'; // CSS cho theme "Snow"

// 2. Tạo một ref để lưu trữ nội dung của trình soạn thảo
const editorContent = ref('<p>Xin chào VueQuill! 🎉</p>');

</script>

<style>
.quill-container {
  height: 300px; /* Cho trình soạn thảo có chiều cao cố định */
  display: flex;
  flex-direction: column;
}

/* Đảm bảo trình soạn thảo chiếm hết không gian container */
.ql-container.ql-snow {
  flex-grow: 1;
  overflow-y: auto;
}

.content-preview {
  margin-top: 50px; /* Thêm khoảng cách để dễ nhìn */
  border: 1px solid #eee;
  padding: 10px;
}

.content-preview pre {
  white-space: pre-wrap; /* Cho phép xuống dòng */
  word-wrap: break-word;
}
</style>
