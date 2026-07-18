<template>
  <div style="height: 500px; width: 100%; border: 2px solid magenta;">
    <TresCanvas window-size clear-color="#000">
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 10]" />
      <OrbitControls />
      <TresAmbientLight :intensity="1" />

      <TresMesh ref="targetRef" :position="[0, 1, 0]">
        <TresSphereGeometry :args="[1, 32, 32]" />
        <TresMeshStandardMaterial :color="isClose ? 'red' : 'green'" />
      </TresMesh>

      <TresMesh :position="[0, 3, 0]">
         <TresBoxGeometry :args="[isClose ? 2 : 0.5, 0.5, 0.5]" />
         <TresMeshStandardMaterial :color="isClose ? 'yellow' : 'gray'" />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 5px;">
      File 7: Proximity (Scroll chuột lại gần quả cầu) <br>
      Khoảng cách: {{ distance.toFixed(2) }} m
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

const cameraRef = ref(null)
const targetRef = ref(null)
const distance = ref(0)
const isClose = ref(false)

const { onLoop } = useRenderLoop()

onLoop(() => {
  if (cameraRef.value && targetRef.value) {
    // Tính khoảng cách giữa Camera và Vật thể
    distance.value = cameraRef.value.position.distanceTo(targetRef.value.position)
    
    // Nếu khoảng cách < 5 mét thì coi là "Lại gần"
    if (distance.value < 5) {
      isClose.value = true
    } else {
      isClose.value = false
    }
  }
})
</script>