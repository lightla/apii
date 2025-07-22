<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import type { RouteInfo } from '@/types'
import ResponseJsonTab
  from "@/app/Request/Editor/Response/JsonTab/ResponseJsonTab.vue";
import ResponseHtmlTab
  from "@/app/Request/Editor/Response/HtmlTab/ResponseHtmlTab.vue";
import ResponseRawTab
  from "@/app/Request/Editor/Response/RawTab/ResponseRawTab.vue";
import ToggleLeftIcon from "@/assets/svg/feathericons/toggle-left.svg";
import ToggleRightIcon from "@/assets/svg/feathericons/toggle-right.svg";

const props = defineProps<{
  route: RouteInfo
}>()

const emit = defineEmits(['toggleShowTabDetail'])

const tabs = [
  { id: 'json', name: 'JSON', 'component': ResponseJsonTab },
  { id: 'html', name: 'HTML', 'component': ResponseHtmlTab },
  { id: 'raw', name: 'Raw', 'component': ResponseRawTab },
];

const activeTab = ref('params'); // Tab mặc định

const toggleResponseTabDetail = ref(true); // Tab mặc định

const currentComponent = shallowRef<
    typeof ResponseJsonTab
    | typeof ResponseHtmlTab
    | typeof ResponseRawTab
>(ResponseJsonTab);

const switchTab = (tabId: string) => {
  console.log('Switching to tabId:', tabId); // Debug tabId

  activeTab.value = tabId;

  const tab = tabs.find(tab => tab.id === tabId);

  console.log('Found tab:', tab); // Debug tab

  currentComponent.value = tab?.component || ResponseJsonTab;

  console.log('Current Component Value:', currentComponent.value); // Debug value
};

const clickToggleResponseTabDetail = (event: MouseEvent) => {
  toggleResponseTabDetail.value = ! toggleResponseTabDetail.value

  emit('toggleShowTabDetail', 'response', toggleResponseTabDetail.value)
}
</script>

<template>
  <div class="response" :data-tab-detail-active="toggleResponseTabDetail">
    <div class="response-tab-container">
      <!-- Tabs -->
      <div class="response-tabs">
        <div class="tab"
             v-for="tab in tabs"
             :key="tab.id"
             :class="{ active: activeTab === tab.id }"
             :data-tab="tab.id"
             @click="switchTab(tab.id)">
          {{ tab.name }}
        </div>
      </div>
      <div class="response-tab-toggle">
        <ToggleRightIcon v-if="toggleResponseTabDetail" @click="clickToggleResponseTabDetail" class="env-action-svg"/>
        <ToggleLeftIcon v-else @click="clickToggleResponseTabDetail" class="env-action-svg"/>
      </div>
    </div>
    <div class="tab-detail" v-if="toggleResponseTabDetail">
      <component v-if="currentComponent" :is="currentComponent" :route="props.route" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.response {
  min-height: 0;
  border-bottom: 1px solid #888888;

  &[data-tab-detail-active="false"] {
    min-height: auto;

    .response-tab-container {
      border-bottom: none;
    }
  }
}

.response-tab-container {
  display: flex;
  flex-direction: row;
  border-bottom: var(--tab-border);
  background-color: var(--tab-bg-color);
  align-items: center;
  justify-content: space-between;
  padding-right: 5px;
}


.response-tabs {
  display: flex;
  flex-direction: row;
}

.tab {
  padding: 9px 15px;
  height: 100%;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s, border-bottom-color 0.2s;

  &.active {
    background-color: var(--tab-bg-color-active);
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
    fill: var(--tab-bg-color-active);
  }
}

.tab-detail {
  //height: 230px;
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
  //border: 1px solid #aaaaaa;
  padding: 10px 8px;
}
</style>
