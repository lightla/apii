<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Ref } from 'vue'

const props = defineProps<{
  index: number
}>()

const activeIndex = inject<Ref<number>>('activeIndex')!

const isActive = computed(() => activeIndex.value === props.index)
</script>

<template>
  <div v-show="isActive">
    <slot />
  </div>
</template>