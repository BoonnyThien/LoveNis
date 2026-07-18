<template>
  <div style="height: 500px; width: 100%; border: 2px solid pink;">
    <TresCanvas window-size clear-color="#1a1a2e">
      <TresPerspectiveCamera :position="[0, 0, 10]" />
      
      <MouseParallax :factor="2" :ease="3" />
      
      <TresAmbientLight :intensity="2" />

      <TresMesh :position="[-2, 2, -5]">
        <TresSphereGeometry />
        <TresMeshStandardMaterial color="#ff5555" />
      </TresMesh>

      <TresMesh :position="[0, 0, 0]">
        <TresBoxGeometry :args="[2, 2, 2]" />
        <TresMeshStandardMaterial color="#55ff55" />
      </TresMesh>

      <TresMesh :position="[2, -2, 3]">
        <TresTorusGeometry :args="[0.5, 0.2]" />
        <TresMeshStandardMaterial color="#5555ff" />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 17: MouseParallax (Di chuột để thấy hiệu ứng trôi)
    </div>
  </div>
</template>

<script setup>
import { MouseParallax } from '@tresjs/cientos'
</script>