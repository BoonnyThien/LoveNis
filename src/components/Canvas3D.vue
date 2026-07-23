<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const canvasContainer = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const emit = defineEmits<{
  (e: 'ready', canvas: HTMLCanvasElement): void
  (e: 'resize', width: number, height: number): void
}>()

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (canvasRef.value && canvasContainer.value) {
    emit('ready', canvasRef.value)
    
    // Handle responsive resizing
    resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        emit('resize', width, height)
      }
    })
    
    resizeObserver.observe(canvasContainer.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})
</script>

<template>
  <div ref="canvasContainer" class="canvas-container">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  /* Using max-width/height to maintain aspect ratio logic in JS */
  display: block;
}
</style>
