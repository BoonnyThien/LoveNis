<template>
  <div style="height: 500px; width: 100%; border: 2px solid white;">
    <TresCanvas window-size clear-color="#222">
      <TresPerspectiveCamera :position="[0, 5, 10]" />
      
      <CameraControls ref="controlsRef" make-default />
      
      <TresAmbientLight :intensity="1" />
      <TresGridHelper />
      <TresMesh><TresBoxGeometry /><TresMeshNormalMaterial /></TresMesh>
    </TresCanvas>

    <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 5px;">
      <button @click="rotateToTop">Góc Trên</button>
      <button @click="rotateToFront">Góc Trước</button>
      <button @click="zoomIn">Zoom</button>
      <button @click="resetView">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CameraControls } from '@tresjs/cientos'

const controlsRef = ref(null)

// Helper để lấy instance chuẩn
const getControls = () => controlsRef.value?.value ?? controlsRef.value

const rotateToTop = () => {
  const ctrl = getControls()
  // setLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition)
  ctrl?.setLookAt(0, 10, 0, 0, 0, 0, true)
}

const rotateToFront = () => {
  const ctrl = getControls()
  ctrl?.setLookAt(0, 0, 10, 0, 0, 0, true)
}

const zoomIn = () => {
  const ctrl = getControls()
  // dolly(distance, enableTransition)
  ctrl?.dolly(5, true)
}

const resetView = () => {
  const ctrl = getControls()
  ctrl?.reset(true)
}
</script>