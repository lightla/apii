<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(defineProps<{
  maxHeight?: string | number
  allowParentScroll?: boolean   // Ngăn scroll bubble ra cha (default = false)
  showScrollbar?: boolean       // Hiển thị scrollbar (default = true)
}>(), {
  allowParentScroll: false,
  showScrollbar: true,
})

const wrapperRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  const el = wrapperRef.value
  if (!el || props.allowParentScroll) return

  const clampScroll = (delta: number) => {
    const max = el.scrollHeight - el.clientHeight
    const next = el.scrollTop + delta
    if (next < 0) {
      el.scrollTop = 0
      return true
    } else if (next > max) {
      el.scrollTop = max
      return true
    }
    return false
  }

  const wheelHandler = (e: WheelEvent) => {
    if (clampScroll(e.deltaY)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  let startY = 0
  const touchStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
  const touchMove = (e: TouchEvent) => {
    const deltaY = startY - e.touches[0].clientY
    if (clampScroll(deltaY)) {
      e.preventDefault()
        e.stopPropagation()
    } else {
      startY = e.touches[0].clientY
    }
  }

  el.addEventListener('wheel', wheelHandler, { passive: false })
  el.addEventListener('touchstart', touchStart, { passive: true })
  el.addEventListener('touchmove', touchMove, { passive: false })

  onBeforeUnmount(() => {
    el.removeEventListener('wheel', wheelHandler)
    el.removeEventListener('touchstart', touchStart)
    el.removeEventListener('touchmove', touchMove)
  })
})
</script>

<template>
  <div
      ref="wrapperRef"
      class="scrollable"
      :class="{ 'hide-scrollbar': !showScrollbar }"
      :style="{ maxHeight: typeof maxHeight === 'number' ? maxHeight + 'px' : maxHeight }"
  >
    <slot />
  </div>
</template>

<style scoped>
.scrollable {
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

/* Ẩn cả scrollbar dọc và ngang khi showScrollbar=false */
.scrollable.hide-scrollbar {
  scrollbar-width: none; /* Firefox */
}
.scrollable.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
</style>
