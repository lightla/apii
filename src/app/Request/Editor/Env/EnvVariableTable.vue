<script setup lang="ts">
import type { RouteInfo } from '@/types'
import ProxyConfig from "./ProxyConfig.vue";
import EnvListTable from "./EnvListTable.vue";
import EnvVariableListTable from "./EnvVariableListTable.vue";

const props = defineProps<{
  route: RouteInfo
}>()
</script>

<template>
  <div class="env-variable-controls">
    <!-- 1. Component cấu hình Proxy riêng biệt -->
    <ProxyConfig />

    <!-- 2. Khối Wrap chứa 2 bảng ENV (Bố cục chia đôi) -->
    <div class="env-tables-wrap">
      <div class="env-table-split">
        <EnvListTable />
        <EnvVariableListTable />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.env-variable-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  border: none;
  padding: 0;
  height: 100%;
  max-height: 100%;
  min-height: 100%;
  overflow: hidden;
}

.env-tables-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.env-table-split {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  gap: 28px;
  box-sizing: border-box;
  height: 100%;
}
</style>
