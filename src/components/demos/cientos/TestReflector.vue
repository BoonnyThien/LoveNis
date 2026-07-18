<template>
  <div style="height: 500px; width: 100%; border: 2px solid silver;">
    <Suspense>
      <TresCanvas window-size clear-color="#111">
        <TresPerspectiveCamera :position="[0, 5, 10]" />
        <OrbitControls />
        
        <Environment preset="city" />

        <TresMesh :position="[0, 2, 0]">
          <TresTorusKnotGeometry :args="[1, 0.3, 128, 16]" />
          <TresMeshStandardMaterial color="hotpink" :roughness="0" :metalness="1" />
        </TresMesh>

        <Reflector 
          :position="[0, 0, 0]" 
          :rotation="[-Math.PI / 2, 0, 0]"
          :args="[10, 10]"
          :resolution="512"
          :mirror="0.75"
          :mixBlur="10"
          :mixStrength="2"
          :minDepthThreshold="0.4"
          :maxDepthThreshold="1.4"
          color="#333"
        />

        <TresAmbientLight :intensity="1" />
      </TresCanvas>
      <template #fallback>Loading Reflection...</template>
    </Suspense>
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 12: Reflector (Sàn gương) + Environment
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, Reflector, Environment } from '@tresjs/cientos'
</script>