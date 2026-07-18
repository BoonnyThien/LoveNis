<template>
  <div style="height: 500px; width: 100%; border: 2px solid yellow;">
    <TresCanvas window-size clear-color="#000">
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 5, 10]" />
      <OrbitControls />
      <TresAmbientLight :intensity="0.8" />

      <TresGroup>
        <TresMesh name="target-object" :position="[0, 1, -2]">
          <TresIcosahedronGeometry />
          <TresMeshStandardMaterial color="purple" />
        </TresMesh>

        <TresMesh :position="[0, 1, 2]" @click="findObject">
          <TresBoxGeometry :args="[2, 0.5, 1]" />
          <TresMeshStandardMaterial color="yellow" />
        </TresMesh>
      </TresGroup>

    </TresCanvas>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.5); padding: 5px;">
      File 4: Seek (Click Yellow Bar)
    </div>
  </div>
</template>

<script setup>
//Tìm tên vật thể và đổi màu vật thể tìm được
import { ref } from 'vue'
import { useSeek } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

const cameraRef = ref(null)
const { seekByName } = useSeek()

const findObject = () => {
  if (cameraRef.value && cameraRef.value.parent) {
    // Tìm trong scene cha của camera
    const found = seekByName(cameraRef.value.parent, 'target-object')
    
    if (found) {
      console.log('[Seek] Found object:', found)
      // Đổi màu để báo hiệu
      found.material.color.set('red')
      alert('Tim thay vat the! Da doi mau sang DO.')
    } else {
      console.log('[Seek] Not found')
    }
  }
}
</script>