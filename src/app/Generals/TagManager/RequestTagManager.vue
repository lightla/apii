<template>
  <div class="tag-manager-wrapper" v-on-click-outside="handleClickOutside">
    <div
        class="tag-manager-container"
        :class="{ 'is-focused': showDropdown }"
        @click="focusInputAndShowDropdown"
    >
      <div ref="tagsContainerRef" class="selected-tags-wrapper">
        <!-- Vòng lặp chỉ hiển thị các tag được tính toán là visible -->
        <div
            v-for="tag in visibleTags"
            :key="tag.id"
            class="tag-item-wrapper"
        >
          <div
              v-if="editingTagId !== tag.id"
              class="tag-item"
              :style="{ backgroundColor: tag.color, color: tag.textColor }"
              @dblclick.stop="startEditing(tag)"
          >
            #{{ tag.name }}
          </div>
          <!-- Chế độ sửa tag -->
          <div v-else class="tag-edit-mode">
            <input
                :ref="el => { if (el) editingInputRef = el }"
                v-model="editingTagName"
                type="text"
                class="tag-edit-input"
                @keydown.enter.prevent="saveEditedTag"
                @keydown.esc.prevent="cancelEdit"
                @blur="saveEditedTag"
            />
            <div class="color-palette">
              <span
                  v-for="color in pastelPalette"
                  :key="color"
                  class="color-swatch"
                  :class="{ 'is-selected': editingTagColor === color }"
                  :style="{ backgroundColor: color }"
                  @mousedown.prevent="handleColorPick(color)"
              ></span>
            </div>
          </div>
        </div>

        <!-- Hiển thị số tag bị ẩn -->
        <div v-if="hiddenTagsCount > 0" class="hidden-tags-indicator">
          +{{ hiddenTagsCount }}
        </div>

        <!-- Input chính để thêm tag -->
        <div class="tag-input-wrapper">
          <input
              ref="tagInputRef"
              v-model="searchQuery"
              type="text"
              :placeholder="inputPlaceholder"
              @keydown.enter.prevent="handleEnterKey"
              @keydown.down.prevent="handleArrowDown"
              @keydown.up.prevent="handleArrowUp"
              @focus="openDropdown"
          />
        </div>
      </div>
    </div>

    <!-- Dropdown gợi ý -->
    <div v-if="showDropdown" ref="dropdownRef" class="tag-dropdown">
      <div class="dropdown-header">
        <span v-if="!showSelectedOnly">Gợi ý</span>
        <span v-else>Đã chọn ({{ selectedTags.length }})</span>
        <div class="header-actions">
          <button
              v-if="searchQuery"
              class="header-action-btn clear-search-btn"
              @click.stop="searchQuery = ''"
              title="Xóa tìm kiếm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </button>
          <button
              class="header-action-btn toggle-selected-btn"
              :class="{ 'active': showSelectedOnly }"
              @click.stop="showSelectedOnly = !showSelectedOnly"
              title="Hiển thị các tag đã chọn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </button>
        </div>
      </div>

      <ul class="tag-suggestion-list">
        <li
            v-if="canCreateNewTag"
            class="add-new-tag-item"
            :class="{ 'is-active': activeIndex === -1 }"
            @mouseover="activeIndex = -1"
            @click="addNewTag(searchQuery )"
        >
          <span class="add-icon">+</span> Tạo tag mới: "<strong>{{ searchQuery }}</strong>"
        </li>

        <li
            v-for="(tag, index) in currentSuggestionList"
            :key="tag.id"
            :ref="el => { if (el) suggestionItemRefs[index] = el }"
            class="suggestion-item"
            :class="{ 'is-active': activeIndex === index }"
            @mouseover="activeIndex = index"
            @click="handleItemClick(tag)"
        >
          <div class="suggestion-item-main">
            <span class="tag-color-dot" :style="{ backgroundColor: tag.color }"></span>
            {{ tag.name }}
          </div>
          <button
              v-if="!showSelectedOnly"
              class="delete-tag-btn"
              :class="{ 'confirm': tagToDeleteId === tag.id }"
              @click.stop="handleDeleteClick(tag)"
              :title="tagToDeleteId === tag.id ? 'Click lần nữa để xóa vĩnh viễn' : 'Xóa tag này khỏi hệ thống'"
          >
            &times;
          </button>
        </li>
      </ul>

      <div v-if="currentSuggestionList.length === 0 && !canCreateNewTag" class="dropdown-info">
        <span>Không có tag nào.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { vOnClickOutside } from '@vueuse/components';
