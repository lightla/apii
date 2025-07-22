<script setup lang="ts">
import { computed } from 'vue'
import type { RouteInfo } from '@/types'

const props = defineProps<{
  requests: RouteInfo[]
}>()

const emit = defineEmits(['click'])

const grouped = computed(() => {
  const result: Record<string, RouteInfo[]> = {};

  for (const item of props.requests) {
    const group = item.group || 'UNGROUPED';

    if (!result[group]) {
      result[group] = []; // Nếu chưa có nhóm, khởi tạo mảng rỗng
    }

    result[group].push(item); // Thêm item vào nhóm tương ứng
  }

  return result;
});

function handleClick(item: RouteInfo) {
  console.log('Selected route:', item)

  emit('click', item)
}

function formatRoute(route: string) {
  return route.replace(/{([^}]+)}/g, (_, key) => {
    return `<span style="color: green;">{${key}}</span>`
  })
}
</script>

<template>
  <div class="request-list">
    <template v-for="(groupItems, groupName) in grouped" :key="groupName">
<!--      <hr class="hr-group-separator" />-->
      <div class="group-title">{{ groupName }}</div>
      <div
        v-for="item in groupItems"
        :key="item.method + item.route"
        class="route-line"
        :data-method="item.method || ''"
        :data-route="item.route"
        @click="handleClick(item)"
      >
        <span style="color: blue">{{ item.method || 'POST' }} </span>
        <span v-html="formatRoute(item.route)" :title="item.route"></span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.group-title {
    font-weight: bold;
    margin-bottom: 10px;
}

.route-line {
    cursor: pointer;
    color: black;
    display: block;
    padding: 3px 6px;
    margin-bottom: 4px;
    line-height: 1.3;
    user-select: none;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.route-line:hover {
    background: #e2e2e2;
}
</style>
