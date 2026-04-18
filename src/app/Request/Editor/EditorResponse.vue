<script setup lang="ts">
import { ref, inject, onMounted, watch, computed } from 'vue'
import type { Ref } from 'vue'
import type { RouteInfo } from '@/types'

import ToggleLeftIcon from '@/assets/svg/feathericons/toggle-left.svg'
import ToggleRightIcon from '@/assets/svg/feathericons/toggle-right.svg'
import ToggleMenuItemDetail from '@/app/Generals/ToggleMenu/ToggleMenuItemDetail.vue'
import ToggleMenuItemAction from '@/app/Generals/ToggleMenu/ToggleMenuItemAction.vue'
import SwitchableTabs from '@/app/Generals/SwitchableTab/SwitchableTabs.vue'
import SwitchableTab from '@/app/Generals/SwitchableTab/SwitchableTab.vue'
import ResponseJsonTab from "@/app/Request/Editor/Response/JsonTab/ResponseJsonTab.vue";
import ResponseHtmlTab from "@/app/Request/Editor/Response/HtmlTab/ResponseHtmlTab.vue";
import ResponseRawTab from "@/app/Request/Editor/Response/RawTab/ResponseRawTab.vue";
import ResponseNetworkTab from "@/app/Request/Editor/Response/NetworkTab/ResponseNetworkTab.vue";
import { useResponseStorage } from '@/storages/response.ts'

const props = defineProps<{ route: RouteInfo }>()

// --- Logic Toggle ---
const toggleStates = inject<Ref<boolean[]>>('toggleStates')!
const toggleMenuItemIndexRef = inject<Ref<number>>('toggleMenuItemIndexRef')!

const toggleActive = ref(true)
onMounted(() => {
  toggleActive.value = toggleStates.value[toggleMenuItemIndexRef.value]
})
watch(() => toggleStates.value[toggleMenuItemIndexRef.value], (val) => {
  toggleActive.value = val
})

// --- Response store for status badge ---
const response = useResponseStorage()

const statusColor = computed(() => {
  const s = response.status
  if (!s) return '#888'
  if (s < 300) return '#2e7d32'
  if (s < 400) return '#e65100'
  return '#c62828'
})

const statusBgColor = computed(() => {
  const s = response.status
  if (!s) return 'transparent'
  if (s < 300) return '#e8f5e9'
  if (s < 400) return '#fff3e0'
  return '#ffebee'
})

const responseSize = computed(() => {
  if (response.data === null) return null
  const text = typeof response.data === 'string'
    ? response.data
    : JSON.stringify(response.data)
  const bytes = new TextEncoder().encode(text).length
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(2)} KB`
})

// --- Định nghĩa danh sách Tabs ---
const tabs = [
  { id: 'json', name: 'JSON', 'component': ResponseJsonTab },
  { id: 'html', name: 'HTML', 'component': ResponseHtmlTab },
  { id: 'raw', name: 'Raw', 'component': ResponseRawTab },
  { id: 'network', name: 'Network', 'component': ResponseNetworkTab },
];
</script>

<template>
  <div class="payload" :data-tab-detail-active="toggleActive">
    <SwitchableTabs :tabs="tabs" :default-active-tab-index="0">

      <template #actions>
        <div class="tab-bar-right">
          <div v-if="response.loading" class="status-badge loading">
            <span class="dot-loader"></span>
          </div>
          <div v-else-if="response.status !== null" class="status-badge">
            <span class="chip-status" :style="{ color: statusColor, background: statusBgColor }">{{ response.status }}</span>
            <span class="chip-meta" v-if="response.responseTime !== null">{{ response.responseTime }}ms</span>
            <span class="chip-meta" v-if="responseSize">{{ responseSize }}</span>
          </div>
          <ToggleMenuItemAction class="tab-toggle">
            <ToggleRightIcon v-if="toggleActive" class="env-action-svg" />
            <ToggleLeftIcon v-else class="env-action-svg" />
          </ToggleMenuItemAction>
        </div>
      </template>

      <ToggleMenuItemDetail>
        <div class="tab-detail">
          <div class="tab-detail-content-wrap">
            <SwitchableTab v-for="(tab, index) in tabs" :key="tab.id" :index="index">
              <component :is="tab.component" :route="props.route" />
            </SwitchableTab>
          </div>
        </div>
      </ToggleMenuItemDetail>

    </SwitchableTabs>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/elements";

.payload {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  gap: 10px;

  &[data-tab-detail-active="false"] {
    min-height: auto;
  }
}

.tab-bar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-right: 4px;

  :deep(.toggle-menu-item-action) {
    position: relative;
    top: auto;
    right: auto;
  }
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.chip-status {
  font-weight: 700;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.chip-meta {
  font-size: 12px;
  color: #444;
  background: #e8e8e8;
  padding: 2px 7px;
  border-radius: 10px;
}

.dot-loader {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #888;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}

.env-action-svg {
  cursor: pointer;
  display: block;
  height: 32px;
  width: auto;
  stroke-width: 1;
  transform: scale(1.1, 1.0);

  &:hover {
    fill: #cccccc;
  }
}

.tab-detail {
  overflow: hidden;
  padding: 0;
  flex: 1;
  display: flex;
  min-height: 0;
}

.tab-detail-content-wrap {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;

  & > :deep(div) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
}
</style>