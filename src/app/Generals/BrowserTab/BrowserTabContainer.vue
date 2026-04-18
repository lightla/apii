<template>
  <div class="tabs-container">
    <div class="tabs-header">
      <button class="scroll-button left" :class="{ visible: showScrollButtons }" @click="scrollTabs(-200)" :disabled="isScrollStart">‹</button>
      <div class="tabs-list-wrapper" ref="tabsWrapperRef" @wheel.prevent="handleWheelScroll">
        <div class="tabs-list" ref="tabsListRef">
          <div v-for="tab in tabs" :key="tab.id" class="tab-button" :class="{ active: tab.id === activeTabId }" @click="selectTab(tab.id)" @dblclick="startEditing(tab.id)" @mousedown.prevent="handleMouseDown(tab.id, $event)" :data-tab-id="tab.id">
            <span v-if="!tab.isEditing" class="tab-title" :title="tab.title">{{ tab.title }}</span>
            <input v-else :ref="el => (tab.inputRef = el)" type="text" :value="tab.title" class="tab-title-input" @blur="finishEditing(tab.id, $event)" @keydown.enter.prevent="finishEditing(tab.id, $event)" @keydown.esc.prevent="cancelEditing(tab.id)" />
            <button class="close-tab-button" @click.stop="closeTab(tab.id)">&times;</button>
          </div>
        </div>
      </div>
      <button class="scroll-button right" :class="{ visible: showScrollButtons }" @click="scrollTabs(200)" :disabled="isScrollEnd">›</button>
      <button class="add-tab-button" @click="addTab">+</button>
    </div>
    <div class="tabs-content">
      <div v-if="activeTab" class="tab-content-item" :key="activeTab.id">
        <slot name="tab-body" :tab="activeTab" :font-size="fontSize"></slot>
      </div>
      <div v-else class="tab-content-placeholder">
        <span>Đang chuẩn bị...</span>
      </div>
    </div>
    <div v-if="tabs.length > 0" class="theme-selector-container">
      <button class="theme-icon-button" title="Chọn theme" @click.stop="toggleThemePopup">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
      </button>
      <!-- <<< ĐÃ THÊM @keydown VÀ tabindex -->
      <div class="theme-popup" :class="{ visible: isThemePopupVisible }" ref="themePopupRef" @keydown="handleThemeKeyboardNav" tabindex="-1">
        <div v-for="(theme, index ) in themes" :key="theme.name" :ref="el => themeRefs[index] = el" class="theme-option" :class="{ highlighted: index === highlightedThemeIndex, selected: theme.name === currentTheme }" @mouseenter="previewTheme(theme.name, index)" @click="selectTheme(theme.name)">
          {{ theme.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';

export default {
  name: 'BrowserTabContainer',
  props: {
    route: { type: Object, required: true },
    fontSize: { type: Number, default: 12 },
  },
  emits: ['active-tab-changed', 'theme-changed'],
  setup(props, { emit, expose }) {
    const tabs = ref([]);
    const activeTabId = ref(null);
    const tabsWrapperRef = ref(null);
    const tabsListRef = ref(null);
    let tabCounter = 0;
    let isSaving = false;

    const activeTab = computed(() => tabs.value.find(t => t.id === activeTabId.value));
    const storageKey = computed(() => props.route?.route ? `browser_tabs_state_${props.route.route}` : null);

    const saveStateToLocalStorage = () => {
      if (isSaving || !storageKey.value || tabs.value.length === 0) return;
      try {
        const stateToSave = {
          tabs: tabs.value.map(t => ({ id: t.id, title: t.title, content: t.content })),
          activeTabId: activeTabId.value,
          currentTheme: currentTheme.value,
        };
        localStorage.setItem(storageKey.value, JSON.stringify(stateToSave));
      } catch (e) { console.error("Lỗi khi lưu trạng thái:", e); }
    };

    const loadStateFromLocalStorage = () => {
      if (!storageKey.value) {
        if (tabs.value.length === 0) addTab();
        return;
      }
      const savedJSON = localStorage.getItem(storageKey.value);
      if (!savedJSON) {
        addTab();
        return;
      }
      try {
        isSaving = true;
        const savedState = JSON.parse(savedJSON);
        if (!savedState.tabs || savedState.tabs.length === 0) {
          addTab();
          isSaving = false;
          return;
        }
        const lastActiveId = savedState.activeTabId;
        const activeTabData = savedState.tabs.find(t => t.id === lastActiveId);
        if (activeTabData) {
          tabs.value = [{ ...activeTabData, isEditing: false, inputRef: null }];
          activeTabId.value = activeTabData.id;
        } else {
          tabs.value = [{ ...savedState.tabs[0], isEditing: false, inputRef: null }];
          activeTabId.value = savedState.tabs[0].id;
        }
        currentTheme.value = savedState.currentTheme || 'one-dark';
        nextTick(() => {
          emit('active-tab-changed', activeTabId.value);
          emit('theme-changed', { theme: currentTheme.value, isPreview: false });
          checkScroll();
        });
        setTimeout(() => {
          const otherTabs = savedState.tabs.filter(t => t.id !== activeTabId.value).map(t => ({ ...t, isEditing: false, inputRef: null }));
          tabs.value.push(...otherTabs);
          const originalOrder = savedState.tabs.map(t => t.id);
          tabs.value.sort((a, b) => originalOrder.indexOf(a.id) - originalOrder.indexOf(b.id));
          nextTick(() => {
            checkScroll();
            isSaving = false;
          });
        }, 100);
      } catch (e) {
        console.error("Lỗi khi tải trạng thái:", e);
        addTab();
        isSaving = false;
      }
    };

    const addTab = () => {
      tabCounter = tabs.value.length > 0 ? Math.max(...tabs.value.map(t => parseInt(t.id.split('_')[2] || 0))) + 1 : 1;
      const newTab = {
        id: `tab_${Date.now()}_${tabCounter}`,
        title: `Request ${tabCounter}`,
        content: JSON.stringify({ id: `req_${tabCounter}`, method: "GET", url: "https://api.example.com/data" }, null, 2 ),
        isEditing: false, inputRef: null,
      };
      tabs.value.push(newTab);
      selectTab(newTab.id);
      scrollTabIntoView(newTab.id);
    };

    const selectTab = (tabId) => {
      if (activeTabId.value !== tabId) {
        activeTabId.value = tabId;
        emit('active-tab-changed', tabId);
        scrollTabIntoView(tabId);
      }
    };

    const closeTab = (tabId) => {
      const index = tabs.value.findIndex(t => t.id === tabId);
      if (index === -1) return;
      const wasActive = activeTabId.value === tabId;
      tabs.value.splice(index, 1);
      if (tabs.value.length === 0) {
        if (storageKey.value) localStorage.removeItem(storageKey.value);
        addTab();
      } else if (wasActive) {
        selectTab(tabs.value[Math.max(0, index - 1)].id);
      }
      nextTick(checkScroll);
    };

    const scrollTabIntoView = (tabId) => {
      nextTick(() => {
        const tabElement = tabsListRef.value?.querySelector(`.tab-button[data-tab-id="${tabId}"]`);
        if (tabElement) tabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      });
    };

    const updateTabContent = (tabId, newContent) => {
      const tab = tabs.value.find(t => t.id === tabId);
      if (tab) tab.content = newContent;
    };

    const showScrollButtons = ref(false); const isScrollStart = ref(true); const isScrollEnd = ref(false);
    const checkScroll = () => { const w = tabsWrapperRef.value; if (!w) return; const h = w.scrollWidth > w.clientWidth; showScrollButtons.value = h; if (h) { isScrollStart.value = w.scrollLeft <= 0; isScrollEnd.value = w.scrollLeft >= w.scrollWidth - w.clientWidth - 1; } };
    const scrollTabs = (amount) => tabsWrapperRef.value?.scrollBy({ left: amount, behavior: 'smooth' });
    const handleWheelScroll = (event) => { if (tabsWrapperRef.value) tabsWrapperRef.value.scrollLeft += event.deltaY; };
    const startEditing = (tabId) => { const t = tabs.value.find(t => t.id === tabId); if (t) { t.isEditing = true; nextTick(() => t.inputRef?.focus()); } };
    const finishEditing = (tabId, event) => { const t = tabs.value.find(t => t.id === tabId); if (t?.isEditing) { const n = event.target.value.trim(); if (n) t.title = n; t.isEditing = false; } };
    const cancelEditing = (tabId) => { const t = tabs.value.find(t => t.id === tabId); if (t) t.isEditing = false; };
    const handleMouseDown = (tabId, event) => { if (event.button === 1) closeTab(tabId); };

    const themes = ref([
      { name: 'one-dark' }, { name: 'dracula' }, { name: 'material' }, { name: 'monokai' },
      { name: 'nord' }, { name: 'eclipse' }, { name: 'bespin' }, { name: 'duotone-dark' },
      { name: 'duotone-light' }, { name: 'github-dark' }, { name: 'github-light' }, { name: 'okaidia' },
      { name: 'sublime' }, { name: 'tokyo-night' }, { name: 'xcode-dark' }, { name: 'xcode-light' },
    ]);
    const currentTheme = ref('one-dark');
    const isThemePopupVisible = ref(false);
    const highlightedThemeIndex = ref(0);
    const themePopupRef = ref(null);
    const themeRefs = ref([]); // <<< DÙNG ĐỂ SCROLL KHI DÙNG PHÍM

    const previewTheme = (themeName, index) => {
      highlightedThemeIndex.value = index;
      emit('theme-changed', { theme: themeName, isPreview: true });
    };

    const selectTheme = (themeName) => {
      currentTheme.value = themeName;
      isThemePopupVisible.value = false;
      emit('theme-changed', { theme: themeName, isPreview: false });
    };

    const toggleThemePopup = () => {
      isThemePopupVisible.value = !isThemePopupVisible.value;
      if (isThemePopupVisible.value) {
        // <<< KHI MỞ, SET HIGHLIGHT VỀ THEME HIỆN TẠI VÀ FOCUS
        highlightedThemeIndex.value = themes.value.findIndex(t => t.name === currentTheme.value);
        nextTick(() => themePopupRef.value?.focus());
      }
    };

    const handleGlobalClick = (e) => {
      const button = document.querySelector('.theme-icon-button');
      if (isThemePopupVisible.value && !themePopupRef.value?.contains(e.target) && !button?.contains(e.target)) {
        isThemePopupVisible.value = false;
      }
    };

    // <<< FIX 2: XỬ LÝ ĐIỀU HƯỚNG BẰNG BÀN PHÍM
    const handleThemeKeyboardNav = (event) => {
      if (!isThemePopupVisible.value) return;
      event.preventDefault();
      const maxIndex = themes.value.length - 1;
      let newIndex = highlightedThemeIndex.value;

      if (event.key === 'ArrowDown') {
        newIndex = newIndex >= maxIndex ? 0 : newIndex + 1;
      } else if (event.key === 'ArrowUp') {
        newIndex = newIndex <= 0 ? maxIndex : newIndex - 1;
      } else if (event.key === 'Enter') {
        selectTheme(themes.value[highlightedThemeIndex.value].name);
        return;
      } else if (event.key === 'Escape') {
        isThemePopupVisible.value = false;
        return;
      }

      if (newIndex !== highlightedThemeIndex.value) {
        previewTheme(themes.value[newIndex].name, newIndex);
        // Scroll to the highlighted item
        themeRefs.value[newIndex]?.scrollIntoView({ block: 'nearest' });
      }
    };

    watch(() => props.route, (newRoute, oldRoute) => {
      if (newRoute && newRoute.route !== oldRoute?.route) {
        tabs.value = [];
        activeTabId.value = null;
        loadStateFromLocalStorage();
      }
    }, { immediate: true, deep: true });

    watch([() => tabs.value, () => activeTabId.value, () => currentTheme.value], saveStateToLocalStorage, { deep: true });

    // <<< FIX 1: KHI POPUP ĐÓNG, KHÔI PHỤC LẠI THEME CŨ
    watch(isThemePopupVisible, (isVisible, wasVisible) => {
      if (!isVisible && wasVisible) {
        // Popup vừa được đóng, khôi phục lại theme đã chọn
        emit('theme-changed', { theme: currentTheme.value, isPreview: false });
      }
    });

    onMounted(() => {
      window.addEventListener('resize', checkScroll);
      tabsWrapperRef.value?.addEventListener('scroll', checkScroll);
      document.addEventListener('click', handleGlobalClick);
    });
    onUnmounted(() => {
      window.removeEventListener('resize', checkScroll);
      tabsWrapperRef.value?.removeEventListener('scroll', checkScroll);
      document.removeEventListener('click', handleGlobalClick);
    });

    expose({ tabs, updateTabContent });

    return {
      tabs, activeTabId, addTab, selectTab, closeTab, handleMouseDown,
      startEditing, finishEditing, cancelEditing,
      tabsWrapperRef, tabsListRef, showScrollButtons, isScrollStart, isScrollEnd, scrollTabs, handleWheelScroll,
      themes, currentTheme, isThemePopupVisible, highlightedThemeIndex, themePopupRef, themeRefs,
      previewTheme, selectTheme, toggleThemePopup, handleThemeKeyboardNav,
      activeTab,
    };
  },
};
</script>

<style scoped>
/* CSS giữ nguyên, không thay đổi */
.tab-content-item { width: 100%; height: 100%; }
.tab-content-placeholder { display: flex; justify-content: center; align-items: center; height: 100%; color: #999; font-style: italic; }
.tabs-list-wrapper { flex-grow: 1; overflow: hidden; position: relative; display: flex; }
.tabs-content { flex-grow: 1; position: relative; overflow: hidden; }
.tabs-container {
  width: 100%; max-width: 100%; margin: 0 auto; background-color: #ffffff;
  overflow: hidden; display: flex; flex-direction: column;
  height: 20rem; position: relative; }
.tabs-header { display: flex; align-items: center; background-color: #f0f0f0; border-bottom: 1px solid #dcdcdc; padding: 5px 10px; flex-shrink: 0; }
.scroll-button { flex-shrink: 0; width: 30px; height: 36px;
  border-radius: 4px;
  border: 1px solid #aaaaaa;
  background-color: #f7f7f7;
  cursor: pointer; font-size: 18px; display: none; place-items: center;
  transition: opacity 0.2s, cursor 0.2s;
}
.scroll-button:hover:not(:disabled) { background-color: #e9e9e9; }
.scroll-button.visible { display: grid; }
.scroll-button:disabled { opacity: 0.5; cursor: not-allowed; }
.tabs-list { display: flex; flex-wrap: nowrap; position: relative; }
.add-tab-button { flex-shrink: 0; width: 36px; height: 36px; border-radius: 4px; border: 1px solid #dcdcdc; background-color: #f7f7f7; color: #333; font-size: 22px; cursor: pointer; margin-left: 5px; display: flex; justify-content: center; align-items: center; transition: background-color 0.3s; }
.add-tab-button:hover { background-color: #e9e9e9; }
.tab-button { flex-grow: 1; flex-shrink: 1; min-width: 100px; max-width: 220px; height: 36px; padding: 0 15px; padding-right: 35px; cursor: pointer;
  border-top: 1px solid #aaaa;
  border-bottom: 1px solid #aaaa;
  border-right: 1px solid #aaaa;
  background-color: transparent; font-size: 14px; color: #333; position: relative; transition: background-color 0.3s; white-space: nowrap; display: flex; align-items: center; overflow: hidden; }
.tab-button .tab-title { overflow: hidden; text-overflow: ellipsis; flex-grow: 1; }
.tab-title-input { width: 100%; border: none; background: transparent; font-size: 14px; height: 100%; padding: 0; margin: 0; outline: none; flex-grow: 1; }
.tab-button:last-child { border-right: none; }
.tab-button:hover { background-color: #e9e9e9; }
.tab-button.active { background-color: #ffffff; }
.close-tab-button { position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%); width: 20px; height: 20px;
  border: none; background-color: transparent; color: #666; font-size: 16px; display: flex; justify-content: center; align-items: center; line-height: 1; flex-shrink: 0; }
.close-tab-button:hover { background-color: #dcdcdc; color: #000; }
.theme-selector-container { position: absolute; bottom: 10px; right: 10px; z-index: 20; }
.theme-icon-button { width: 32px; height: 32px; border-radius: 4px; border: 1px solid #ccc; background-color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.theme-icon-button:hover { background-color: #f0f0f0; }
.theme-icon-button svg { width: 18px; height: 18px; }
.theme-popup { position: absolute; bottom: 110%; right: 0; background: white; border: 1px solid #ccc; border-radius: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, .15); max-height: 250px; overflow-y: auto; display: none; padding: 5px 0; min-width: 200px; }
.theme-popup:focus { outline: none; } /* Thêm để loại bỏ viền focus mặc định */
.theme-popup.visible { display: block; }
.theme-option { padding: 8px 15px; cursor: pointer; white-space: nowrap; position: relative; }
.theme-option.highlighted { background-color: #e9e9e9; }
.theme-option.selected::before { content: '✓'; position: absolute; left: 15px; color: #007aff; font-weight: bold; }
.theme-option.selected { padding-left: 35px; }
</style>
