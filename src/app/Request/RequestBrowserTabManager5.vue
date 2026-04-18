<template>
  <div id="app-container">
    <BrowserTabContainer4
        v-if="props.route"
        v-model:activeTabId="activeTabId"
        @tab-add="handleTabAdd"
        @tab-before-close="handleTabBeforeClose"
        @tab-after-closed="handleTabAfterClosed"
        @tab-title-change="handleTabTitleChange"
    >
      <template #tabs>
                            <BrowserTab4
                                v-for="tab in tabsData" :key="tab.id"
                                :id="tab.id"
                                :title="tab.title"
                                :isActive="tab.id === activeTabId"
                                :isEditing="tab.isEditing"
                            >
                              <CodeMirrorContainer2
                                  :modelValue="tab.content"
                                  :theme="currentTheme"
                                  @update:modelValue="newContent => updateTabContent(tab.id, newContent)"
                                  @update:theme="handleThemeUpdate"
                              />
                            </BrowserTab4>      </template>

      <template #default-new-tab>
        <CodeMirrorContainer2
            :modelValue="defaultNewTabContent"
            :theme="currentTheme"
            @update:modelValue="newContent => updateTabContent(activeTabId, newContent)"
            @update:theme="handleThemeUpdate"
        />
      </template>
    </BrowserTabContainer4>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import BrowserTabContainer4 from '@/app/Generals/BrowserTab/BrowserTabContainer4.vue';
import BrowserTab4 from '@/app/Generals/BrowserTab/BrowserTab4.vue';
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue';
import type { RouteInfo } from "@/types/index.js";

const props = defineProps<{
  route: RouteInfo | null
}>();

interface TabData {
  id: string;
  title: string;
  content: string;
  isEditing: boolean;
}

const tabsData = ref<TabData[]>([]);
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

const createNewTabObject = (id?: string, title?: string, content?: string): TabData => {
  const tabCount = tabsData.value.length > 0 ? Math.max(...tabsData.value.map(t => parseInt(t.id.split('_')[2] || '0'))) + 1 : 1;
  return {
    id: id || `tab_${Date.now()}_${tabCount}`,
    title: title || `Request ${tabCount}`,
    content: content || defaultNewTabContent,
    isEditing: false
  };
};

const updateTabContent = (tabId: string, newContent: string) => {
  const tab = tabsData.value.find(t => t.id === tabId);
  if (tab) {
    tab.content = newContent;
    saveStateToLocalStorage();
  }
};


const handleTabAdd = () => {
  const newTab = createNewTabObject();
  tabsData.value.push(newTab);
  activeTabId.value = newTab.id;
  saveStateToLocalStorage();
};

const handleTabBeforeClose = (tabId: string) => {
  // Optional: Perform actions before a tab is closed
  console.log(`Tab ${tabId} is about to be closed.`);
};

const handleTabAfterClosed = (closedTabId: string) => {
  console.log('RequestBrowserTabManager4 - handleTabAfterClosed called for:', closedTabId);
  const index = tabsData.value.findIndex(t => t.id === closedTabId);
  if (index !== -1) {
    tabsData.value.splice(index, 1);

    if (activeTabId.value === closedTabId) {
      if (tabsData.value.length > 0) {
        const newActiveIndex = Math.max(0, index - 1);
        activeTabId.value = tabsData.value[newActiveIndex].id;
      } else {
        activeTabId.value = null;
      }
    }
  }
  saveStateToLocalStorage();
};

const handleTabTitleChange = (tabId: string, newTitle: string) => {
  const tab = tabsData.value.find(t => t.id === tabId);
  if (tab) {
    tab.title = newTitle;
    saveStateToLocalStorage();
  }
};



const loadStateFromLocalStorage = () => {
  if (!props.route?.route) {
    const newTab = createNewTabObject();
    tabsData.value = [newTab];
    activeTabId.value = newTab.id;
    return;
  }

  try {
    const saved = localStorage.getItem(`browser_tabs_state_${props.route.route}`);
    if (saved) {
      const state = JSON.parse(saved);
      tabsData.value = state.tabs || [];
      activeTabId.value = state.activeTabId || null;
      currentTheme.value = state.currentTheme || 'one-dark';

      if (tabsData.value.length === 0) {
        const newTab = createNewTabObject();
        tabsData.value = [newTab];
        activeTabId.value = newTab.id;
      }
    } else {
      const newTab = createNewTabObject();
      tabsData.value = [newTab];
      activeTabId.value = newTab.id;
    }
  } catch (e) {
    console.error('Lỗi load state:', e);
    const newTab = createNewTabObject();
    tabsData.value = [newTab];
    activeTabId.value = newTab.id;
  }
};

const saveStateToLocalStorage = () => {
  if (!props.route?.route) return;
  try {
    const state = {
      tabs: tabsData.value,
      activeTabId: activeTabId.value,
      currentTheme: currentTheme.value,
    };
    localStorage.setItem(`browser_tabs_state_${props.route.route}`, JSON.stringify(state));
  } catch (e) {
    console.error('Lỗi save state:', e);
  }
};

watch(() => props.route, (newRoute, oldRoute) => {
  if (newRoute && newRoute.route !== oldRoute?.route) {
    loadStateFromLocalStorage();
  }
}, { immediate: true });

// Initial load
loadStateFromLocalStorage();
</script>

<style>

#app-container {
  background-color: #f0f2f5;
  box-sizing: border-box;
  border: 1px solid #aaaa;
  height: 100%;
}
</style>