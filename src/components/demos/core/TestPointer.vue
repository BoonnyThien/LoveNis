<template>
  <div style="height: 500px; width: 100%; border: 2px solid purple;">
    <TresCanvas window-size clear-color="#000">
      <TresPerspectiveCamera :position="[0, 0, 5]" />
      <OrbitControls />
      <TresAmbientLight :intensity="1" />

      <TresMesh 
        :scale="isHovered ? 1.2 : 1"
        @click="onClick"
        @pointer-enter="onEnter"
        @pointer-leave="onLeave"
      >
        <TresSphereGeometry :args="[1, 32, 32]" />
        <TresMeshStandardMaterial :color="isHovered ? 'hotpink' : 'cyan'" />
      </TresMesh>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 5px;">
      File 6: Pointer Events (Hover & Click Sphere)
    </div>
  </div>
</template>

<script setup>
//Sự kiện vào và ra khi rê chuột 
import { ref } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

const isHovered = ref(false)

const onEnter = (event) => {
  isHovered.value = true
  document.body.style.cursor = 'pointer'
  console.log('[Pointer] Enter')
}

const onLeave = (event) => {
  isHovered.value = false
  document.body.style.cursor = 'auto'
  console.log('[Pointer] Leave')
}

const onClick = (event) => {
  // event.point chứa tọa độ 3D nơi bạn click vào
  console.log('[Pointer] Clicked at 3D point:', event.point)
}
</script>