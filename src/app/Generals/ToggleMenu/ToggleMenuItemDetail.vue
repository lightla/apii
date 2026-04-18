<script setup lang="ts">
import {inject, onMounted, ref, type Ref, watch} from 'vue'

const toggleStates = inject<Ref<boolean[]>>('toggleStates')!
const toggleMenuItemIndexRef = inject<Ref<number>>('toggleMenuItemIndexRef')!
const toggleActive = ref<boolean>(true)

onMounted(() => {
  toggleActive.value = toggleStates.value[toggleMenuItemIndexRef.value]
})

watch(() => toggleStates.value[toggleMenuItemIndexRef.value], (val) => {
  toggleActive.value = val
})

</script>

<template>
  <div class="toggle-menu-item-detail" v-if="toggleActive">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.toggle-menu-item-detail {
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  //margin-top: 12px;
  //border-top: 1px solid #ccc;
  //padding-top: 12px;
  //background: var(--app-bg-color);
  //color: #333;
  //font-size: 14px;
}
</style>
