<template>
  <div id="app-container">
    <BrowserTabContainer2
        v-if="props.route"
        :tabs="tabsData"
        :activeTabId="activeTabId"
        @tabs-changed="handleTabsChanged"
        @active-tab-changed="handleActiveTabChanged"
        @tab-after-added="handleTabAdded"
    >
      <template #tab-body="{ tab, updateContent }">
        <!-- Component CodeMirror giờ đây hoàn toàn độc lập -->
        <CodeMirrorContainer2
            :modelValue="tab.content"
            :theme="currentTheme"
            @update:modelValue="newContent => updateContent(tab.id, newContent)"
            @update:theme="handleThemeUpdate"
        />
      </template>
    </BrowserTabContainer2>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BrowserTabContainer2 from '@/app/Generals/BrowserTab/BrowserTabContainer2.vue';
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue';
import type { RouteInfo } from "@/types/index.js";

const props = defineProps<{
  route: RouteInfo | null,
  storageKey?: string
}>();

const tabsData = ref<any[]>([]);
const activeTabId = ref<string | null>(null);
const currentTheme = ref('one-dark');

const handleThemeUpdate = (newTheme: string) => {
  currentTheme.value = newTheme;
  saveStateToLocalStorage();
};

const defaultNewTabContent = JSON.stringify({
  id: `req_new`,
  method: "GET",
  url: "https://api.example.com/data"
}, null, 2 );

const createNewTab = () => {
  const tabCount = tabsData.value.length > 0 ? Math.max(...tabsData.value.map(t => parseInt(t.id.split('_')[2] || 0))) + 1 : 1;
  return {
    id: `tab_${Date.now()}_${tabCount}`,
    title: `Request ${tabCount}`,
    content: defaultNewTabContent,
    isEditing: false
  };
};

const handleTabAdded = (newTab: any) => {
  const tab = tabsData.value.find(t => t.id === newTab.id);
  if (tab) {
    tab.content = defaultNewTabContent;
  }
  saveStateToLocalStorage();
};

const updateContent = (tabId: string, newContent: string) => {
  const tab = tabsData.value.find(t => t.id === tabId);
  if (tab) {
    tab.content = newContent;
    // Cân nhắc dùng debounce ở đây để tối ưu hiệu năng
    saveStateToLocalStorage();
  }
};

const handleTabsChanged = (newTabs: any[]) => {
  tabsData.value = newTabs;
  saveStateToLocalStorage();
};

const handleActiveTabChanged = (tabId: string | null) => {
  activeTabId.value = tabId;
  saveStateToLocalStorage();
};

const loadStateFromLocalStorage = () => {
  const targetId = props.storageKey ?? props.route?.id
  if (!targetId) {
    const newTab = createNewTab();
    tabsData.value = [newTab];
    activeTabId.value = newTab.id;
    return;
  }

  try {
    const saved = localStorage.getItem(`browser_tabs_state_${targetId}`);
    if (saved) {
      const state = JSON.parse(saved);
      tabsData.value = state.tabs || [];
      activeTabId.value = state.activeTabId || null;
      currentTheme.value = state.currentTheme || 'one-dark';

      if (tabsData.value.length === 0) {
        const newTab = createNewTab();
        tabsData.value = [newTab];
        activeTabId.value = newTab.id;
      }
    } else {
      const newTab = createNewTab();
      tabsData.value = [newTab];
      activeTabId.value = newTab.id;
    }
  } catch (e) {
    console.error('Lỗi load state:', e);
    const newTab = createNewTab();
    tabsData.value = [newTab];
    activeTabId.value = newTab.id;
  }
};

const saveStateToLocalStorage = () => {
  const targetId = props.storageKey ?? props.route?.id
  if (!targetId) return;
  try {
    const state = {
      tabs: tabsData.value,
      activeTabId: activeTabId.value,
      currentTheme: currentTheme.value,
    };
    localStorage.setItem(`browser_tabs_state_${targetId}`, JSON.stringify(state));
  } catch (e) {
    console.error('Lỗi save state:', e);
  }
};

watch(() => [props.route?.id, props.storageKey] as const, ([id, storageKey]) => {
  if (id) {
    loadStateFromLocalStorage();
  }
}, { immediate: true });
</script>

<style>

#app-container {
  background-color: #f0f2f5;
  box-sizing: border-box;
  border: 1px solid #aaaa;
}
</style>