import { nanoid } from 'nanoid';
import { cssColor, rgb2hsv, hsv2rgb, rgb2hex } from '@swiftcarrot/color-fns';

// --- PROPS & EMITS ---
const props = defineProps({ route: { type: Object, required: true } });
const emit = defineEmits(['tags-updated', 'click:outside']);

// --- STATE MANAGEMENT ---
const searchQuery = ref('');
const selectedTags = ref([]);
const allAvailableTags = ref([]);
const showDropdown = ref(false);
const currentStorageKey = ref(null);
const tagInputRef = ref(null);
const dropdownRef = ref(null);
const activeIndex = ref(0);
const suggestionItemRefs = ref([]);
const editingTagId = ref(null);
const editingTagName = ref('');
const editingTagColor = ref('');
const editingInputRef = ref(null);
const showSelectedOnly = ref(false);
const tagToDeleteId = ref(null);

// --- STATE CHO LOGIC GIỚI HẠN DÒNG ---
const tagsContainerRef = ref(null);
const visibleTags = ref([]);
const hiddenTagsCount = ref(0);
const MAX_LINES_FACTOR = 2.5;
const tagWidthCache = new Map();

// =================================================================
// === BẮT ĐẦU KHỐI ĐỊNH NGHĨA HÀM (FUNCTIONS DEFINITION BLOCK) ===
// =================================================================

// --- LOGIC MÀU SẮC ---
const DARK_TEXT_COLOR = '#2c3e50';
const pastelPalette = [
  '#a2d2ff', '#bde0fe', '#ffafcc', '#ffc8dd', '#cdb4db',
  '#fcf6bd', '#d0f4de', '#a9def9', '#e4c1f9', '#fbf8cc',
  '#ffddd2', '#fde2e4', '#fad2e1', '#c5dedd', '#dbe7e4',
  '#f0efeb', '#dfe7fd', '#c3bef0', '#ff99c8', '#fcfac9'
];

function lighten(colorStr, amount) {
  const colorObj = cssColor(colorStr);
  if (!colorObj) return colorStr;
  const hsv = rgb2hsv(colorObj.r, colorObj.g, colorObj.b);
  hsv.v = Math.min(100, hsv.v + amount * 100);
  const rgb = hsv2rgb(hsv.h, hsv.s, hsv.v);
  return rgb2hex(rgb.r, rgb.g, rgb.b);
}

function getLuminance(colorStr) {
  const rgb = cssColor(colorStr);
  if (!rgb) return 0;
  const a = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
}

function processTagColors(tag) {
  let bgColor = tag.color;
  if (getContrastRatio(bgColor, DARK_TEXT_COLOR) < 2.5) {
    let isOk = false;
    for (let i = 0; i < 5; i++) {
      bgColor = lighten(bgColor, 0.1);
      if (getContrastRatio(bgColor, DARK_TEXT_COLOR) >= 2.5) {
        isOk = true;
        break;
      }
    }
    if (!isOk) {
      bgColor = pastelPalette[Math.floor(Math.random() * pastelPalette.length)];
    }
  }
  return { ...tag, color: bgColor, textColor: DARK_TEXT_COLOR };
}

// --- LOGIC LƯU TRỮ ---
const generateStorageKey = (route) => route?.route ? `tags_${route.method}_${route.route}` : null;

const loadDataFromStorage = (key) => {
  const data = localStorage.getItem(key);
  selectedTags.value = data ? JSON.parse(data) : [];
  emit('tags-updated', selectedTags.value);

};

const saveDataToStorage = (key, data) => {
  if (key) {
    localStorage.setItem(key, JSON.stringify(data));
    emit('tags-updated', data);
  }
};

const saveAllTags = () => {
  localStorage.setItem('all_tags', JSON.stringify(allAvailableTags.value));
};

// --- METHODS: XỬ LÝ SỰ KIỆN & DOM ---
const openDropdown = () => {
  if (showDropdown.value) return;
  showDropdown.value = true;
};

const closeDropdown = () => {
  if (!showDropdown.value) return;
  showDropdown.value = false;
  activeIndex.value = 0;
  tagToDeleteId.value = null;
  searchQuery.value = '';
};

const focusInputAndShowDropdown = () => {
  if (editingTagId.value) return;
  openDropdown();
  nextTick(() => tagInputRef.value?.focus());
};

