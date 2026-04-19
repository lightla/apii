<!-- src\apii\RequestContainer.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, toRaw, reactive  } from 'vue'
import type { RouteInfo } from '@/types'
import RequestManager from './RequestManager.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'
import RequestInfo from "@/app/Request/RequestInfo.vue";
import EditorEnv from "@/app/Request/Editor/EditorEnv.vue";
import { IconSettings, IconCode, IconInfoCircle } from '@tabler/icons-vue'

import IconEditor from '@/assets/svg/feathericons/edit.svg'
import IconInfo from '@/assets/svg/feathericons/info.svg'

const props = defineProps<{
  requestsData: RouteInfo[]
}>()

const STORAGE_KEY_LEFT_WIDTH = 'containerLeftWidth'
const STORAGE_KEY_ACTIVE_TAB = 'activeRightTab'
type RightTab = 'editor' | 'info' | 'settings'

const containerLeftWidth = ref(40)
const clickedRoute = ref<RouteInfo | null>(null)
const activeRightTab = ref<RightTab>('editor')
const searchableFields = ref<string[]>(['route', 'group'])

const updateLeftWidth = (newWidth: number) => {
  containerLeftWidth.value = newWidth
}

const clickRoute = (route: RouteInfo) => {
  clickedRoute.value = route
}

const localRequests = reactive([...props.requestsData])

watch(() => props.requestsData, (newRequests) => {
  if (!newRequests || newRequests.length === 0) {
    localRequests.splice(0, localRequests.length);
    return;
  }
  const enrichedRequests = newRequests.map(req => {
    const tagStorageKey = `tags_${req.method}_${req.route}`;
    const savedTagsData = localStorage.getItem(tagStorageKey);
    const newReq = { ...req };
    if (savedTagsData) {
      try { newReq.tags = JSON.parse(savedTagsData); } catch (e) {}
    }
    return newReq;
  });
  localRequests.splice(0, localRequests.length, ...enrichedRequests);
}, { immediate: true, deep: true })

const updateTagsForRoute = (payload: { routeId: string, tags: string[] }) => {
  if (!payload || !payload.routeId) return;
  const requestToUpdate = localRequests.find(r => r.id === payload.routeId);
  if (requestToUpdate) { requestToUpdate.tags = toRaw(payload.tags); }
};

onMounted(() => {
  const savedLeftWidthStr = localStorage.getItem(STORAGE_KEY_LEFT_WIDTH)
  if (savedLeftWidthStr) containerLeftWidth.value = Number(savedLeftWidthStr)
  const savedActiveTab = localStorage.getItem(STORAGE_KEY_ACTIVE_TAB)
  if (savedActiveTab) activeRightTab.value = savedActiveTab as RightTab
})

watch(containerLeftWidth, (newVal) => localStorage.setItem(STORAGE_KEY_LEFT_WIDTH, String(newVal)))
watch(activeRightTab, (newTab) => localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, newTab))

</script>

<template>
  <div class="container">
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <RequestManager :requests="localRequests" :search-fields="searchableFields" @click="clickRoute" />
    </div>

    <Resizer class="resizer" @resize="updateLeftWidth" />

    <div class="container-right">
      <RequestEditor v-if="activeRightTab === 'editor'" :route="clickedRoute" />
      <RequestInfo v-if="activeRightTab === 'info'" :route="clickedRoute" @route-tags-updated="updateTagsForRoute" />
      <EditorEnv v-if="activeRightTab === 'settings'" :route="clickedRoute!" />
    </div>

    <div class="right-tabs">
      <div class="tab-icon" :class="{ active: activeRightTab === 'settings' }" @click="activeRightTab = 'settings'" title="Settings">
        <IconSettings />
      </div>
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'editor' }"
          @click="activeRightTab = 'editor'"
          title="Editor"
      >
        <IconCode />
      </div>
      <div
          class="tab-icon"
          :class="{ active: activeRightTab === 'info' }"
          @click="activeRightTab = 'info'"
          title="Information"
      >
        <IconInfoCircle />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container { display: flex; height: 96vh; width: 100%; border: 1px solid #aaaaaa; background-color: var(--app-bg-color); position: relative; }
.resizer { padding: 0; }
.container-left { padding: 10px; overflow: auto; max-width: 90%; min-width: 200px; }
.container-right {
  flex: 1;
  padding: 10px;
  min-width: 150px;
  min-height: 0;
  overflow: auto;
  display: flex;
}
.container-right > * {
  width: 100%;
  height: 100%;
  min-height: 0;
}
.right-tabs { position: absolute; top: 15px; right: 0; transform: translateX(100%); padding-left: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.tab-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; background-color: #f8f9fa; border: 1px solid #aaaaaa; border-radius: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.tab-icon :deep(svg) { width: 18px; height: 18px; color: #495057; }
.tab-icon:hover { background-color: #e9ecef; }
.tab-icon.active { background-color: #e9ecef; border-color: #007bff; }
.tab-icon.active :deep(svg) { color: #007bff; }
</style>
