<script setup lang="ts">
import { ref } from 'vue'
import type { RouteInfo } from '@/types'
import EditorEnv from "@/app/Request/Editor/EditorEnv.vue"

const props = defineProps<{
  route: RouteInfo | null
}>()
</script>

<template>
  <div class="settings-panel">
    <template v-if="props.route">
      <div class="settings-section">
        <h2 class="section-title">Environment Settings</h2>
        <div class="env-container">
          <EditorEnv :route="props.route" />
        </div>
      </div>
    </template>
    
    <div v-else class="empty-state">
      <p>Chưa chọn route nào.</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.settings-panel {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.2em;
  color: #333;
}

.settings-section {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.env-container {
  flex: 1;
  min-height: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background-color: #f8f9fa;
}
</style>
