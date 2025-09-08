<script setup lang="ts">
import {ref} from 'vue'
import {Square, SquareCheck} from "lucide-vue-next"
import { useEnvStorage } from "@/storages";

const queryParamStorage = useEnvStorage;

const props = defineProps<{
  queryParamId: string
}>()

const refChecked = ref(false)

const onClickButton = (event: MouseEvent) => {
  refChecked.value = ! refChecked.value;
}

</script>

<template>
  <Square v-if="refChecked===false" @click="onClickButton" stroke-width="1" class="param-control-button-add-row"/>
  <SquareCheck v-else @click="onClickButton" stroke-width="1" class="param-control-button-add-row"/>
</template>

<style scoped lang="scss">

</style>