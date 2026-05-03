<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import type { RouteInfo } from '@/types'

import PayloadParamTab from '@/app/Request/Editor/Payload/ParamTab/PayloadParamTab.vue'
import PayloadHeaderTab from '@/app/Request/Editor/Payload/HeaderTab/PayloadHeaderTab.vue'
import PayloadBodyTab from '@/app/Request/Editor/Payload/BodyTab/PayloadBodyTab.vue'
import PayloadPresetTab from '@/app/Request/Editor/Payload/PresetTab/PresetTab.vue'
import PayloadHistoryTab from '@/app/Request/Editor/Payload/HistoryTab/PayloadHistoryTab.vue'
import ToggleLeftIcon from '@/assets/svg/feathericons/toggle-left.svg'
import ToggleRightIcon from '@/assets/svg/feathericons/toggle-right.svg'
import ToggleMenuItemDetail from '@/app/Generals/ToggleMenu/ToggleMenuItemDetail.vue'
import ToggleMenuItemAction from '@/app/Generals/ToggleMenu/ToggleMenuItemAction.vue'
import SwitchableTabs from '@/app/Generals/SwitchableTab/SwitchableTabs.vue'
import SwitchableTab from '@/app/Generals/SwitchableTab/SwitchableTab.vue'
import ScrollContainer from "@/app/Generals/ScrollContainer/ScrollContainer.vue";

const props = defineProps<{ route: RouteInfo, storageKey?: string }>()

// --- Logic Toggle (Giữ nguyên) ---
const toggleStates = inject<Ref<Map<string, boolean>>>('toggleStates')!
const toggleMenuItemIdRef = inject<Ref<string>>('toggleMenuItemIdRef')!
const toggleActive = ref(true)
onMounted(() => {
  toggleActive.value = toggleStates.value.get(toggleMenuItemIdRef.value) ?? true
})
watch(() => toggleStates.value.get(toggleMenuItemIdRef.value), (val) => {
  toggleActive.value = val ?? true
})

// --- Định nghĩa danh sách Tabs ---
const tabs = [
  { id: 'params', name: 'Params', component: PayloadParamTab },
  { id: 'headers', name: 'Headers', component: PayloadHeaderTab },
  { id: 'body', name: 'Body', component: PayloadBodyTab },
  { id: 'presets', name: 'Presets', component: PayloadPresetTab },
  { id: 'history', name: 'History', component: PayloadHistoryTab },
]
</script>

<template>
  <div class="payload" :data-tab-detail-active="toggleActive">
    <SwitchableTabs :tabs="tabs" :default-active-tab-index="0">

      <template #actions>
        <div class="tab-bar-right">
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
              <component :is="tab.component" :route="props.route" :storage-key="props.storageKey ?? props.route.id" />
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
    height: auto;
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
