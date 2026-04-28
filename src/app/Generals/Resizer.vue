<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  initialWidth?: number
  direction?: 'horizontal' | 'vertical'
}>()

const emit = defineEmits(['resize'])

const resizer = ref<HTMLElement | null>(null)
const isResizing = ref(false)
const startX = ref(0)
const startY = ref(0)
const startWidth = ref(0)
const startHeight = ref(0)

const containerWidth = ref(window.innerWidth)
const containerHeight = ref(window.innerHeight)

const getDirection = () => props.direction ?? 'horizontal'

const onMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return

  if (getDirection() === 'vertical') {
    const dy = e.clientY - startY.value
    const newHeightPx = startHeight.value + dy
    const percent = (newHeightPx / containerHeight.value) * 100
    const boundedHeight = Math.max(10, Math.min(percent, 90))
    emit('resize', boundedHeight)
    return
  }

  const dx = e.clientX - startX.value
  const newWidthPx = startWidth.value + dx
  const percent = (newWidthPx / containerWidth.value) * 100
  const boundedWidth = Math.max(10, Math.min(percent, 90))

  emit('resize', boundedWidth)
}

const stopResize = () => {
  isResizing.value = false
  document.body.style.cursor = 'default';

  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

const startResize = (e: MouseEvent) => {
  document.body.style.cursor = getDirection() === 'vertical' ? 'ns-resize' : 'ew-resize';

  console.log("startResize-props.initialWidth:" + props.initialWidth);
  console.log("startResize-containerWidth.value:" + containerWidth.value);

  e.preventDefault()
  isResizing.value = true
  startX.value = e.clientX
  startY.value = e.clientY

  if (getDirection() === 'vertical') {
    if (props.initialWidth !== undefined) {
      startHeight.value = (props.initialWidth / 100) * containerHeight.value
    } else {
      startHeight.value = 0.5 * containerHeight.value
    }
  } else {
    if (props.initialWidth !== undefined) {
      startWidth.value = (props.initialWidth / 100) * containerWidth.value
    } else {
      startWidth.value = 0.4 * containerWidth.value
    }
  }

  console.log("startResize-startWidth.value:" + startWidth.value);

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', stopResize)
}

window.addEventListener('resize', () => {
  console.log("window.innerWidth:" + window.innerWidth);
  console.log("containerWidth.value:" + containerWidth.value);
  containerWidth.value = window.innerWidth
  containerHeight.value = window.innerHeight
})

onMounted(() => {
  if (resizer.value) {
    resizer.value.addEventListener('mousedown', startResize)
  }
})

onBeforeUnmount(() => {
  if (resizer.value) {
    resizer.value.removeEventListener('mousedown', startResize)
  }

  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<template>
  <div class="resizer-range" :class="{ vertical: getDirection() === 'vertical' }" ref="resizer">
    <div class="container-resizer"></div>
  </div>
</template>

<style scoped lang="scss">

.resizer-range {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 22px;
  background-color: transparent;
  //border: 2px solid black;
  cursor: ew-resize;
}

.resizer-range.vertical {
  width: 100%;
  height: 22px;
  cursor: ns-resize;
}

.resizer-range:active {
  cursor: ew-resize;
}

.container-resizer {
  //z-index: 1000;
  height: 100%;
  background-color: #999;
  width: 2px;
}

.resizer-range.vertical .container-resizer {
  width: 100%;
  height: 2px;
}
</style>
