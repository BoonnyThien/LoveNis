<template>
  <div style="height: 500px; width: 100%; border: 2px solid red;">
    <TresCanvas window-size clear-color="#111">
      <TresPerspectiveCamera :position="[5, 5, 5]" />
      <OrbitControls />

      <Stats />

      <TresSpotLight 
        ref="spotLight" 
        :position="[0, 5, 0]" 
        :intensity="2" 
        v-light-helper 
      />

      <TresMesh :position="[2, 0, 0]">
        <TresBoxGeometry />
        <TresMeshNormalMaterial />
        </TresMesh>

      <TresGridHelper />
    </TresCanvas>
    <div style="position: absolute; top: 50px; left: 10px; color: white;">
      File 27: Stats (FPS) & Light Helper (Khung dây vàng của đèn)
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, Stats, vLightHelper } from '@tresjs/cientos'
</script>