const handleDropdownScroll = (event) => {
  const el = dropdownRef.value;
  if (!el) return;
  const atTop = el.scrollTop === 0;
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  if ((event.deltaY < 0 && atTop) || (event.deltaY > 0 && atBottom)) {
    event.preventDefault();
    event.stopPropagation();
  }
};

// --- METHODS: SỬA TAG ---
const startEditing = (tag) => {
  editingTagId.value = tag.id;
  editingTagName.value = tag.name;
  editingTagColor.value = tag.color;
  nextTick(() => editingInputRef.value?.focus());
};

const cancelEdit = () => {
  editingTagId.value = null;
};

const saveEditedTag = () => {
  if (!editingTagId.value) return;
  const newName = editingTagName.value.trim();
  const newColor = editingTagColor.value;
  tagWidthCache.delete(editingTagId.value);
  allAvailableTags.value = allAvailableTags.value.map(t => (t.id === editingTagId.value) ? processTagColors({ ...t, name: newName, color: newColor }) : t);
  selectedTags.value = selectedTags.value.map(t => (t.id === editingTagId.value) ? processTagColors({ ...t, name: newName, color: newColor }) : t);
  saveAllTags();
  saveDataToStorage(currentStorageKey.value, selectedTags.value);
  cancelEdit();
};

const handleClickOutside = (event: MouseEvent) => {
  closeDropdown();
  if (editingTagId.value) saveEditedTag();

  emit('click:outside', event, selectedTags.value)
};

const handleColorPick = (color) => {
  editingTagColor.value = color;
  saveEditedTag();
};

// --- METHODS: QUẢN LÝ TAG ---
const selectTag = (tag) => {
  selectedTags.value.push(tag);
  saveDataToStorage(currentStorageKey.value, selectedTags.value);
  searchQuery.value = '';
  focusInputAndShowDropdown();
};

const removeTagFromSelection = (tagToRemove) => {
  selectedTags.value = selectedTags.value.filter(tag => tag.id !== tagToRemove.id);
  saveDataToStorage(currentStorageKey.value, selectedTags.value);

  emit('tags-updated', selectedTags.value);
};

const addNewTag = (tagName) => {
  const newTagName = tagName.trim();
  if (!newTagName) return;
  const rawTag = { id: nanoid(), name: newTagName, color: pastelPalette[Math.floor(Math.random() * pastelPalette.length)] };
  const newTag = processTagColors(rawTag);
  allAvailableTags.value.push(newTag);
  saveAllTags();
  selectTag(newTag);
};

// --- METHODS: XỬ LÝ BÀN PHÍM ---
const handleEnterKey = () => {
  if (!showDropdown.value) return;
  if (activeIndex.value === -1 && canCreateNewTag.value) addNewTag(searchQuery.value);
  else if (activeIndex.value >= 0 && currentSuggestionList.value[activeIndex.value]) handleItemClick(currentSuggestionList.value[activeIndex.value]);
};

const handleArrowDown = () => {
  let maxIndex = currentSuggestionList.value.length - 1;
  if (canCreateNewTag.value) maxIndex++;
  if (activeIndex.value < maxIndex) {
    activeIndex.value++;
    scrollToActiveItem();
  }
};

const handleArrowUp = () => {
  let minIndex = canCreateNewTag.value ? -1 : 0;
  if (activeIndex.value > minIndex) {
    activeIndex.value--;
    scrollToActiveItem();
  }
};

const scrollToActiveItem = () => {
  nextTick(() => {
    const activeItem = suggestionItemRefs.value[activeIndex.value];
    activeItem?.scrollIntoView({ block: 'nearest' });
  });
};

// --- LOGIC MỚI CHO UX ---
const handleItemClick = (tag) => {
  if (showSelectedOnly.value) removeTagFromSelection(tag);
  else selectTag(tag);
};

const handleDeleteClick = (tag) => {
  if (tagToDeleteId.value === tag.id) {
    allAvailableTags.value = allAvailableTags.value.filter(t => t.id !== tag.id);
    saveAllTags();
    removeTagFromSelection(tag);
    tagToDeleteId.value = null;
  } else {
    tagToDeleteId.value = tag.id;
  }
};

// =================================================================
// === KẾT THÚC KHỐI ĐỊNH NGHĨA HÀM (FUNCTIONS DEFINITION BLOCK) ===
// =================================================================

