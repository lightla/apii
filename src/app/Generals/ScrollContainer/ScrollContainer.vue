<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  height?: string | number
}>(), {
  height: '320px'
})

const containerRef = ref<HTMLDivElement | null>(null)

onMounted(() => {
  const el = containerRef.value
  if (!el) return

  const clampScroll = (delta: number) => {
    const max = el.scrollHeight - el.clientHeight
    const next = el.scrollTop + delta
    if (next < 0) { el.scrollTop = 0; return true }
    if (next > max) { el.scrollTop = max; return true }
    return false
  }

  el.addEventListener('wheel', (e: WheelEvent) => {
    if (clampScroll(e.deltaY)) { e.preventDefault(); e.stopPropagation() }
  }, { passive: false })

  let startY = 0
  el.addEventListener('touchstart', (e: TouchEvent) => {
    startY = e.touches[0].clientY
  }, { passive: true })

  el.addEventListener('touchmove', (e: TouchEvent) => {
    const y = e.touches[0].clientY
    const dy = startY - y
    if (clampScroll(dy)) { e.preventDefault(); e.stopPropagation() }
    else { startY = y }
  }, { passive: false })
})
</script>

<template>
  <div
      ref="containerRef"
      class="sc-wrap"
      :style="{ maxHeight: typeof height === 'number' ? height + 'px' : height }"
  >
    <!-- default slot, không cần #default khi sử dụng -->
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.sc-wrap {
  position: relative;
  overflow: auto;
  overscroll-behavior: none;
  touch-action: pan-y;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}
</style>
