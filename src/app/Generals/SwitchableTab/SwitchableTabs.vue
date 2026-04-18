<script setup lang="ts">
import { ref, provide } from 'vue'

interface TabInfo {
  id: string;
  name: string;
}

const props = defineProps<{
  tabs: TabInfo[];
  defaultActiveTabIndex?: number;
}>()

const activeIndex = ref(props.defaultActiveTabIndex || 0);

const setActive = (index: number) => {
  activeIndex.value = index;
}

provide('activeIndex', activeIndex);
provide('setActive', setActive);

defineSlots<{
  actions(props: {}): any;
  default(props: {}): any;
}>();
</script>

<template>
  <div class="tab-container">
    <div class="tabs">
      <div
          v-for="(tab, index) in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeIndex === index }"
          @click="setActive(index)"
      >
        {{ tab.name }}
      </div>
    </div>
    <slot name="actions"></slot>
  </div>

  <slot></slot>
</template>

<style scoped lang="scss">
.tab-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border: var(--tab-border);
  background-color: var(--tab-bg-color);
  padding-right: 5px;
}

.tabs {
  display: flex;
  flex-direction: row;
}

.tab {
  padding: 9px 15px;
  cursor: pointer;
  font-size: 14px;

  &.active {
    background-color: var(--tab-bg-color-active);
  }
}
</style>