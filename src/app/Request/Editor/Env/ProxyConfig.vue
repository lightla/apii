<script setup lang="ts">
import { SquareCheck, Square } from "lucide-vue-next";
import { useRequestParamsStorage } from '@/storages/payload.ts'
import { watch } from 'vue'

const requestParams = useRequestParamsStorage();

// Tự động lưu cấu hình global khi có thay đổi
watch([() => requestParams.useProxy, () => requestParams.proxyUrl], () => {
  requestParams.persistGlobalSettings()
})
</script>

<template>
  <div class="proxy-settings-section">
    <div class="env-variable-table-toolbar">
      <span class="env-variable-table-toolbar-title">CORS PROXY</span>
    </div>
    <div class="proxy-config-wrap">
      <div class="proxy-url-row">
        <div class="cell-icon-action proxy-toggle-icon" @click="requestParams.useProxy = !requestParams.useProxy">
          <SquareCheck v-if="requestParams.useProxy" stroke-width="1" class="icon-button-checkbox"/>
          <Square v-else stroke-width="1" class="icon-button-checkbox"/>
        </div>
        <label class="proxy-label">Proxy URL:</label>
        <input 
          type="text" 
          v-model="requestParams.proxyUrl" 
          placeholder="http://localhost:8080/" 
          class="proxy-input"
          :readonly="!requestParams.useProxy"
          :class="{ 'is-disabled': !requestParams.useProxy }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.proxy-settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.env-variable-table-toolbar {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 8px;
}

.env-variable-table-toolbar-title {
  padding: 5px;
  background-color: rgba(221, 221, 221, 0.65);
  border: 1px solid #888888;
  font-size: 13px;
  font-weight: 500;
}

.proxy-config-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background-color: transparent;
  border: 1px solid #888888;
}

.proxy-url-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.proxy-toggle-icon {
  width: 40px !important;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.proxy-label {
  font-size: 13px;
  font-weight: 500;
  min-width: 80px;
}

.proxy-input {
  flex: 1;
  padding: 5px 10px;
  border: 1px solid #888888;
  font-size: 13px;
  background: transparent; /* Đổi sang trong suốt */
  outline: none;
  transition: all 0.2s ease;
  &:focus {
    border-color: #007bff;
  }
  &.is-disabled {
    background-color: rgba(0, 0, 0, 0.05); /* Xám cực nhẹ khi disabled */
    color: #888;
    cursor: not-allowed;
  }
}

.icon-button-checkbox {
  width: 26px;
  height: 26px;
  fill: var(--icon-bg-color);
  &:hover { fill: var(--icon-bg-color-active); }
}
</style>
