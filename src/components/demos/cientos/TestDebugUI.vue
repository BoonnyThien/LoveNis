<template>
  <div style="height: 500px; width: 100%; border: 2px solid teal;">
    <TresCanvas window-size clear-color="#333">
      <TresPerspectiveCamera :position="[0, 2, 5]" />
      <OrbitControls />
      <TresAmbientLight :intensity="1" />
      <TresDirectionalLight :position="[5, 5, 5]" />

      <TresMesh :scale="params.scale">
        <TresSphereGeometry />
        <TresMeshStandardMaterial :color="params.color" :wireframe="params.wireframe" />
      </TresMesh>
    </TresCanvas>
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 18: Debug UI (Chỉnh thông số góc phải trên)
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { OrbitControls, useTweakPane } from '@tresjs/cientos'

const { pane } = useTweakPane()

const params = reactive({
  color: '#ff0055',
  scale: 1,
  wireframe: false
})

pane.addBinding(params, 'color', { label: 'Màu Bánh' })
pane.addBinding(params, 'scale', { min: 0.5, max: 3, label: 'Độ Lớn' })
pane.addBinding(params, 'wireframe', { label: 'Khung dây' })
</script>