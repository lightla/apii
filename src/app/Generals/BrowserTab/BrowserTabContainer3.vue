<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button class="scroll-button left" :class="{ visible: showScrollButtons }" @click="scrollTabs(-200)" :disabled="isScrollStart">‹</button>
      <div class="tabs-list-wrapper" ref="tabsWrapperRef" @wheel.prevent="handleWheelScroll">
        <div class="tabs-list" ref="tabsListRef">
          <BrowserTab3
              v-for="(tab, index) in parsedTabs"
              :key="tab.id"
              :id="tab.id"
              :title="tab.title"
              :isActive="index === activeTabIndex"
              :isEditing="tab.isEditing"
              :isHeaderTab="true"
              @tab-select="() => selectTab(index)"
              @tab-close="() => closeTab(index)"
              @tab-mousedown="handleMouseDown"
              @tab-edit="() => startEditing(index)"
              @tab-title-change="finishEditing"
              @tab-cancel-edit="() => cancelEditing(index)"
          />
        </div>
      </div>
      <button class="scroll-button right" :class="{ visible: showScrollButtons }" @click="scrollTabs(200)" :disabled="isScrollEnd">›</button>
      <button class="add-tab-button" @click="addTab">+</button>
    </div>
    <div class="tabs-content">
      <div v-if="parsedTabs[activeTabIndex]" class="tab-content-item" :key="parsedTabs[activeTabIndex].id">
        <component :is="parsedTabs[activeTabIndex].content" />
      </div>
      <div v-else class="tab-content-placeholder">
        <span>Không có tab nào được chọn.</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, useSlots, onMounted, onUnmounted, nextTick, h } from 'vue';
import BrowserTab3 from './BrowserTab3.vue';

export default {
  name: 'BrowserTabContainer3',
  components: {
    BrowserTab3
  },
  emits: [
    'tabs-changed',
    'active-tab-changed',
    'tab-after-added',
    'tab-after-closed',
    'tab-after-selected',
    'tab-edit',
    'tab-title-change'
  ],
  setup(props, { emit }) {
    const slots = useSlots();
    const parsedTabs = ref([]);
    const activeTabIndex = ref(0);
    const tabsWrapperRef = ref(null);
    const tabsListRef = ref(null);
    const showScrollButtons = ref(false);
    const isScrollStart = ref(true);
    const isScrollEnd = ref(false);

    // Đếm và lấy thông tin từ các <BrowserTab3> trong slot mặc định
    const parseTabsFromSlots = () => {
      const defaultSlots = slots.default ? slots.default() : [];
      parsedTabs.value = defaultSlots
          .filter(node => node.type && node.type.name === 'BrowserTab3')
          .map((node, index) => ({
            id: node.props?.id || `tab_${index}_${Date.now()}`,
            title: node.props?.title || `Tab ${index + 1}`,
            isEditing: node.props?.isEditing || false,
            content: () => h('div', { class: 'tab-content-pane' }, node.children?.default ? node.children.default() : [])
          }));
      if (activeTabIndex.value >= parsedTabs.value.length) {
        activeTabIndex.value = Math.max(0, parsedTabs.value.length - 1);
        emit('active-tab-changed', parsedTabs.value[activeTabIndex.value]?.id || null);
      }
      nextTick(checkScroll);
    };

    // Theo dõi sự thay đổi của slot mặc định
    watch(() => slots.default?.(), parseTabsFromSlots, { immediate: true });

    const selectTab = (index) => {
      if (activeTabIndex.value !== index) {
        activeTabIndex.value = index;
        emit('active-tab-changed', parsedTabs.value[index].id);
        emit('tab-after-selected', parsedTabs.value[index].id);
        scrollTabIntoView(index);
      }
    };

    const addTab = () => {
      const newTab = {
        id: `tab_${Date.now()}_${parsedTabs.value.length + 1}`,
        title: `Request ${parsedTabs.value.length + 1}`,
        content: '',
        isEditing: false
      };
      emit('tab-after-added', newTab);
      selectTab(parsedTabs.value.length);
      scrollTabIntoView(parsedTabs.value.length);
    };

    const closeTab = (index) => {
      const closedTabId = parsedTabs.value[index].id;
      emit('tab-after-closed', closedTabId);
      if (activeTabIndex.value === index) {
        if (parsedTabs.value.length > 1) {
          const newActiveIndex = Math.max(0, index - 1);
          emit('active-tab-changed', parsedTabs.value[newActiveIndex].id);
        } else {
          emit('active-tab-changed', null);
        }
      }
    };

    const startEditing = (index) => {
      parsedTabs.value = parsedTabs.value.map((tab, i) => ({
        ...tab,
        isEditing: i === index
      }));
      emit('tab-edit', parsedTabs.value[index].id);
    };

    const finishEditing = (tabId, newTitle) => {
      const index = parsedTabs.value.findIndex(t => t.id === tabId);
      if (index !== -1 && parsedTabs.value[index].isEditing) {
        if (newTitle.trim()) {
          emit('tab-title-change', tabId, newTitle.trim());
        }
        parsedTabs.value = parsedTabs.value.map((tab, i) => ({
          ...tab,
          isEditing: false
        }));
      }
    };

    const cancelEditing = (index) => {
      parsedTabs.value = parsedTabs.value.map((tab, i) => ({
        ...tab,
        isEditing: i === index ? false : tab.isEditing
      }));
    };

    const handleMouseDown = (tabId, event) => {
      if (event.button === 1) {
        const index = parsedTabs.value.findIndex(t => t.id === tabId);
        closeTab(index);
      }
    };

    const scrollTabIntoView = (index) => {
      nextTick(() => {
        const tabElement = tabsListRef.value?.querySelector(`[data-tab-id="${parsedTabs.value[index].id}"]`);
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
      parsedTabs,
      activeTabIndex,
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
.tabs-container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 20rem;
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

.tab-content-item {
  width: 100%;
  height: 100%;
}

.tab-content-pane {
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