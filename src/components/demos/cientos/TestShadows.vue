<template>
  <div style="height: 500px; width: 100%; border: 2px solid black;">
    <TresCanvas window-size clear-color="#ccc">
      <TresPerspectiveCamera :position="[0, 3, 6]" />
      <OrbitControls />
      
      <TresAmbientLight :intensity="0.5" />
      <TresPointLight :position="[10, 10, 10]" />

      <TresMesh :position="[0, 1.5, 0]">
        <TresTorusKnotGeometry :args="[0.5, 0.2, 100, 16]" />
        <TresMeshNormalMaterial />
      </TresMesh>

      <ContactShadows 
        :opacity="0.8" 
        :scale="10" 
        :blur="2.5" 
        :far="10" 
        :resolution="256" 
        color="#000000" 
      />
      
    </TresCanvas>
    <div style="position: absolute; top: 10px; left: 10px; color: black;">
      File 19 Fix: Đã sửa KnotGeometry -> TorusKnotGeometry
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, ContactShadows } from '@tresjs/cientos'
</script>