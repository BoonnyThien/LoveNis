<template>
  <div style="height: 500px; width: 100%; border: 2px solid gold;">
    <TresCanvas window-size clear-color="#111">
      <TresPerspectiveCamera :position="[0, 2, 8]" />
      <OrbitControls />
      
      <Backdrop :scale="[20, 10, 5]" :floor="1.5" :position="[0, -1, -2]">
        <TresMeshStandardMaterial color="#333" />
      </Backdrop>

      <TresMesh :position="[0, 0, 0]">
        <TresSphereGeometry :args="[1, 32, 32]" />
        <TresMeshStandardMaterial color="hotpink" />
      </TresMesh>

      <Sparkles 
        :count="50" 
        :scale="3" 
        :size="2" 
        :speed="0.5" 
        :opacity="1" 
        color="yellow" 
      />

      <Stars :radius="100" :depth="50" :count="1000" :size="0.5" />

      <TresAmbientLight :intensity="1" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" />
    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 8: Staging (Backdrop, Stars, Sparkles)
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, Sparkles, Stars, Backdrop } from '@tresjs/cientos'
</script>