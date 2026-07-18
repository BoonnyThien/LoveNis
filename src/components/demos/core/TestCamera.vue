<template>
  <div style="height: 500px; width: 100%; border: 2px solid red;">
    <TresCanvas window-size clear-color="#222">
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 10]" :look-at="[0, 0, 0]" />
      <OrbitControls />
      
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" />
      <TresGridHelper />

      <TresMesh :position="[0, 1, 0]" @click="moveCamera">
        <TresSphereGeometry :args="[1]" />
        <TresMeshStandardMaterial color="red" />
      </TresMesh>
    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 5px;">
      File 1: Camera Test (Click Red Sphere)
    </div>
  </div>
</template>

<script setup>
// Thay đổi cửa sổ khi click và luu vào console
import { ref } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

const cameraRef = ref(null)

const moveCamera = () => {
  if (cameraRef.value) {
    const x = (Math.random() - 0.5) * 10
    cameraRef.value.position.set(x, 5, 10)
    cameraRef.value.lookAt(0, 0, 0)
    console.log('[Camera] Moved to:', x.toFixed(2))
  }
}

// Test Resize
window.addEventListener('resize', () => {
  console.log('[Sizes] Resized:', window.innerWidth, window.innerHeight)
})
</script>