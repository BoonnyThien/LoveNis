<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden; background-color: #1a1a2a;">
    <TresCanvas window-size shadows clear-color="#1a1a2a">
      <TresPerspectiveCamera :position="[0, 8, 12]" :look-at="[0, 0, 0]" :fov="45" />
      <OrbitControls make-default />

      <TresAmbientLight :intensity="0.6" />
      <TresDirectionalLight 
        :position="[5, 10, 5]" 
        :intensity="1.2" 
        cast-shadow 
        :shadow-mapSize="[1024, 1024]"
      />
      <TresSpotLight 
        v-if="selectedType"
        :position="[selectedType.uiPosition[0], 5, selectedType.uiPosition[2]]" 
        :target-position="selectedType.uiPosition"
        :intensity="2" 
        color="#ffffff" 
        :angle="0.5"
        penumbra="1"
      />

      <TresGroup>
        
        <TresGroup :position="[-5, 5, -5]">
          <Suspense>
            <Text3D
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
              :text="`SCORE: ${score}`"
              :size="0.8"
              :height="0.1"
            >
              <TresMeshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" :emissive-intensity="0.5" />
            </Text3D>
          </Suspense>

          <Suspense>
            <Text3D
              :position="[0, -1.2, 0]"
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
              :text="`TIME: ${timeLeft}s`"
              :size="0.6"
              :height="0.1"
            >
              <TresMeshStandardMaterial :color="timeLeft < 10 ? '#ff5555' : '#ffffff'" />
            </Text3D>
          </Suspense>
        </TresGroup>

        <TresMesh 
          ref="cakeBase"
          :position="[0, 1.25, 0]"
          receive-shadow
          @click="placeDecoration"
        >
          <TresCylinderGeometry :args="[2.5, 2.5, 2.5, 32]" />
          <TresMeshStandardMaterial color="#f8c8dc" :roughness="0.3" :metalness="0.1" />
        </TresMesh>
        
        <TresMesh :position="[0, 0.1, 0]" receive-shadow>
           <TresCylinderGeometry :args="[3, 3.2, 0.2, 32]" />
           <TresMeshStandardMaterial color="#ffffff" />
        </TresMesh>

        <TresGroup>
          <TresMesh
            v-for="(deco, index) in placedDecorations"
            :key="`placed-${index}`"
            :position="deco.position"
            :rotation="deco.rotation"
            @click="(e) => removeDecoration(e, index)"
            cast-shadow
          >
            <component :is="deco.geometry" :args="deco.args" />
            <TresMeshStandardMaterial :color="deco.color" />
          </TresMesh>
        </TresGroup>

        <TresGroup>
          <TresMesh
            v-for="(type, index) in decorationTypes"
            :key="`type-${index}`"
            :position="type.uiPosition"
            @click="(e) => selectType(e, type)"
          >
            <component :is="type.geometry" :args="type.args" />
            <TresMeshStandardMaterial 
              :color="type.color" 
              :emissive="selectedType.id === type.id ? type.color : '#000000'"
              :emissive-intensity="0.5"
            />
            
            <Levioso v-if="selectedType.id === type.id" :speed="3" :range="0.2" />

            <Suspense>
              <Text3D
                :position="[-0.2, -0.8, 0]"
                font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
                :text="`${index + 1}`"
                :size="0.5"
                :height="0.05"
              >
                <TresMeshBasicMaterial color="white" />
              </Text3D>
            </Suspense>
          </TresMesh>
        </TresGroup>

        <Sparkles 
          v-if="showSparkles"
          :position="lastClickPos" 
          :count="15" 
          :scale="2" 
          :size="2" 
          :speed="2" 
          color="yellow" 
        />

        <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -0.1, 0]" receive-shadow>
          <TresPlaneGeometry :args="[50, 50]" />
          <TresMeshStandardMaterial color="#111111" :roughness="1" />
        </TresMesh>

      </TresGroup>
    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, Text3D, Levioso, Sparkles } from '@tresjs/cientos'
import * as THREE from 'three'