// --- COMPUTED PROPERTIES ---
const inputPlaceholder = computed(() => selectedTags.value.length > 0 ? 'Thêm tag...' : 'Thêm hoặc tìm kiếm tag...');
const canCreateNewTag = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return false;
  return !allAvailableTags.value.some(tag => tag.name.toLowerCase() === query.toLowerCase());
});

const suggestionList = computed(() => {
  const selectedIds = new Set(selectedTags.value.map(t => t.id));
  const available = allAvailableTags.value.filter(t => !selectedIds.has(t.id));
  if (!searchQuery.value) return available;
  return available.filter(tag => tag.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const filteredSelectedList = computed(() => {
  if (!searchQuery.value) return selectedTags.value;
  return selectedTags.value.filter(tag => tag.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const currentSuggestionList = computed(() => {
  return showSelectedOnly.value ? filteredSelectedList.value : suggestionList.value;
});

// --- LIFECYCLE & WATCHERS ---
const seedTags = [
  { id: nanoid(), name: 'Feature', color: '#a2d2ff' },
  { id: nanoid(), name: 'Bug', color: '#ffafcc' },
  { id: nanoid(), name: 'API', color: '#cdb4db' },
  { id: nanoid(), name: 'UI-UX', color: '#fcf6bd' },
  { id: nanoid(), name: 'Docs', color: '#d0f4de' },
  { id: nanoid(), name: 'High-Priority', color: '#ffddd2' },
].map(processTagColors);

// --- LOGIC TÍNH TOÁN GIỚI HẠN DÒNG BẰNG SUMWIDTH ---
const measureTagWidth = (tag, gap) => {
  if (tagWidthCache.has(tag.id)) return tagWidthCache.get(tag.id);
  const tagEl = document.createElement('div');
  tagEl.className = 'tag-item';
  tagEl.style.visibility = 'hidden';
  tagEl.style.position = 'absolute';
  tagEl.innerText = `#${tag.name}`;
  document.body.appendChild(tagEl);
  const width = tagEl.offsetWidth + gap;
  document.body.removeChild(tagEl);
  tagWidthCache.set(tag.id, width);
  return width;
};

const updateVisibleTags = () => {
  const container = tagsContainerRef.value;
  if (!container) return;

  const style = window.getComputedStyle(container);
  const containerWidth = container.clientWidth;
  const maxAllowedWidth = containerWidth * MAX_LINES_FACTOR;
  const gap = parseFloat(style.gap);

  let currentSumWidth = 0;
  let lastVisibleIndex = -1;

  for (let i = 0; i < selectedTags.value.length; i++) {
    const tag = selectedTags.value[i];
    const tagWidth = measureTagWidth(tag, gap);
    if (currentSumWidth + tagWidth <= maxAllowedWidth) {
      currentSumWidth += tagWidth;
      lastVisibleIndex = i;
    } else {
      break;
    }
  }

  if (lastVisibleIndex === selectedTags.value.length - 1) {
    visibleTags.value = selectedTags.value;
    hiddenTagsCount.value = 0;
  } else {
    const tempVisible = selectedTags.value.slice(0, lastVisibleIndex + 1);
    let tempSumWidth = tempVisible.reduce((sum, tag) => sum + measureTagWidth(tag, gap), 0);

    const indicatorEl = document.createElement('div');
    indicatorEl.className = 'hidden-tags-indicator';
    indicatorEl.style.visibility = 'hidden';
    indicatorEl.style.position = 'absolute';
    indicatorEl.innerText = `+${selectedTags.value.length - tempVisible.length}`;
    document.body.appendChild(indicatorEl);
    const indicatorWidth = indicatorEl.offsetWidth + gap;
    document.body.removeChild(indicatorEl);

    while (tempSumWidth + indicatorWidth > maxAllowedWidth && tempVisible.length > 0) {
      const removedTag = tempVisible.pop();
      tempSumWidth -= measureTagWidth(removedTag, gap);
    }

    visibleTags.value = tempVisible;
    hiddenTagsCount.value = selectedTags.value.length - tempVisible.length;
  }
};

let resizeObserver;

onMounted(() => {
  const storedTags = localStorage.getItem('all_tags');
  allAvailableTags.value = storedTags ? JSON.parse(storedTags) : seedTags;
  if (!storedTags) saveAllTags();

  nextTick(() => {
    if (tagsContainerRef.value) {
      updateVisibleTags();
      resizeObserver = new ResizeObserver(updateVisibleTags);
      resizeObserver.observe(tagsContainerRef.value);
    }
  });
});

watch(showDropdown, (isShown) => {
  nextTick(() => {
    const el = dropdownRef.value;
    if (el) {
      if (isShown) el.addEventListener('wheel', handleDropdownScroll, { passive: false });
      else el.removeEventListener('wheel', handleDropdownScroll);
    }
  });
});

onBeforeUnmount(() => {
  if (dropdownRef.value) dropdownRef.value.removeEventListener('wheel', handleDropdownScroll);
  if (resizeObserver && tagsContainerRef.value) resizeObserver.unobserve(tagsContainerRef.value);
});

watch(() => props.route, (newRoute) => {
  const newKey = generateStorageKey(newRoute);
  currentStorageKey.value = newKey;
  loadDataFromStorage(newKey);
  cancelEdit();
}, { immediate: true, deep: true });

watch(currentSuggestionList, () => {
  activeIndex.value = canCreateNewTag.value ? -1 : 0;
  suggestionItemRefs.value = [];
  tagToDeleteId.value = null;
});

watch(selectedTags, () => {
  nextTick(updateVisibleTags);
}, { deep: true });

</script>

<style scoped lang="scss">
/* --- CSS ĐÃ ĐƯỢC LÀM MỚI HOÀN TOÀN ĐỂ ĐẸP HƠN --- */
.tag-manager-wrapper {
  --primary-blue: #3498db;
  --confirm-red: #e74c3c;
  --background-light: #fff;
  --border-color: #e0e0e0;
  --focus-ring-color: rgba(160, 196, 255, 0.3);

  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

.tag-manager-container {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  transition: border-color 0.2s, box-shadow 0.2s;
  cursor: text;
  background-color: var(--background-light);

  &.is-focused {
    border-color: #a0c4ff;
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }
}

.selected-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-item-wrapper, .tag-edit-mode {
  position: relative;
}

.tag-item {
  display: flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

.hidden-tags-indicator {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #555;
  background-color: #f0f0f0;
  border-radius: 6px;
  white-space: nowrap;
  align-self: center;
}

.tag-input-wrapper {
  flex-grow: 1;
  display: flex;
  align-items: center;
  min-width: 150px;
  align-self: center;

  input {
    width: 100%;
    border: none;
    outline: none;
    padding: 6px 4px;
    font-size: 14px;
    background-color: transparent;
  }
}

.tag-edit-input {
  border: 1px solid #a0c4ff;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 13px;
  outline: none;
  font-family: inherit;
  font-weight: 500;
  width: 120px;
}

.color-palette {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  display: flex;
  flex-wrap: wrap;
  width: 158px;
  gap: 6px;
  background-color: var(--background-light);
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  z-index: 110;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s ease, border-color 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  &.is-selected {
    border-color: var(--background-light);
    box-shadow: 0 0 0 2px var(--primary-blue);
  }
}

.tag-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  max-height: 250px;
  overflow-y: auto;
  background-color: var(--background-light);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  background-color: var(--background-light);
  z-index: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action-btn {
  background: none;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  transition: all 0.2s ease;
  width: 26px;
  height: 26px;

  &:hover {
    border-color: var(--primary-blue);
    color: var(--primary-blue);
  }

  &.clear-search-btn:hover {
    border-color: var(--confirm-red);
    color: var(--confirm-red);
  }

  &.toggle-selected-btn.active {
    background-color: #e9f5ff;
    border-color: var(--primary-blue);
    color: var(--primary-blue);
  }
}

.tag-suggestion-list {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.1s;
  border-radius: 4px;
  margin: 0 4px;

  &.is-active {
    background-color: #e9f5ff;
  }
}
  .suggestion-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-tag-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  padding: 0 8px;
  border-radius: 4px;
  line-height: 1;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    color: var(--confirm-red);
    background-color: #fbeeee;
  }

  &.confirm {
    color: #fff;
    background-color: var(--confirm-red);
    transform: scale(1.1);
  }
}

.dropdown-info {
  padding: 10px 12px;
  color: #888;
  font-size: 14px;
}

.add-new-tag-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.1s;
  border-radius: 4px;
  margin: 0 4px;

  &.is-active {
    background-color: #e9f5ff;
    color: #005a9e;
  }
}

.add-icon {
  font-weight: bold;
  margin-right: 8px;
  color: #27ae60;
}

.tag-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}
</style>
