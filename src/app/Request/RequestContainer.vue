<!-- src\apii\RequestContainer.vue -->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestManager from './RequestManager.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'

// Import các icon của bạn
import IconEditor from '@/assets/svg/feathericons/edit.svg'
import IconInfo from '@/assets/svg/feathericons/info.svg'
import RequestInfo from "@/app/Request/RequestInfo.vue";

const props = defineProps<{
  requestsData: RouteInfo[]
}>()

// --- State cho layout ---
const containerLeftWidth = ref(40)
const clickedRoute = ref<RouteInfo | null>(null)

// --- State cho các tab bên phải ---
type RightTab = 'editor' | 'info'
const activeRightTab = ref<RightTab>('editor')

const updateLeftWidth = (newWidth: number) => {
  containerLeftWidth.value = newWidth
}

const clickRoute = (route: RouteInfo) => {
  clickedRoute.value = route
}

// --- Logic lưu/tải chiều rộng ---
onMounted(() => {
  const savedLeftWidthStr = localStorage.getItem('containerLeftWidth')
  if (savedLeftWidthStr) {
    containerLeftWidth.value = Number(savedLeftWidthStr)
  }
})

watch(containerLeftWidth, (newVal) => {
  localStorage.setItem('containerLeftWidth', String(newVal))
})
</script>

<template>
  <!--
    QUAY LẠI CẤU TRÚC HTML GỐC CỦA BẠN.
    CHỈ THÊM `position: relative` VÀO ĐÂY.
  -->
  <div class="container">
    <!-- Cột bên trái -->
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <RequestManager
          :requests="props.requestsData"
          @click="clickRoute"
      />
    </div>

    <!-- Resizer -->
    <Resizer class="resizer"
             :initial-width="containerLeftWidth"
             @resize="updateLeftWidth"
    />

    <!-- Cột bên phải -->
    <div class="container-right">
      <RequestEditor v-if="activeRightTab === 'editor'" :route="clickedRoute" />
      <RequestInfo v-if="activeRightTab === 'info'" :route="clickedRoute" />
    </div>

    <!--
      Thanh tab được đặt ở đây.
      Nó sẽ được định vị tuyệt đối so với .container.
    -->
    <div class="right-tabs">
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'editor' }"
          @click="activeRightTab = 'editor'"
          title="Editor"
      >
        <IconEditor />
      </div>
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'info' }"
          @click="activeRightTab = 'info'"
          title="Information"
      >
        <IconInfo />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  display: flex;
  height: 96vh;
  width: 100%;
  /* Bỏ overflow: hidden đi để icon có thể lòi ra */
  /* overflow: hidden; */
  border: 1px solid #aaaaaa;
  background-color: var(--app-bg-color);

  /* --- CHÌA KHÓA DUY NHẤT LÀ ĐÂY --- */
  position: relative;
}

.resizer { padding: 0; }
.container-left { padding: 10px; overflow: auto; max-width: 90%; min-width: 200px; }
.container-right { flex: 1; padding: 10px; min-width: 150px; overflow: auto; }
.info-panel { padding: 10px; }

/* --- CSS CHO THANH TAB "ĐÍNH" VÀO NGOÀI RÌA --- */
.right-tabs {
  position: absolute; /* Định vị tuyệt đối so với .container */
  top: 15px;

  /*
    Đây là "phép thuật" cuối cùng và đúng nhất:
    - `right: 0` đẩy nó sát cạnh phải của .container.
    - `transform: translateX(100%)` dịch chuyển nó sang phải một đoạn bằng 100% chiều rộng của chính nó.
    - `padding-left` tạo khoảng hở.
  */
  right: 0;
  transform: translateX(100%);
  padding-left: 0;

  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 1; /* Đảm bảo nó nổi lên trên các phần tử khác nếu có */
}

.tab-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #f8f9fa;
  border: 1px solid #aaaaaa;
  border-radius: 0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  :deep(svg) {
    width: 18px;
    height: 18px;
    color: #495057;
  }

  &:hover {
    background-color: #e9ecef;
  }

  &.active {
    background-color: #e9ecef;
    border-color: #007bff;
    :deep(svg) {
      color: #007bff;
    }
  }
}
</style>
