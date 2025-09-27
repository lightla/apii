<!-- AccordionItem.vue -->
<template>
  <details class="accordion-item" :open="startOpen">
    <summary>
      <!-- Slot cho phép tùy chỉnh nội dung summary -->
      <slot name="summary">Tiêu đề mặc định</slot>
    </summary>
    <div class="content">
      <!-- Slot cho phép tùy chỉnh nội dung chi tiết -->
      <slot name="details">
        <p>Nội dung chi tiết mặc định.</p>
      </slot>
    </div>
  </details>
</template>

<script setup>
// Component này bây giờ rất đơn giản, chỉ nhận prop và cung cấp slot.
// Chúng ta quay lại sử dụng hành vi gốc của thẻ <details> để đảm bảo sự đơn giản và ổn định.
defineProps({
  startOpen: {
    type: Boolean,
    default: false
  }
});
</script>

<style scoped>
/*
  CSS này được viết lại để khớp 100% với file HTML bạn cung cấp.
  Nó đơn giản, hiệu quả và không dùng các kỹ thuật phức tạp.
*/

.accordion-item {
  /* margin-bottom sẽ được xử lý bằng 'gap' trong container cha */
  margin-bottom: 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #ffffff;
  overflow: hidden;
}

/*
  ================================================================
  >>> DÒNG CSS QUAN TRỌNG ĐƯỢC THÊM LẠI ĐỂ SỬA LỖI <<<
  ================================================================
*/
.accordion-item[open] > summary::after {
  content: '−'; /* Thay đổi content thành dấu trừ khi mở */
}

summary {
  display: block; /* <<< QUAN TRỌNG: Giữ lại display: block như bản gốc */
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #1d2129;
  cursor: pointer;
  position: relative;
  outline: none;
  list-style: none; /* Xóa marker trên mọi trình duyệt */
}

summary::-webkit-details-marker {
  display: none; /* Xóa marker trên Safari/Chrome */
}

/* YÊU CẦU 2: Thêm màu nền xám nhạt khi hover */
summary:hover {
  background-color: #f7f7f7;
}

/* YÊU CẦU 1: Thêm đường kẻ ngang khi mục được mở */
.accordion-item[open] > summary {
  border-bottom: 1px solid #ddd;
}

/* Biểu tượng '+' và '-' được tạo bằng pseudo-element ::after */
summary::after {
  content: '+';
  font-family: monospace;
  font-size: 1.5rem;
  font-weight: 400;
  color: #8a8d91;
  position: absolute;
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
}


/* Nội dung bên trong */
.content {
  padding-top: 1.5rem; /* Padding đều 4 phía khi hiển thị */
  line-height: 1.6;
  color: #4b4f56;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
