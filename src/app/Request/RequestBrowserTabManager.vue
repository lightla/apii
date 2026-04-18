<template>
  <div id="app-container">
    <!--
      - Bỏ hoàn toàn logic loading ở đây.
      - Component được render ngay lập tức khi có `props.route`.
      - Component con sẽ tự xử lý việc hiển thị và tải dữ liệu.
    -->
    <BrowserTabContainer
        v-if="props.route"
        :route="props.route"
        @theme-changed="handleThemeChange"
        ref="tabContainerRef"
    >
      <template #tab-body="{ tab }">
        <CodeMirrorContainer
            :modelValue="tab.content"
            @update:modelValue="newContent => handleContentChange(tab.id, newContent)"
            :theme="currentTheme"
        />
      </template>
    </BrowserTabContainer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// Bỏ defineAsyncComponent, dùng import trực tiếp để đơn giản hóa
import BrowserTabContainer from '@/app/Generals/BrowserTab/BrowserTabContainer.vue';
import CodeMirrorContainer from '@/app/Generals/CodeEditor/CodeMirrorContainer.vue';
import type { RouteInfo } from "@/types/index.js";

const props = defineProps<{
  route: RouteInfo | null
}>();

const tabContainerRef = ref<any>(null);
const currentTheme = ref('one-dark');

const handleContentChange = (tabId: string, newContent: string) => {
  if (tabContainerRef.value) {
    tabContainerRef.value.updateTabContent(tabId, newContent);
  }
};

const handleThemeChange = ({ theme }: { theme: string }) => {
  currentTheme.value = theme;
};
</script>

<style>
/* CSS Global của bạn, không cần màn hình loading nữa */

#app-container {
  background-color: #f0f2f5;
  box-sizing: border-box;
  border: 1px solid #aaaa;
}
</style>
