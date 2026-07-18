<template>
  <div style="height: 500px; width: 100%; border: 2px solid blue;">
    <TresCanvas window-size clear-color="#333">
      <TresPerspectiveCamera :position="[0, 5, 20]" />
      <OrbitControls />

      <Precipitation 
        :speed="1" 
        :count="200" 
        :size="0.2" 
        :area="[20, 20, 20]" 
        color="white"
      />

      <TresMesh :position="[0, 2, 0]">
        <TresBoxGeometry />
        <TresMeshNormalMaterial />
      </TresMesh>

      <TresAmbientLight :intensity="1" />
    </TresCanvas>
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 26: Sky, Ocean & Snow (Precipitation)
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, Sky, Ocean, Precipitation } from '@tresjs/cientos'
</script>