<script setup lang="ts">
import {VaButton} from "vuestic-ui";

const emit = defineEmits(['click'])

const onButtonClick = (event: MouseEvent) => {
  const target = event.target as HTMLButtonElement

  emit('click', target)
};

</script>

<template>
  <VaButton
      @click="onButtonClick"
      preset="secondary"
      border-color="#505050"
      text-color="#505050"
      size="small"
      class=" mr-3 mb-2 va-button-group--bordered"
      style="font-weight: normal"
  >
    <slot/>
  </VaButton>
</template>

<style scoped>
</style>
