<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RouteInfo } from '@/types'
import TrackedVariableInput from "@/app/Generals/TrackedVariableInput.vue";
import {useInputStorage} from "@/storages/env-variables-tmp.ts";
import { IconBrandTelegram } from '@tabler/icons-vue';

const props = defineProps<{
  route: RouteInfo
}>()

const inputStorage = useInputStorage();

const myComponentRef = ref<InstanceType<typeof TrackedVariableInput> | null>(null)

onMounted(() => {
  // inputStorage.trackedHighlightInputs.push();
})

const enterUrlInput = (urlInput: HTMLDivElement) => {
  console.log(urlInput)
}

const sendRequest = (event: Event) => {
  const target = event.target as HTMLButtonElement
  console.log("clicked")
}

</script>

<template>
  <div class="request-line">
    <div class="method-select-cover">
      <select class="method-select select-control">
        <option value="GET">GET</option>
        <option value="POST" selected>POST</option>
        <option value="PUT">PUT</option>
        <option value="PATCH">PATCH</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>
    <div class="url-bar-cover">
      <TrackedVariableInput
          :route="props.route"
          :placeholder="'Enter URL'"
          :value="'{{w_active_domain}}/resource/{{$activeStructureCode}}/board-role/role/get/roles/{{$widgetRoleId}}'"
          :enabled-env-variable="true"
          :enabled-uri-param="true"
          @enter="enterUrlInput"
      />
    </div>
    <div class="send-request-cover">
      <IconBrandTelegram @click="sendRequest" class="btn-send-request" stroke-width="1"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.request-line {
  display: flex;
  align-items: center;
  max-width: 100%;
  //border: 1px solid black;
  //gap: 5px;
  //gap: 10px;
  //padding: 5px 15px;
}

.method-select-cover {
}

.method-select {
  //width: 10%;
  //background-color: #888888;
  display: flex;
  border: 1px solid #888888;
  //border: none;
  //padding: 5px;
  padding-left: 5px;
  justify-content: center;
  height: 27px;
}

.url-bar-cover {
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-right: 5px;
  padding-top: 1px;
  padding-bottom: 2px;
  //background-color: #dddddd;
  max-width: 100%;
  width: 100%;
  min-height: 31px;
  overflow-x: hidden; // Không dùng được do css không hỗ trợ
}

.send-request-cover {
  //background-color: #007bff;
  //padding-left: 5px;
  //border: 1px solid #888888;
}

.btn-send-request {
  cursor: pointer;
  //width: 30px;
  height: 30px;
  width: 30px;
  //fill: #666;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

</style>
