<template>
  <div style="height: 500px; width: 100%; border: 2px solid orange;">
    <TresCanvas window-size clear-color="#222">
      <TresPerspectiveCamera :position="[3, 3, 5]" />
      <OrbitControls make-default />
      <TresGridHelper />

      <TransformControls 
        v-if="meshRef" 
        :object="meshRef" 
        :mode="mode"
        :size="1" 
      />

      <TresMesh ref="meshRef" :position="[0, 1, 0]">
        <TresBoxGeometry />
        <TresMeshNormalMaterial />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; display: flex; gap: 5px;">
      <button @click="mode = 'translate'" :class="{ active: mode==='translate'}">✢ Di chuyển</button>
      <button @click="mode = 'rotate'" :class="{ active: mode==='rotate'}">↻ Xoay</button>
      <button @click="mode = 'scale'" :class="{ active: mode==='scale'}">⤢ Thu phóng</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { OrbitControls, TransformControls } from '@tresjs/cientos'

const meshRef = ref(null)
const mode = ref('translate') // 'translate' | 'rotate' | 'scale'
</script>

<style scoped>
button { padding: 5px 10px; cursor: pointer; opacity: 0.7; }
button.active { opacity: 1; background: cyan; font-weight: bold; }
</style>