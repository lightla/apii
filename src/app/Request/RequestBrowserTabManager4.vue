<template>
  <div id="app-container">
    <BrowserTabContainer4
        v-if="props.route"
        :tabs="tabsData"
        :new-tab-default="newTabDefault"
        @tab-added="handleTabAdded"
        @tab-closed="handleTabClosed"
        @tab-activated="handleTabActivated"
        @tab-body-changed="handleTabBodyChanged"
        @tab-title-changed="handleTabTitleChanged"
    />

    <div v-if="activeTab" class="tab-content-item" :key="activeTab.id">
      <CodeMirrorContainer2
          :modelValue="activeTab.content"
          :theme="currentTheme"
          @update:modelValue="newContent => handleTabBodyChanged({ tabId: activeTab.id, newContent })"
          @update:theme="handleThemeUpdate"
      />
    </div>
    <div v-else class="tab-content-placeholder">
      <span>Select a tab or create a new one.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import BrowserTabContainer4 from '@/app/Generals/BrowserTab/BrowserTabContainer4.vue';
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue';
import type { RouteInfo } from "@/types/index.js";

const props = defineProps<{
  route: RouteInfo | null
}>();

interface TabData {
  id: string;
  title: string;
  content: string;
}

// --- State Owner ---
const tabsData = ref<TabData[]>([]);
const activeTabId = ref<string | null>(null);
const currentTheme = ref('one-dark');
const newTabDefault = ref({ title: 'New Tab', content: '' });

// Default object for creating new tabs, passed to the container
const activeTab = computed(() => tabsData.value.find(t => t.id === activeTabId.value));

// --- Event Handlers for events from BrowserTabContainer4 ---

const handleTabAdded = (newTab: TabData) => {
  tabsData.value.push(newTab);
  saveStateToLocalStorage();
};

const handleTabClosed = (closedTab: TabData) => {
  const index = tabsData.value.findIndex(t => t.id === closedTab.id);
  if (index > -1) {
    tabsData.value.splice(index, 1);
    saveStateToLocalStorage();
  }
};

const handleTabActivated = (tabId: string | null) => {
  activeTabId.value = tabId;
  saveStateToLocalStorage();
};

const handleTabBodyChanged = ({ tabId, newContent }: { tabId: string, newContent: string }) => {
  const tab = tabsData.value.find(t => t.id === tabId);
  if (tab) {
    tab.content = newContent;
    saveStateToLocalStorage(); // Consider debouncing this for performance
  }
};

const handleTabTitleChanged = ({ tabId, newTitle }: { tabId: string, newTitle: string }) => {
  const tab = tabsData.value.find(t => t.id === tabId);
  if (tab) {
    tab.title = newTitle;
    saveStateToLocalStorage();
  }
};

// --- Persistence ---

const handleThemeUpdate = (newTheme: string) => {
  currentTheme.value = newTheme;
  saveStateToLocalStorage();
};

const createFirstTab = () => {
  return {
    id: `tab_${Date.now()}_1`,
    title: `${newTabDefault.value.title} 1`,
    content: newTabDefault.value.content,
    isEditing: false
  };
};

const loadStateFromLocalStorage = () => {
  if (!props.route?.route) {
    if (tabsData.value.length === 0) {
      const firstTab = createFirstTab();
      tabsData.value = [firstTab];
      activeTabId.value = firstTab.id;
    }
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
        const firstTab = createFirstTab();
        tabsData.value = [firstTab];
        activeTabId.value = firstTab.id;
      }
    } else {
      const firstTab = createFirstTab();
      tabsData.value = [firstTab];
      activeTabId.value = firstTab.id;
    }
  } catch (e) {
    console.error('Error loading state:', e);
    const firstTab = createFirstTab();
    tabsData.value = [firstTab];
    activeTabId.value = firstTab.id;
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
    console.error('Error saving state:', e);
  }
};

watch(() => props.route, (newRoute, oldRoute) => {
  if (newRoute && newRoute.route !== oldRoute?.route) {
    loadStateFromLocalStorage();
  }
}, { immediate: true });

</script>

<style>

#app-container {
  background-color: #f0f2f5;
  box-sizing: border-box;
  border: 1px solid #aaaa;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>