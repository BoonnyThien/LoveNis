<template>
  <div style="height: 500px; width: 100%; border: 2px solid cyan;">
    <TresCanvas window-size clear-color="#222">
      <TresPerspectiveCamera :position="[0, 0, 6]" />
      <OrbitControls />
      
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" />
      <TresPointLight :position="[-5, 5, 0]" color="red" :intensity="2" />

      <TresMesh :position="[-2, 0, 0]">
        <TresSphereGeometry :args="[1, 64, 64]" />
        <MeshWobbleMaterial color="orange" :factor="0.6" :speed="2" />
      </TresMesh>

      <TresMesh :position="[2, 0, 0]">
        <TresTorusKnotGeometry :args="[0.6, 0.2, 128, 32]" />
        <MeshGlassMaterial />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 9: Materials (Left: Pudding Wobble, Right: Glass)
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, MeshWobbleMaterial, MeshGlassMaterial } from '@tresjs/cientos'
</script>