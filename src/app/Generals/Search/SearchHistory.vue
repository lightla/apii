<script setup lang="ts">
defineProps<{
  items: string[]
}>()

const emit = defineEmits(['select', 'clear', 'show-all', 'delete-item']) // Thêm sự kiện 'delete-item'
</script>

<template>
  <transition name="search-history-fade">
    <div class="search-history">
      <div class="history-header">
        <span>Lịch sử tìm kiếm</span>
        <div>
          <button @click.stop="emit('show-all')" class="action-btn">Xem tất cả</button>
          <button v-if="items.length > 0" @click.stop="emit('clear')" class="action-btn clear-btn">Xóa tất cả</button>
        </div>
      </div>
      <ul v-if="items.length > 0">
        <li v-for="(item, index) in items" :key="index">
          <!-- Phần nội dung có thể click để chọn -->
          <span class="history-item-text" @mousedown.prevent="emit('select', item)">
            <svg class="history-icon" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"></path><path d="M13 7h-2v6l5.25 3.15.75-1.23-4-2.42V7z"></path></svg>
            <span>{{ item }}</span>
          </span>
          <!-- Nút xóa riêng cho từng mục -->
          <button @mousedown.prevent.stop="emit('delete-item', item)" class="delete-item-btn">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
          </button>
        </li>
      </ul>
      <div v-else class="no-history">
        Chưa có lịch sử tìm kiếm.
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.search-history {
  position: absolute;
  width: 100%;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  margin-top: 5px;
  z-index: 9999; /* Z-INDEX CỰC LỚN ĐỂ ĐẢM BẢO NÓ LUÔN NỔI LÊN TRÊN CÙNG */
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 0.9em;
  color: #666;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.clear-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}

ul {
  list-style: none;
  margin: 0;
  padding: 5px 0;
  max-height: 250px;
  overflow-y: auto;
}

li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  &:hover { background-color: #f0f0f0; }
}

.history-icon {
  width: 16px;
  height: 16px;
  fill: #888;
  flex-shrink: 0;
}

.no-history {
  padding: 20px 12px;
  text-align: center;
  color: #888;
}

/* Hiệu ứng Transition */
.search-history-fade-enter-active,
.search-history-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.search-history-fade-enter-from,
.search-history-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}


.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* ... */
}

.action-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-left: 10px; /* Thêm khoảng cách giữa các nút */
  &:hover { text-decoration: underline; }
}

.clear-btn {
  color: #dc3545; /* Màu đỏ cho nút xóa */
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Đẩy nội dung và nút xóa ra 2 bên */
  padding: 0; /* Bỏ padding của li */
  cursor: default; /* Bỏ cursor pointer của cả dòng */
  &:hover { background-color: #f0f0f0; }
}

.history-item-text {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px; /* Chuyển padding vào đây */
  flex-grow: 1; /* Cho phép phần text chiếm hết không gian còn lại */
  cursor: pointer; /* Đặt cursor pointer ở đây */
}

.delete-item-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;

  svg {
    width: 16px;
    height: 16px;
    fill: #999;
  }

  &:hover svg {
    fill: #333;
  }
}

</style>
