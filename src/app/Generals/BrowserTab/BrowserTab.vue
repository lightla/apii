<!-- D:\dev\Vue\apii-app\src\app\Generals\BrowserTab\BrowserTab.vue -->
<script setup>
// Sử dụng defineModel để tạo v-model hai chiều một cách đơn giản (Vue 3.4+)
defineModel('content');

defineProps({
  title: { type: String, required: true },
});
</script>

<template>
  <!-- Component này không render trực tiếp, nó chỉ là một cấu trúc dữ liệu -->
  <div>
    <slot :content="content" :update-content="newValue => content = newValue"></slot>
  </div>
</template>
