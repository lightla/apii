<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button class="scroll-button left" :class="{ visible: showScrollButtons }" @click="scrollTabs(-200)" :disabled="isScrollStart">‹</button>
      <div class="tabs-list-wrapper" ref="tabsWrapperRef" @wheel.prevent="handleWheelScroll">
        <div class="tabs-list" ref="tabsListRef">
          <BrowserTab2
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
    <div class="tabs-content">
      <div v-if="activeTab" class="tab-content-item" :key="activeTab.id">
        <!-- TAB-BODY NẰM TRONG CONTAINER -->
        <slot name="tab-body" :tab="activeTab" :updateContent="updateTabContent"></slot>
      </div>
      <div v-else class="tab-content-placeholder">
        <span>Không có tab nào được chọn.</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import BrowserTab2 from './BrowserTab2.vue';

export default {
  name: 'BrowserTabContainer2',
  components: {
    BrowserTab2
  },
  props: {
    tabs: { type: Array, default: () => [] },
    activeTab: { type: String, default: null }
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
    const internalTabs = ref(props.tabs && props.tabs.length > 0 ? [...props.tabs] : []);
    const activeTabId = ref(props.activeTab || null);
    const tabsWrapperRef = ref(null);
    const tabsListRef = ref(null);

    const showScrollButtons = ref(false);
    const isScrollStart = ref(true);
    const isScrollEnd = ref(false);

    const activeTab = computed(() => internalTabs.value.find(t => t.id === activeTabId.value));

    // THÊM HÀM UPDATE CONTENT
    const updateTabContent = (tabId, newContent) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab) {
        tab.content = newContent;
        emit('tabs-changed', internalTabs.value); // AUTO SAVE KHI GÕ
      }
    };

    const selectTab = (tabId) => {
      if (activeTabId.value !== tabId) {
        activeTabId.value = tabId;
        emit('active-tab-changed', tabId);
        emit('tab-after-selected', tabId);
        scrollTabIntoView(tabId);
      }
    };

    const addTab = () => {
      const newTab = {
        id: `tab_${Date.now()}_${internalTabs.value.length + 1}`,
        title: `Request ${internalTabs.value.length + 1}`,
        content: '', // Content sẽ được parent cung cấp qua new-tab-body
        isEditing: false
      };

      internalTabs.value.push(newTab);
      selectTab(newTab.id);
      scrollTabIntoView(newTab.id);

      emit('tabs-changed', internalTabs.value);
      emit('tab-after-added', newTab);
    };

    const closeTab = (tabId) => {
      const index = internalTabs.value.findIndex(t => t.id === tabId);
      if (index === -1) return;

      const wasActive = activeTabId.value === tabId;

      // SỬA LỖI: Cho phép xóa tab cuối cùng
      // Bỏ: if (internalTabs.value.length <= 1) return;

      const closedTabId = internalTabs.value[index].id;
      internalTabs.value.splice(index, 1);

      emit('tabs-changed', internalTabs.value);
      emit('tab-after-closed', closedTabId);

      if (wasActive) {
        if (internalTabs.value.length > 0) {
          // Chọn tab liền kề
          const newActiveIndex = Math.max(0, index - 1);
          emit('active-tab-changed', internalTabs.value[newActiveIndex].id);
        } else {
          // Không còn tab nào, báo cho cha biết
          emit('active-tab-changed', null);
        }
      }

      nextTick(checkScroll);
    };

    const startEditing = (tabId) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab) {
        tab.isEditing = true;
        emit('tab-edit', tabId);
      }
    };

    const finishEditing = (tabId, newTitle) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab && tab.isEditing) {
        if (newTitle.trim()) {
          tab.title = newTitle.trim();
          emit('tab-title-change', tabId, newTitle.trim());
          emit('tabs-changed', internalTabs.value);
        }
        tab.isEditing = false;
      }
    };

    const cancelEditing = (tabId) => {
      const tab = internalTabs.value.find(t => t.id === tabId);
      if (tab) {
        tab.isEditing = false;
      }
    };

    const handleMouseDown = (tabId, event) => {
      if (event.button === 1) {
        closeTab(tabId);
      }
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
      activeTab,
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
      checkScroll,
      updateTabContent // THÊM VÀO RETURN
    };
  }
};
</script>

<style scoped>
/* COPY TOÀN BỘ CSS TỪ FILE GỐC */
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

.tab-button {
  flex-grow: 1;
  flex-shrink: 1;
  min-width: 100px;
  max-width: 220px;
  height: 36px;
  padding: 0 15px;
  padding-right: 35px;
  cursor: pointer;
  border-top: 1px solid #aaaa;
  border-bottom: 1px solid #aaaa;
  border-right: 1px solid #aaaa;
  background-color: transparent;
  font-size: 14px;
  color: #333;
  position: relative;
  transition: background-color 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.tab-button .tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  flex-grow: 1;
}

.tab-title-input {
  width: 100%;
  border: none;
  background: transparent;
  font-size: 14px;
  height: 100%;
  padding: 0;
  margin: 0;
  outline: none;
  flex-grow: 1;
}

.tab-button:first-child {
  border-left: 1px solid #aaaa;
}

.tab-button:last-child {
  border-right: 1px solid #aaaa;
}

.tab-button:hover {
  background-color: #e9e9e9;
}

.tab-button.active {
  background-color: #ffffff;
}

.close-tab-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: none;
  background-color: transparent;
  color: #666;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  flex-shrink: 0;
}

.close-tab-button:hover {
  background-color: #dcdcdc;
  color: #000;
}

.tabs-content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
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