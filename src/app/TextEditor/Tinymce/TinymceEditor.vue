<template>
  <div class="text-editor-container">
    <!-- Hiển thị thông báo tải, sẽ bị ẩn khi editor sẵn sàng -->
    <div v-if="!isEditorReady" class="loading-placeholder">
      Đang tải trình soạn thảo...
    </div>

    <!-- Editor sẽ được render ở đây -->
    <editor
        :api-key="'b6pcy8rp403qycqp3kyrrzpr6awhnjst37t7v393zztq8mfv'"
        :init="editorConfig"
        v-model="editorContent"
        @change="handleContentChange"
        @init="onEditorInit"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import Editor from '@tinymce/tinymce-vue';

// --- PROPS ---
const props = defineProps({
  storageKey: {
    type: String,
    required: true
  }
});

// --- STATE ---
const editorContent = ref('');
const isEditorReady = ref(false); // State để kiểm soát việc hiển thị

// --- CONFIGURATION ---
// Cấu hình thanh công cụ đã được làm gọn gàng và chuyên nghiệp hơn
const editorConfig = {
  height: 450,
  menubar: false, // Tắt menu bar (File, Edit, View...)
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
    'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'codesample'
  ],
  toolbar:
      'undo redo | ' +
      'styles | bold italic underline | forecolor backcolor | ' +
      'alignleft aligncenter alignright | bullist numlist | ' +
      'codesample | table | link | removeformat',
  // Thêm menu 'styles' để chọn các định dạng như Heading 1, 2, 3...
  style_formats: [
    { title: 'Paragraph', format: 'p' },
    { title: 'Heading 1', format: 'h1' },
    { title: 'Heading 2', format: 'h2' },
    { title: 'Heading 3', format: 'h3' },
    { title: 'Code', format: 'code' },
  ],
  // Tự động nhận diện theme sáng/tối của hệ thống
  skin: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oxide-dark' : 'oxide'),
  content_css: (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default'),
  content_style: `
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 15px;
      line-height: 1.6;
      padding: 10px;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: "Courier New", Courier, monospace;
    }
  `,
};

// --- METHODS ---
const handleContentChange = () => {
  if (props.storageKey && isEditorReady.value) {
    localStorage.setItem(props.storageKey, editorContent.value);
  }
};

const loadContent = () => {
  if (props.storageKey) {
    const savedContent = localStorage.getItem(props.storageKey);
    // Chỉ đặt nội dung mặc định nếu không có gì trong storage
    editorContent.value = savedContent || '';
  }
};

// Hàm này sẽ được gọi khi editor đã khởi tạo xong
const onEditorInit = () => {
  isEditorReady.value = true;
  // Đặt nội dung mặc định nếu editor trống sau khi tải
  if (!editorContent.value) {
    editorContent.value = '<p>Bắt đầu ghi chú tại đây...</p>';
  }
};

// --- LIFECYCLE & WATCHERS ---
onMounted(() => {
  loadContent();
});

watch(() => props.storageKey, (newKey, oldKey) => {
  if (newKey !== oldKey) {
    isEditorReady.value = false; // Reset trạng thái khi đổi key
    loadContent();
  }
}, { immediate: true });

</script>

<style scoped>
.text-editor-container {
  position: relative;
  min-height: 200px; /* Chiều cao tối thiểu để placeholder hiển thị */
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden; /* Giúp bo góc được áp dụng cho editor bên trong */
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #888;
  font-style: italic;
}

/* Ẩn editor cho đến khi nó sẵn sàng để tránh bị "nhảy" layout */
:deep(.tox-tinymce) {
  visibility: hidden;
}
:deep(.tox-tinymce.tox-tinymce-init) {
  visibility: visible;
}
</style>
