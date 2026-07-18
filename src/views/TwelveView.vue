<script setup lang="ts">
import { ref, onMounted, shallowRef, triggerRef, toRaw } from 'vue'
import { OrbitControls, Html, Stars } from '@tresjs/cientos'
import { useRenderLoop } from '@tresjs/core'
import { TextureLoader, DoubleSide, Shape, Path, Vector3, AdditiveBlending, CatmullRomCurve3, Camera } from 'three'

const ITEMS = [
  { name: 'Cúp', image: '/pictures/12/Cúp.jpg', color: '#FFD700' },
  { name: 'Nhà', image: '/pictures/12/Nhà.jpg', color: '#4CAF50' },
  { name: 'Phượng hoàng', image: '/pictures/12/Phượng hoàng.jpg', color: '#FF5722' },
  { name: 'Sao', image: '/pictures/12/Sao.jpg', color: '#FFFF00' },
  { name: 'Sách', image: '/pictures/12/Sách.jpg', color: '#2196F3' },
  { name: 'Tiền', image: '/pictures/12/Tiền.jpg', color: '#8BC34A' },
  { name: 'Tranh', image: '/pictures/12/Tranh.jpg', color: '#9C27B0' },
  { name: 'Trăng', image: '/pictures/12/Trăng.jpg', color: '#E0E0E0' },
  { name: 'Tôi', image: '/pictures/12/Tôi.jpg', color: '#F44336' },
  { name: 'Địa cầu', image: '/pictures/12/Địa cầu.jpg', color: '#03A9F4' },
  { name: 'Đối tác', image: '/pictures/12/Đối tác.jpg', color: '#FF9800' },
  { name: 'Đồng hồ', image: '/pictures/12/Đồng hồ.jpg', color: '#607D8B' }
]

const textures = shallowRef([])
const textureLoader = new TextureLoader()
const groupRefs = shallowRef([])

const roundedRectShape = new Shape()
const width = 3.2
const height = 2.2
const radius = 0.5
const x = -width / 2
const y = -height / 2

roundedRectShape.moveTo(x, y + radius)
roundedRectShape.lineTo(x, y + height - radius)
roundedRectShape.quadraticCurveTo(x, y + height, x + radius, y + height)
roundedRectShape.lineTo(x + width - radius, y + height)
roundedRectShape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius)
roundedRectShape.lineTo(x + width, y + radius)
roundedRectShape.quadraticCurveTo(x + width, y, x + width - radius, y)
roundedRectShape.lineTo(x + radius, y)
roundedRectShape.quadraticCurveTo(x, y, x, y + radius)

// Hollow out for the frame
const hole = new Path()
const border = 0.1
const hX = x + border
const hY = y + border
const hW = width - 2 * border
const hH = height - 2 * border
const hR = radius * 0.8 // Slightly smaller radius for inner hole

hole.moveTo(hX, hY + hR)
hole.lineTo(hX, hY + hH - hR)
hole.quadraticCurveTo(hX, hY + hH, hX + hR, hY + hH)
hole.lineTo(hX + hW - hR, hY + hH)
hole.quadraticCurveTo(hX + hW, hY + hH, hX + hW, hY + hH - hR)
hole.lineTo(hX + hW, hY + hR)
hole.quadraticCurveTo(hX + hW, hY, hX + hW - hR, hY)
hole.lineTo(hX + hR, hY)
hole.quadraticCurveTo(hX, hY, hX, hY + hR)

roundedRectShape.holes.push(hole)

const extrudeSettings = {
  steps: 1,
  depth: 0.2, // Thickness of the frame
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.1,
  bevelSegments: 5
}

onMounted(() => {
  ITEMS.forEach((item, index) => {
    textureLoader.load(item.image, (tex) => {
      textures.value[index] = tex
      triggerRef(textures)
    })
  })
})

const getPosition = (index: number): [number, number, number] => {
  const col = index % 4
  const row = Math.floor(index / 4)
  const x = (col - 1.5) * 6 // Increased spacing
  const y = (1 - row) * 5
  return [x, y, 0]
}

const { onLoop } = useRenderLoop()

onLoop(({ camera }) => {
  if (!camera) return
  
  // Make each group look at the camera
  groupRefs.value.forEach((group) => {
    if (group) {
        // We want the front of the plane (z+) to face the camera
        // group.lookAt(camera.position) makes the group's positive z-axis point to camera
        group.lookAt(camera.position)
    }
  })
})

</script>

<template>
  <div class="scene-container">
    <TresCanvas window-size glow clear-color="#050505">
      <TresPerspectiveCamera :position="[0, 0, 20]" :look-at="[0, 0, 0]" />
      <OrbitControls :enable-damping="true" :damping-factor="0.05" />
      
      <Stars :radius="100" :count="5000" :size="0.1" :fade="true" />
      <TresAmbientLight :intensity="1" />
      <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" />

      <TresGroup 
        v-for="(item, index) in ITEMS" 
        :key="item.name"
        :position="getPosition(index)"
        :ref="(el) => { if(el) groupRefs[index] = el }"
      >
        <!-- Rounded Frame (Glowing) -->
        <TresMesh>
           <TresExtrudeGeometry :args="[roundedRectShape, extrudeSettings]" />
           <TresMeshStandardMaterial 
             :color="item.color" 
             :emissive="item.color"
             :emissive-intensity="2"
             :roughness="0.2"
             :metalness="0.8"
           />
        </TresMesh>
        
        <!-- Bloom/Glow Halo -->
         <TresMesh :position="[0, 0, -0.2]">
           <TresExtrudeGeometry :args="[roundedRectShape, { ...extrudeSettings, depth: 0.01, bevelSize: 0.3 }]" />
           <TresMeshBasicMaterial 
             :color="item.color" 
             :transparent="true"
             :opacity="0.3"
             :blending="AdditiveBlending"
           />
        </TresMesh>


        <!-- Image Plane (Centered in frame) -->
        <TresMesh :position="[0, 0, 0.1]">
          <TresPlaneGeometry :args="[3, 2]" />
          <TresMeshBasicMaterial 
            v-if="textures[index]" 
            :map="textures[index]" 
            :side="DoubleSide"
          />
          <TresMeshBasicMaterial 
            v-else 
            color="#222" 
            :side="DoubleSide"
          />
        </TresMesh>

        <!-- Label -->
        <Html 
          :position="[0, -1.8, 0]" 
          center 
          transform
          :distance-factor="12"
          :occlude="false"
        >
          <div class="label" :style="{ borderColor: item.color, boxShadow: `0 0 10px ${item.color}` }">{{ item.name }}</div>
        </Html>
      </TresGroup>

    </TresCanvas>
  </div>
</template>

<style scoped>
.scene-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.label {
  color: white;
  font-family: sans-serif;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 0 0 5px black;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 15px;
  border-radius: 20px;
  border: 2px solid white;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}
</style>
