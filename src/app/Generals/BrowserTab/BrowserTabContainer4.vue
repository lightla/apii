<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button class="scroll-button left" :class="{ visible: showScrollButtons }" @click="scrollTabs(-200)" :disabled="isScrollStart">‹</button>
      <div class="tabs-list-wrapper" ref="tabsWrapperRef" @wheel.prevent="handleWheelScroll">
        <div class="tabs-list" ref="tabsListRef">
          <BrowserTab4
              v-for="tab in internalTabs"
              :key="tab.id"
              :id="tab.id"
              :title="tab.title"
              :isActive="tab.id === activeTabId"
              :isEditing="tab.isEditing"
              @tab-select="selectTab"
              @tab-edit="startEditing"
              @tab-close="closeTab"
              @tab-mousedown="handleMouseDown"
              @tab-title-change="finishEditing"
              @tab-cancel-edit="cancelEditing"
          />
        </div>
      </div>
      <button class="scroll-button right" :class="{ visible: showScrollButtons }" @click="scrollTabs(200)" :disabled="isScrollEnd">›</button>
      <button class="add-tab-button" @click="addTab">+</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import BrowserTab4 from './BrowserTab4.vue';

export default {
  name: 'BrowserTabContainer4',
  components: {
    BrowserTab4
  },
  props: {
    tabs: { type: Array, default: () => [] },
    newTabDefault: { type: Object, default: () => ({ title: 'New Tab', content: '' }) }
  },
  emits: [
    'tab-added',
    'tab-activated',
    'tab-closed',
    'tab-body-changed',
    'tab-title-changed'
  ],
  setup(props, { emit }) {
    const internalTabs = ref(props.tabs && props.tabs.length > 0 ? JSON.parse(JSON.stringify(props.tabs)) : []);
    const activeTabId = ref(internalTabs.value.length > 0 ? internalTabs.value[0].id : null);
    const tabsWrapperRef = ref(null);
    const tabsListRef = ref(null);

    const showScrollButtons = ref(false);
    const isScrollStart = ref(true);
    const isScrollEnd = ref(false);

    const selectTab = (tabId) => {
      if (activeTabId.value !== tabId) {
        activeTabId.value = tabId;
        emit('tab-activated', tabId);
        scrollTabIntoView(tabId);
      }
    };

    const addTab = () => {
      const newTab = {
        ...JSON.parse(JSON.stringify(props.newTabDefault)),
        id: `tab_${Date.now()}_${internalTabs.value.length + 1}`,
        title: `${props.newTabDefault.title || 'Request'} ${internalTabs.value.length + 1}`
      };

      internalTabs.value.push(newTab);
      selectTab(newTab.id);
      scrollTabIntoView(newTab.id);

      emit('tab-added', newTab);
    };

    const closeTab = (tabId) => {
      const index = internalTabs.value.findIndex(t => t.id === tabId);
      if (index === -1) return;

      const wasActive = activeTabId.value === tabId;
      const closedTab = internalTabs.value[index];
      internalTabs.value.splice(index, 1);

      emit('tab-closed', closedTab);

      if (wasActive && internalTabs.value.length > 0) {
        const newActiveIndex = Math.max(0, index - 1);
        selectTab(internalTabs.value[newActiveIndex].id);
      } else if (internalTabs.value.length === 0) {
        activeTabId.value = null;
        emit('tab-activated', null);
      }

      nextTick(checkScroll);
    };

    const startEditing = (tabId) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab) tab.isEditing = true;
    };

    const finishEditing = (tabId, newTitle) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab && tab.isEditing) {
        if (newTitle.trim()) {
          tab.title = newTitle.trim();
          emit('tab-title-changed', { tabId, newTitle: newTitle.trim() });
        }
        tab.isEditing = false;
      }
    };

    const cancelEditing = (tabId) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab) tab.isEditing = false;
    };

    const handleMouseDown = (tabId, event) => {
      if (event.button === 1) closeTab(tabId);
    };

    const scrollTabIntoView = (tabId) => {
      nextTick(() => {
        const tabElement = tabsListRef.value?.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    };

    const checkScroll = () => {
      const w = tabsWrapperRef.value;
      if (!w) return;
      const h = w.scrollWidth > w.clientWidth;
      showScrollButtons.value = h;
      if (h) {
        isScrollStart.value = w.scrollLeft <= 0;
        isScrollEnd.value = w.scrollLeft >= w.scrollWidth - w.clientWidth - 1;
      }
    };

    const scrollTabs = (amount) => tabsWrapperRef.value?.scrollBy({ left: amount, behavior: 'smooth' });
    const handleWheelScroll = (event) => {
      if (tabsWrapperRef.value) tabsWrapperRef.value.scrollLeft += event.deltaY;
    };

    onMounted(() => {
      window.addEventListener('resize', checkScroll);
      tabsWrapperRef.value?.addEventListener('scroll', checkScroll);
      nextTick(checkScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkScroll);
      tabsWrapperRef.value?.removeEventListener('scroll', checkScroll);
    });

    return {
      internalTabs,
      activeTabId,
      tabsWrapperRef,
      tabsListRef,
      showScrollButtons,
      isScrollStart,
      isScrollEnd,
      selectTab,
      addTab,
      closeTab,
      startEditing,
      finishEditing,
      cancelEditing,
      handleMouseDown,
      scrollTabs,
      handleWheelScroll,
      checkScroll
    };
  }
};
</script>

<style scoped>
/* Styles are copied from the original component and remain unchanged */
.tabs-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.tabs-header {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  border-bottom: 1px solid #dcdcdc;
  padding: 5px 10px;
  flex-shrink: 0;
}

.scroll-button {
  flex-shrink: 0;
  width: 30px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #aaaaaa;
  background-color: #f7f7f7;
  cursor: pointer;
  font-size: 18px;
  display: none;
  place-items: center;
  transition: opacity 0.2s, cursor 0.2s;
  z-index: 1;
}

.scroll-button:hover:not(:disabled) {
  background-color: #e9e9e9;
}

.scroll-button.visible {
  display: grid;
}

.scroll-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabs-list-wrapper {
  flex-grow: 1;
  overflow: hidden;
  position: relative;
  display: flex;
}

.tabs-list {
  display: flex;
  flex-wrap: nowrap;
  position: relative;
}

.add-tab-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #dcdcdc;
  background-color: #f7f7f7;
  color: #333;
  font-size: 22px;
  cursor: pointer;
  margin-left: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s;
}

.add-tab-button:hover {
  background-color: #e9e9e9;
}

.tabs-content {
  flex-grow: 1;
  position: relative;
  overflow: auto;
}
.tab-content-item {
  width: 100%;
  height: 100%;
}

.tab-content-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #999;
  font-style: italic;
}
</style>
