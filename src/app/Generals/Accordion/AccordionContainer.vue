<!-- AccordionContainer.vue -->
<template>
  <div class="accordion-container">
    <slot></slot>
  </div>
</template>

<script setup>
// Component này hiện tại không cần logic, chỉ cần template và style.
</script>

<style scoped>
.accordion-container {
  display: flex;
  flex-direction: column;
  gap: 1rem; /* Tạo khoảng cách giữa các mục accordion */
  max-width: 700px;
}
</style>
