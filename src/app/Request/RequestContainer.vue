<!-- src\apii\RequestContainer.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, toRaw, reactive  } from 'vue'
import type { RouteInfo } from '@/types'
import RequestManager from './RequestManager.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'
import RequestInfo from "@/app/Request/RequestInfo.vue";
import EditorEnv from "@/app/Request/Editor/EditorEnv.vue";
import { IconSettings, IconCode, IconInfoCircle, IconListDetails, IconFolder } from '@tabler/icons-vue'
import CollectionPanel from '@/app/Request/Collection/CollectionPanel.vue'
import { useCollectionsStorage } from '@/storages'

const props = defineProps<{
  requestsData: RouteInfo[]
}>()

const STORAGE_KEY_LEFT_WIDTH = 'containerLeftWidth'
const STORAGE_KEY_ACTIVE_TAB = 'activeRightTab'
const STORAGE_KEY_LEFT_MODE = 'activeLeftMode'
type RightTab = 'editor' | 'info' | 'settings'
type LeftMode = 'request_list' | 'collection'

const containerLeftWidth = ref(40)
const clickedRoute = ref<RouteInfo | null>(null)
const clickedRouteStorageKey = ref<string | null>(null)
const activeRightTab = ref<RightTab>('editor')
const activeLeftMode = ref<LeftMode>('request_list')
const searchableFields = ref<string[]>(['route', 'group'])
const collectionsStore = useCollectionsStorage()

const updateLeftWidth = (newWidth: number) => {
  containerLeftWidth.value = newWidth
}

const clickRoute = (route: RouteInfo) => {
  clickedRoute.value = toRaw(route)
  clickedRouteStorageKey.value = route.id
}

const localRequests = reactive([...props.requestsData])

watch(() => props.requestsData, (newRequests) => {
  if (!newRequests || newRequests.length === 0) {
    localRequests.splice(0, localRequests.length);
    return;
  }
  // Filter out requests with empty routes
  const filtered = newRequests.filter(req => req.route && req.route.trim() !== '');
  
  const enrichedRequests = filtered.map(req => {
    const tagStorageKey = `tags_${req.id}`;
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
  const savedLeftMode = localStorage.getItem(STORAGE_KEY_LEFT_MODE)
  if (savedLeftMode) activeLeftMode.value = savedLeftMode as LeftMode

  collectionsStore.load()
})

watch(containerLeftWidth, (newVal) => localStorage.setItem(STORAGE_KEY_LEFT_WIDTH, String(newVal)))
watch(activeRightTab, (newTab) => localStorage.setItem(STORAGE_KEY_ACTIVE_TAB, newTab))
watch(activeLeftMode, (newMode) => localStorage.setItem(STORAGE_KEY_LEFT_MODE, newMode))

const selectFromCollection = (payload: { requestId: string, storageKey: string }) => {
  const found = localRequests.find(r => r.id === payload.requestId)
  if (found) {
    clickedRoute.value = toRaw(found)
    clickedRouteStorageKey.value = payload.storageKey
  }
}

</script>

<template>
  <div class="container">
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <div v-if="activeLeftMode === 'request_list'" class="left-single">
        <RequestManager :requests="localRequests" :search-fields="searchableFields" @click="clickRoute" />
      </div>

      <div v-else class="left-single">
        <CollectionPanel :requests="localRequests" @select="selectFromCollection" />
      </div>
    </div>

    <Resizer class="resizer" :initial-width="containerLeftWidth" @resize="updateLeftWidth" />

    <div class="container-right">
      <div v-if="!clickedRoute" class="empty-right">Select a request</div>
      <RequestEditor v-else-if="activeRightTab === 'editor'" :route="clickedRoute" :storage-key="clickedRouteStorageKey ?? clickedRoute.id" />
      <RequestInfo v-else-if="activeRightTab === 'info'" :route="clickedRoute" :storage-key="clickedRouteStorageKey ?? clickedRoute.id" @route-tags-updated="updateTagsForRoute" />
      <EditorEnv v-else :route="clickedRoute" />
    </div>

    <div class="left-tabs">
      <div class="tab-icon" :class="{ active: activeLeftMode === 'request_list' }" @click="activeLeftMode = 'request_list'" title="Request List">
        <IconListDetails />
      </div>
      <div class="tab-icon" :class="{ active: activeLeftMode === 'collection' }" @click="activeLeftMode = 'collection'" title="Collection">
        <IconFolder />
      </div>
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
.container-left { padding: 10px; overflow: hidden; max-width: 90%; min-width: 200px; display: flex; }
.left-single { width: 100%; height: 100%; overflow: auto; }
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
.empty-right { width: 100%; height: 100%; border: 1px dashed #bbbbbb; display: flex; align-items: center; justify-content: center; opacity: 0.75; }
.right-tabs { position: absolute; top: 15px; right: 0; transform: translateX(100%); padding-left: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.left-tabs { position: absolute; top: 15px; left: 0; transform: translateX(-100%); padding-right: 8px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.tab-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; background-color: #f8f9fa; border: 1px solid #aaaaaa; border-radius: 0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.tab-icon :deep(svg) { width: 18px; height: 18px; color: #495057; }
.tab-icon:hover { background-color: #e9ecef; }
.tab-icon.active { background-color: #e9ecef; border-color: #007bff; }
.tab-icon.active :deep(svg) { color: #007bff; }
</style>
