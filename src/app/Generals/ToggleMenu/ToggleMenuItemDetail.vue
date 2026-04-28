<script setup lang="ts">
import {inject, onMounted, ref, type Ref, watch} from 'vue'

const toggleStates = inject<Ref<Map<string, boolean>>>('toggleStates')!
const toggleMenuItemIdRef = inject<Ref<string>>('toggleMenuItemIdRef')!
const toggleActive = ref<boolean>(true)

onMounted(() => {
  toggleActive.value = toggleStates.value.get(toggleMenuItemIdRef.value) ?? true
})

watch(() => toggleStates.value.get(toggleMenuItemIdRef.value), (val) => {
  toggleActive.value = val ?? true
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