// --- 1. DATA CONFIGURATION ---
const decorationTypes = [
  { id: 1, name: 'Cherry', color: '#ff0000', geometry: 'TresSphereGeometry', args: [0.3, 16, 16], uiPosition: [-6, 2, 0] },
  { id: 2, name: 'Candle', color: '#ffff00', geometry: 'TresCylinderGeometry', args: [0.1, 0.1, 1, 16], uiPosition: [-6, 2, 2] },
  { id: 3, name: 'Cube', color: '#00ff00', geometry: 'TresBoxGeometry', args: [0.4, 0.4, 0.4], uiPosition: [-6, 2, 4] },
  { id: 4, name: 'Choco', color: '#8B4513', geometry: 'TresConeGeometry', args: [0.3, 0.5, 16], uiPosition: [-6, 2, -2] },
  { id: 5, name: 'Berry', color: '#ff00ff', geometry: 'TresIcosahedronGeometry', args: [0.3, 0], uiPosition: [-6, 2, -4] },
]

// --- 2. GAME STATE ---
const score = ref(0)
const timeLeft = ref(60)
const gameActive = ref(true)
const selectedType = ref(decorationTypes[0])
const placedDecorations = ref([])

// Feedback Visuals
const showSparkles = ref(false)
const lastClickPos = ref([0,0,0])

// --- 3. GAME LOGIC ---

const log = (msg, style = 'color: #fff') => {
  console.log(`%c[CAKE GAME] ${msg}`, style)
}

// Timer Loop
const { onLoop } = useRenderLoop()
onLoop(({ delta }) => {
  if (gameActive.value && timeLeft.value > 0) {
    timeLeft.value = Math.max(0, timeLeft.value - delta)
    if (timeLeft.value <= 0) {
      gameActive.value = false
      log(`GAME OVER! Final Score: ${score.value}`, 'color: red; font-size: 16px; font-weight: bold')
    }
  }
})

// Interaction: Chọn vật phẩm (Click 3D Palette hoặc phím tắt)
const selectType = (event, type) => {
  if(event) event.stopPropagation()
  selectedType.value = type
  log(`Selected: ${type.name}`, `color: ${type.color}`)
}

// Interaction: Đặt vật phẩm lên bánh
const placeDecoration = (event) => {
  if (!gameActive.value) return
  event.stopPropagation() // Ngăn click xuyên qua sàn

  // Lấy tọa độ click trên mặt bánh
  const point = event.point 
  
  // Logic đặt vật phẩm
  placedDecorations.value.push({
    ...selectedType.value,
    position: [point.x, point.y + 0.2, point.z], // Nhấc lên 1 chút để không chìm vào bánh
    rotation: [Math.random() * 0.5, Math.random() * Math.PI, 0]
  })

  // Update Score
  score.value += 10
  log(`Placed ${selectedType.value.name} (+10pts)`, 'color: lightgreen')

  // Trigger Visual Effect
  lastClickPos.value = [point.x, point.y + 0.5, point.z]
  showSparkles.value = true
  setTimeout(() => showSparkles.value = false, 300)
}

// Interaction: Xóa vật phẩm
const removeDecoration = (event, index) => {
  event.stopPropagation()
  placedDecorations.value.splice(index, 1)
  score.value -= 5
  log('Removed decoration (-5pts)', 'color: orange')
}

// Keyboard Controls
const handleKeydown = (e) => {
  const key = e.key.toLowerCase()
  
  // Chọn trang trí 1-5
  if (key >= '1' && key <= '5') {
    const index = parseInt(key) - 1
    if (decorationTypes[index]) selectType(null, decorationTypes[index])
  }
  
  // Clear All
  if (key === 'c') {
    placedDecorations.value = []
    log('Cleared all decorations', 'color: yellow')
  }
  
  // Submit / Reset
  if (key === 'enter') {
    if(timeLeft.value <= 0) {
      // Reset game
      timeLeft.value = 60
      score.value = 0
      placedDecorations.value = []
      gameActive.value = true
      log('Game Restarted!', 'color: cyan')
    } else {
      // Submit sớm
      log(`Cake Submitted! Bonus Time: ${Math.floor(timeLeft.value)}pts`, 'color: cyan')
      score.value += Math.floor(timeLeft.value)
      gameActive.value = false
      timeLeft.value = 0
    }
  }
}

// --- 4. LIFECYCLE ---
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  
  // Initial Log
  console.clear()
  console.log('%c🎂 3D DECORATE CAKE GAME', 'font-size: 20px; font-weight: bold; color: #f8c8dc; background: #333; padding: 10px; border-radius: 5px;')
  console.log('%c[MOUSE]   Left Click on Cake to Decorate', 'color: #ccc')
  console.log('%c[1-5]     Select Decoration Type', 'color: #ccc')
  console.log('%c[C]       Clear All Decorations', 'color: #ccc')
  console.log('%c[ENTER]   Submit Cake / Restart', 'color: #ccc')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>