<template>
  <!-- HTML không đổi -->
  <div
      class="tab-header-button"
      :class="{ active: isActive }"
      @click="$emit('select')"
      @dblclick="$emit('start-edit')"
      :data-tab-id="id"
  >
    <span v-if="!isEditing" class="tab-title" :title="title">{{ title }}</span>
    <input
        v-else
        ref="inputRef"
        type="text"
        :value="title"
        class="tab-title-input"
        @blur="event => $emit('finish-edit', event.target.value)"
        @keydown.enter.prevent="event => $emit('finish-edit', event.target.value)"
        @keydown.esc.prevent="$emit('cancel-edit')"
    />
    <button class="close-tab-button" @click.stop="$emit('close')">&times;</button>
  </div>
</template>

<script setup>
// Script không đổi
import { ref, watch, nextTick } from 'vue';
const props = defineProps({ id: [String, Number], title: String, isActive: Boolean, isEditing: Boolean });
defineEmits(['select', 'close', 'start-edit', 'finish-edit', 'cancel-edit']);
const inputRef = ref(null);
watch(() => props.isEditing, (isEditing) => {
  if (isEditing) {
    nextTick(() => { inputRef.value?.focus(); });
  }
});
</script>

<style scoped>
.tab-header-button {
  position: relative;
  display: flex;
  align-items: center;
  /* SỬA LỖI: Bỏ flex-shrink: 0. Cho phép nút co lại nếu cần. */
  /* flex-shrink: 0; */
  padding: 8px 30px 8px 15px;
  cursor: pointer;
  border: 1px solid #ccc;
  border-bottom: none;
  margin-right: -1px;
  background-color: #f0f0f0;
  white-space: nowrap;
  max-width: 220px;
  min-width: 100px; /* Thêm min-width để không bị quá nhỏ */
}
.tab-header-button.active {
  background-color: #fff;
  z-index: 1;
  border-bottom-color: #fff;
}
.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-title-input {
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  outline: 1px solid #007aff;
  width: 100%;
}
.close-tab-button {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  padding: 0 5px;
  border-radius: 4px;
}
.close-tab-button:hover {
  background-color: #e0e0e0;
}
</style>
