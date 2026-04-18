<template>
  <div class="browser-tab-container">
    <div class="browser-tab-headers">
      <!--
        1. Dùng v-for để lặp qua danh sách các tab.
        2. Dùng :ref="setTabRef" để thêm mỗi phần tử div vào mảng refs.
        3. Dùng @click để gọi hàm xử lý, truyền vào index của tab được click.
      -->
      <div
          v-for="tab in tabs"
          :key="tab.id"
          class="browser-tab-header"
          :class="{ activated: activeTabId === tab.id }"
          @click="clickTab(tab.id)"
      >
        {{ tab.title }}
      </div>
    </div>
    <div class="browser-tab-body">
      <div>{{ activeTabContent }}</div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, onBeforeUpdate, onUpdated, computed } from 'vue';
import {nanoid} from "nanoid";

// BƯỚC 1: Tạo một kiểu dữ liệu tường minh cho một tab
type Tab = {
  id: string;
  title: string;
  content: string;
}

const tabs = ref<Tab[]>([
  { id: nanoid(), title: 'Báo cáo', content: 'Nội dung báo cáo...' },
  { id: nanoid(), title: 'Cài đặt', content: 'Nội dung cài đặt...' },
  { id: nanoid(), title: 'Báo cáo khacs', content: 'Nội dung báo cáo khác...' } // Tiêu đề có thể trùng
])

const idMappedTabs = computed(() => {
  return tabs.value.reduce((accumulator, tab) => {
    accumulator[tab.id] = tab;
    return accumulator;
  }, {} as Record<string, Tab>)
})

// 1. Khai báo một mảng để chứa các ref đến các phần tử DOM
let tabRefs = ref<HTMLDivElement[]>([]);

// Biến trạng thái: Lưu ID của tab đang được chọn. Mặc định là tab đầu tiên.
const activeTabId = ref<string>(tabs.value[0].id);
const previousActiveTabId = ref<string>(tabs.value[0].id);

const previousActiveTab = ref<HTMLDivElement|null>(null);

// 2. Hàm đặc biệt để gán ref từ v-for vào mảng
// Vue sẽ tự động gọi hàm này khi render danh sách
const setTabRef = (el: any) => {
  if (el) {
    tabRefs.value.push(el as HTMLDivElement);
  }
};

// Trước mỗi lần component update, chúng ta cần reset mảng refs
// để tránh nó bị tích lũy phần tử từ các lần render trước
onBeforeUpdate(() => {
  tabRefs.value = [];
});

// 3. Hàm xử lý sự kiện click
const clickTab = (clickedTabId: string) => {
  activeTabId.value = clickedTabId;
};

// Dùng `computed` để tự động tính toán nội dung cần hiển thị.
// Rất hiệu quả và "thuần Vue".
const activeTabContent = computed(() => {
  // Tìm tab trong mảng có id khớp với activeTabId
  // const activeTab = tabs.value.find(tab => tab.id === activeTabId.value);

  const activeTab = idMappedTabs.value[activeTabId.value];
  return activeTab ? activeTab.content : '';
});
</script>

<style lang="scss" scoped>
 .browser-tab-container {
   display: flex;
   flex-direction: column;
   border: 1px solid black;
   width: 100%;
   height: 500px;
   gap: 10px;
 }

 .browser-tab-headers {
   display: flex;
   flex-direction: row;
   border: 1px solid black;
   width: 100%;
   height: 50px;
   align-items: center;
   padding: 5px;
   background-color: #f6f6f6;
 }

 .browser-tab-header {
   display: flex;
   flex-direction: row;
   border: 1px solid black;
   width: 100px;
   height: 30px;
   align-items: center;
   padding: 5px;
   justify-content: center;

   &.activated {
     background-color: #dddddd;
   }
 }
</style>

