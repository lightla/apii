<!-- src\apii\RequestContainer.vue -->
 
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { RouteInfo } from '@/types'
import RequestList from './RequestList.vue'
import Resizer from '../Generals/Resizer.vue'
import RequestEditor from '@/app/Request/RequestEditor.vue'

const props = defineProps<{
  requestsData: RouteInfo[]
}>()

// Dùng number cho % (ví dụ: 40 cho 40%)
const containerLeftWidth = ref(40) 

const clickedRoute = ref<RouteInfo>({
  group: '', method: '', route: ''
})

const updateLeftWidth = (newWidth: number) => {
  containerLeftWidth.value = newWidth
}

const clickRoute = (route: RouteInfo) => {
  clickedRoute.value = route;
}

onMounted(() => {
  const savedLeftWidthStr = localStorage.getItem('containerLeftWidth')
  if (savedLeftWidthStr !== null) {
    const savedLeftWidthNum = Number(savedLeftWidthStr)
    if (!isNaN(savedLeftWidthNum)) {
      containerLeftWidth.value = savedLeftWidthNum
    }
  }
})

watch(containerLeftWidth, (newVal) => {
  if (!isNaN(newVal)) {
    localStorage.setItem('containerLeftWidth', newVal.toString())
  }
  console.log("containerLeftWidth: " + newVal)
})
</script>

<template>
  <div class="container">
    <div class="container-left" :style="{ width: containerLeftWidth + '%' }">
      <RequestList 
        :requests="props.requestsData" 
        @click="clickRoute"
      />
    </div>
    <Resizer class="resizer"
      :initial-width="containerLeftWidth"
      @resize="updateLeftWidth"
    />
    <div class="container-right">
      <RequestEditor :route="clickedRoute" />
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "@/assets/styles/variables";

.container {
  display: flex;
  height: 96vh;
  width: 100%;
  overflow: hidden;
  border: 1px solid #aaaaaa;

  background-color: variables.$appBackgroundColor;

  .resizer {
    padding: 0;
  }

  .container-left {
    padding: 10px;
    overflow: auto;
    max-width: 90%;
    width: 30%;
  }

  .container-right {
    flex: 1;
    padding: 10px;
    min-width: 150px;
  }
}

</style>
