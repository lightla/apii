<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ tags: string[] }>()
const emit = defineEmits(['add', 'remove'])

const newTag = ref('')
const searchKeyword = ref('')

const filteredTags = computed(() =>
    props.tags.filter(tag => tag.toLowerCase().includes(searchKeyword.value.toLowerCase()))
)

function handleAdd() {
  const tag = newTag.value.trim()
  if (tag) {
    emit('add', tag)
    newTag.value = ''
  }
}
</script>

<template>
  <div class="tag-selection-box">
    <input v-model="newTag" placeholder="Thêm tag mới..." @keyup.enter="handleAdd" />
    <button @click="handleAdd">+</button>

    <input v-model="searchKeyword" placeholder="Tìm tag..." />

    <div class="tag-list">
      <RequestTag
          v-for="tag in filteredTags"
          :key="tag"
          :tag="tag"
          @remove="emit('remove', tag)"
      />
    </div>
  </div>
</template>

<style scoped>
.tag-selection-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>