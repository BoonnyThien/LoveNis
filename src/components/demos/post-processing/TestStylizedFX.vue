<template>
  <div style="height: 500px; width: 100%; border: 2px solid magenta;">
    <Suspense>
      <TresCanvas window-size clear-color="#222">
        <TresPerspectiveCamera :position="[0, 0, 5]" />
        <OrbitControls />
        <TresAmbientLight :intensity="1" />

        <TresMesh :rotation-x="0.5" :rotation-y="0.5">
          <TresTorusKnotGeometry :args="[1, 0.3, 100, 16]" />
          <TresMeshNormalMaterial />
        </TresMesh>

        <EffectComposer v-if="activeEffect">
          
          <Glitch 
            v-if="activeEffect === 'glitch'"
            :delay="[1.5, 3.5]" 
            :duration="[0.6, 1.0]" 
            :strength="[0.3, 1.0]"
          />

          <Pixelation 
            v-if="activeEffect === 'pixel'"
            :granularity="5" 
          />

        </EffectComposer>

      </TresCanvas>
    </Suspense>

    <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 5px;">
      <button @click="activeEffect = null">Tắt Hết (Camera OK)</button>
      <button @click="activeEffect = 'glitch'">Glitch</button>
      <button @click="activeEffect = 'pixel'">Pixelation</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { OrbitControls } from '@tresjs/cientos'
import { EffectComposer, Glitch, Pixelation } from '@tresjs/post-processing'

const activeEffect = ref(null)
</script>

<style scoped>
button { padding: 8px; cursor: pointer; }
</style> 