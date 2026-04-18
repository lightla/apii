<template>
  <div
      class="tab-button"
      :class="{ active: isActive }"
      @click="$emit('tab-select', id)"
      @dblclick="$emit('tab-edit', id)"
      @mousedown="$emit('tab-mousedown', id, $event)"
      :data-tab-id="id"
  >
    <span v-if="!isEditing" class="tab-title" :title="title">{{ title }}</span>
    <input
        v-else
        ref="inputRef"
        type="text"
        :value="title"
        class="tab-title-input"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="$emit('tab-cancel-edit', id)"
    />
    <button class="close-tab-button" @click.stop="$emit('tab-close', id)">&times;</button>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';

export default {
  name: 'BrowserTab2',
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isEditing: { type: Boolean, default: false }
  },
  emits: ['tab-select', 'tab-edit', 'tab-close', 'tab-mousedown', 'tab-title-change', 'tab-cancel-edit'],
  setup(props, { emit }) {
    const inputRef = ref(null);

    const handleBlur = (event) => {
      emit('tab-title-change', props.id, event.target.value);
    };

    const handleEnter = (event) => {
      event.preventDefault();
      emit('tab-title-change', props.id, event.target.value);
    };

    // Focus input khi bắt đầu edit
    if (props.isEditing) {
      nextTick(() => {
        inputRef.value?.focus();
      });
    }

    return {
      inputRef,
      handleBlur,
      handleEnter
    };
  }
};
</script>

<style scoped>
/* Copy CSS tab-button từ file gốc */
.tab-button {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 100px;
  max-width: 220px;
  height: 36px;
  padding: 0 15px;
  padding-right: 35px;
  cursor: pointer;
  border-top: 1px solid #aaaa;
  border-bottom: 1px solid #aaaa;
  border-right: 1px solid #aaaa;
  background-color: transparent;
  font-size: 14px;
  color: #333;
  position: relative;
  transition: background-color 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.tab-button .tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.tab-title-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  height: 100%;
  padding: 0;
  margin: 0;
  outline: none;
  flex-grow: 1;
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  background-color: #e9e9e9;
}

.tab-button.active {
  background-color: #ffffff;
}

.close-tab-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
  color: #666;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  flex-shrink: 0;
}

.close-tab-button:hover {
  background-color: #dcdcdc;
  color: #000;
}
</style>