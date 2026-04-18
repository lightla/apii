<script setup lang="ts">
import {ref} from 'vue'
import {Square} from "lucide-vue-next"

const props = defineProps<{
  state: string
}>()

const refAbd = ref(false)

const onClickButton = (event: MouseEvent) => {
  switch (props.state) {
    case 'checked':
      break;
    case 'unchecked':
      break;
    case 'delete-pending':
      break;
    case 'delete-confirmed':
      break;
  }
}


</script>

<template>
  <Square v-if="props.state=='unchecked'" @click="onClickButton" stroke-width="1" class="param-control-button-add-row"/>
  <Square v-if="props.state=='checked'" @click="onClickButton" stroke-width="1" class="param-control-button-add-row"/>
</template>

<style scoped lang="scss">

</style>