<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden;">
    <TresCanvas window-size :clear-color="backgroundColor" shadows>
      <TresPerspectiveCamera 
        :position="cameraPosition" 
        :look-at="[0, 0, 0]"
        :fov="45"
      />
      
      <OrbitControls v-if="controlsEnabled" />

      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight 
        :position="[5, 5, 5]" 
        :intensity="1" 
        cast-shadow 
      />

      <TresGroup>
        <TresMesh 
          ref="interactiveDessert"
          :position="[0, 1.5, 0]"
          :scale="dessertScale"
          @click="handleDessertClick"
          @pointer-enter="handleDessertHover"
          @pointer-leave="handleDessertLeave"
          cast-shadow
        >
          <TresBoxGeometry :args="[2, 2, 2]" />
          <TresMeshStandardMaterial 
            :color="dessertColor"
            :metalness="dessertMetalness"
            :roughness="dessertRoughness"
          />
        </TresMesh>
        
        <TresMesh 
          v-if="mode === 'vr'"
          ref="gazeCursor"
          :position="gazeCursorPosition"
        >
          <TresSphereGeometry :args="[0.1, 16, 16]" />
          <TresMeshBasicMaterial color="#00ffff" />
        </TresMesh>
        
        <TresMesh 
          v-for="marker in arMarkers"
          :key="marker.id"
          :position="marker.position"
          :visible="mode === 'ar'"
        >
          <TresBoxGeometry :args="[0.3, 0.3, 0.3]" />
          <TresMeshBasicMaterial :color="marker.color" />
        </TresMesh>
        
        <TresGroup>
          <TresMesh 
            v-for="(item, index) in environmentItems"
            :key="index"
            :position="item.position"
            cast-shadow
          >
            <component :is="item.geometry" :args="item.geometryArgs" />
            <TresMeshStandardMaterial :color="item.color" />
          </TresMesh>
        </TresGroup>
        
        <TresMesh 
          v-if="mode === 'vr'"
          :rotation="[-Math.PI / 2, 0, 0]"
          receive-shadow
        >
          <TresPlaneGeometry :args="[20, 20, 10, 10]" />
          <TresMeshBasicMaterial color="#222233" wireframe />
        </TresMesh>
        
        <TresMesh 
          v-else
          :rotation="[-Math.PI / 2, 0, 0]"
          :position="[0, -1, 0]"
          receive-shadow
        >
          <TresPlaneGeometry :args="[20, 20]" />
          <TresMeshStandardMaterial 
            color="#333344"
            :metalness="0.3"
            :roughness="0.8"
          />
        </TresMesh>
      </TresGroup>

    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { TresCanvas, useRenderLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

// --- State ---
const mode = ref('desktop') // 'ar', 'vr', 'desktop'
const backgroundColor = ref('#1a1a2e')
const cameraPosition = ref([0, 5, 10])
const controlsEnabled = ref(true)

// --- Object Refs & Props ---
const interactiveDessert = ref(null)
const dessertColor = ref('#ff6b6b')
const dessertMetalness = ref(0.3)
const dessertRoughness = ref(0.7)
const dessertScale = ref([1, 1, 1])

// --- VR/AR Props ---
const gazeCursorPosition = ref([0, 0, -3])
const arMarkers = ref([
  { id: 1, position: [-3, 0, -3], color: '#ff0000' },
  { id: 2, position: [3, 0, -3], color: '#00ff00' },
  { id: 3, position: [0, 0, 3], color: '#0000ff' },
])
const environmentItems = [
  { geometry: 'TresBoxGeometry', geometryArgs: [1, 1, 1], position: [-5, 0.5, 0], color: '#555555' },
  { geometry: 'TresSphereGeometry', geometryArgs: [0.5, 32, 32], position: [5, 0.5, 0], color: '#888888' },
  { geometry: 'TresConeGeometry', geometryArgs: [0.5, 1, 16], position: [0, 0.5, -5], color: '#aaaaaa' },
]

// --- Animation Loop ---
const { onLoop } = useRenderLoop()

onLoop(({ delta, elapsed }) => {
  // 1. Xoay vật thể (Desktop mode only)
  if (mode.value === 'desktop' && interactiveDessert.value) {
    interactiveDessert.value.rotation.y += delta * 0.5
  }

  // 2. Di chuyển Gaze Cursor (Simulate VR)
  if (mode.value === 'vr') {
    gazeCursorPosition.value = [
      Math.sin(elapsed) * 2,
      Math.cos(elapsed * 0.5) * 2,
      -3 + Math.sin(elapsed * 0.3)
    ]
  }
})

// --- Logic ---
const switchMode = (newMode) => {
  mode.value = newMode
  
  // Cấu hình Camera & Scene theo Mode
  switch(newMode) {
    case 'ar':
      cameraPosition.value = [0, 1.6, 2] // Góc nhìn gần
      backgroundColor.value = '#000000' // Giả lập nền camera đen
      controlsEnabled.value = false
      dessertScale.value = [0.5, 0.5, 0.5]
      console.log('%c[MODE] Switched to AR (Mobile view)', 'color: orange; font-weight: bold')
      break
    case 'vr':
      cameraPosition.value = [0, 1.6, 5]
      backgroundColor.value = '#0a0a1a'
      controlsEnabled.value = false // Tắt chuột để dùng Gaze
      dessertScale.value = [0.8, 0.8, 0.8]
      console.log('%c[MODE] Switched to VR (Gaze interaction)', 'color: cyan; font-weight: bold')
      break
    case 'desktop':
      cameraPosition.value = [0, 5, 10]
      backgroundColor.value = '#1a1a2e'
      controlsEnabled.value = true
      dessertScale.value = [1, 1, 1]
      console.log('%c[MODE] Switched to Desktop', 'color: lime; font-weight: bold')
      break
  }
}

// --- Interaction Handlers ---
const handleDessertClick = () => {
  console.log(`[INTERACTION] Object Clicked in ${mode.value} mode`)
  
  // Visual feedback
  const originalColor = dessertColor.value
  dessertColor.value = '#ffffff' // Flash white
  setTimeout(() => {
    dessertColor.value = originalColor
  }, 200)
}

const handleDessertHover = () => {
  if (mode.value === 'desktop') {
    console.log('[INTERACTION] Hover Enter')
    dessertMetalness.value = 0.9
  }
}

const handleDessertLeave = () => {
  if (mode.value === 'desktop') {
    dessertMetalness.value = 0.3
  }
}

// --- Keyboard Controls ---
const handleKeydown = (e) => {
  if (e.key === '1') switchMode('ar')
  if (e.key === '2') switchMode('vr')
  if (e.key === '3') switchMode('desktop')
}

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  
  console.clear()
  console.log('%c=== 3D DEMO STARTED ===', 'font-size: 14px; font-weight: bold')
  console.log('Press "1" for AR Mode')
  console.log('Press "2" for VR Mode')
  console.log('Press "3" for Desktop Mode')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>   