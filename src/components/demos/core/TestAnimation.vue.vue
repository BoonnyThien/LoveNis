
<template>
  <div style="height: 500px; width: 100%; border: 2px solid green;">
    <TresCanvas window-size clear-color="#333">
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 5]" />
      <OrbitControls />
      <TresDirectionalLight :position="[0, 5, 5]" />

      <TresMesh ref="boxRef" :position="[-1.5, 1, 0]">
        <TresBoxGeometry />
        <TresMeshNormalMaterial />
      </TresMesh>

      <TresMesh  ref="planeRef" :position="[1.5, 1, 0]" v-always-look-at>
        <TresPlaneGeometry />
        <TresMeshBasicMaterial color="lightgreen" side="2" />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 5px;">
      File 3: Animation & Directives
    </div>
  </div>
</template>

<script setup>
// Luon nhin camera va xoay 
import { ref } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, vAlwaysLookAt } from '@tresjs/cientos'

const cameraRef = ref(null) 
const planeRef = ref(null) // Ref tới mặt phẳng xanh lá
const boxRef = ref(null)
const { onLoop } = useRenderLoop()

onLoop(({ delta }) => {
  if (boxRef.value) {
    boxRef.value.rotation.y += delta
    boxRef.value.rotation.x += delta * 0.5
  }
  if (planeRef.value && cameraRef.value) {
    planeRef.value.lookAt(cameraRef.value.position)
  }
})
</script>