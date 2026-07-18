<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden; background-color: #000;">
        <TresCanvas window-size :clear-color="backgroundColor" shadows>
      <TresPerspectiveCamera 
        ref="cameraRef"
        :position="[0, 10, 25]" 
        :look-at="[0, 0, 0]"
        :fov="45"
      />
      <OrbitControls make-default />

      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[10, 20, 10]" :intensity="1.5" cast-shadow />
      <TresPointLight :position="[-10, 10, -10]" :intensity="0.5" color="#00ffff" />

      <TresGroup>
        
        <TresGroup>
          <TresMesh
            v-for="(data, index) in chartData"
            :key="`bar-${index}`"
            :position="[index * 3 - 6, data.value / 2, 0]"
            @click="(e) => selectDataPoint(e, data)"
            @pointer-enter="highlightBar(index)"
            @pointer-leave="unhighlightBar(index)"
          >
            <TresBoxGeometry :args="[2, data.value, 2]" />
            <TresMeshStandardMaterial 
              :color="data.color"
              :emissive="data.emissive"
              :emissive-intensity="data.emissiveIntensity"
              :metalness="0.5"
              :roughness="0.2"
            />
          </TresMesh>
          
          <TresMesh 
            v-for="(data, index) in chartData" 
            :key="`label-${index}`"
            :position="[index * 3 - 6.5, 0.1, 2]"
            :rotation="[-Math.PI / 2, 0, 0]"
          >
             <Text3D
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
              :size="0.5"
              :height="0.1"
              :text="data.label"
            >
              <TresMeshBasicMaterial color="#ffffff" />
            </Text3D>
          </TresMesh>
        </TresGroup>

        <TresMesh :position="[0, 5, -5]">
           <TresTubeGeometry :args="[linePathCurve, 64, 0.2, 8, false]" />
           <TresMeshBasicMaterial color="#00ffff" wireframe />
        </TresMesh>

        <TresGroup position="[10, 5, -5]">
          <TresMesh
            v-for="(slice, index) in pieChartData"
            :key="`pie-${index}`"
            :position="[0, index * 0.5, 0]"
          >
            <TresCylinderGeometry :args="[2, 2, 0.2, 32]" />
            <TresMeshStandardMaterial :color="slice.color" />
          </TresMesh>
        </TresGroup>

        <TresGroup>
          <TresMesh
            v-for="indicator in floatingIndicators"
            :key="indicator.id"
            :position="indicator.position"
            ref="indicatorRefs"
          >
            <TresBoxGeometry :args="[0.5, 0.5, 0.5]" />
            <TresMeshBasicMaterial :color="indicator.color" />
            <Levioso :speed="2" :range="0.5" />
          </TresMesh>
        </TresGroup>

        <TresMesh :position="[-5, 12, -2]">
          <Text3D
            font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
            text="ANALYTICS 3D"
            :size="1.5"
            :height="0.2"
          >
            <TresMeshNormalMaterial />
          </Text3D>
        </TresMesh>

        <TresGridHelper :args="[40, 40, 0x444444, 0x222222]" :position="[0, 0, 0]" />
      </TresGroup>

      <Suspense>
        <EffectComposer>
          <Bloom :intensity="1.5" :luminance-threshold="0.6" :luminance-smoothing="0.9" />
        </EffectComposer>
      </Suspense>

    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { TresCanvas ,useRenderLoop } from '@tresjs/core'
import { OrbitControls, Text3D, Levioso } from '@tresjs/cientos'
import { EffectComposer, Bloom } from '@tresjs/post-processing'

// --- 1. SETUP DATA ---
const chartData = ref([
  { label: 'VISIT', value: 8, color: '#ff5555', emissive: '#ff0000', emissiveIntensity: 0.2 },
  { label: 'CLICK', value: 12, color: '#55ff55', emissive: '#00ff00', emissiveIntensity: 0.2 },
  { label: 'ORDER', value: 6, color: '#5555ff', emissive: '#0000ff', emissiveIntensity: 0.2 },
  { label: 'REVN', value: 15, color: '#ffff55', emissive: '#ffff00', emissiveIntensity: 0.2 },
  { label: 'USER', value: 10, color: '#ff55ff', emissive: '#ff00ff', emissiveIntensity: 0.2 },
])

const pieChartData = [
  { color: '#ff6b6b' }, { color: '#4ecdc4' }, { color: '#ffd166' }, { color: '#6b6bff' }
]

const floatingIndicators = [
  { id: 1, position: [-12, 5, -5], color: '#ff0000' },
  { id: 2, position: [12, 5, -5], color: '#00ff00' },
]

// Curve for Line Chart
const points = []
for (let i = 0; i < 10; i++) {
  points.push(new THREE.Vector3((i * 2) - 10, Math.sin(i) * 3 + 5, 0))
}
const linePathCurve = new THREE.CatmullRomCurve3(points)

// State
const autoRefresh = ref(false)
const cameraRef = ref(null)

// --- 2. LOGIC & INTERACTIONS ---

// Helper log có màu sắc
const log = (label, msg, color = 'cyan') => {
  console.log(`%c[${label}] %c${msg}`, `color: ${color}; font-weight: bold`, 'color: white;')
}

// Click vào cột
const selectDataPoint = (event, data) => {
  event.stopPropagation() // Ngăn click xuyên qua
  log('INTERACTION', `Selected: ${data.label} | Value: ${data.value}`, data.color)
  
  // Hiệu ứng Visual click
  data.value += 1 // Tăng nhẹ giá trị để thấy phản hồi
  setTimeout(() => data.value -= 1, 200)
}

// Hover hiệu ứng
const highlightBar = (index) => {
  chartData.value[index].emissiveIntensity = 2.0
  document.body.style.cursor = 'pointer'
}

const unhighlightBar = (index) => {
  chartData.value[index].emissiveIntensity = 0.2
  document.body.style.cursor = 'auto'
}

// Logic Refresh Data
const updateRandomData = () => {
  chartData.value.forEach(data => {
    // Random height từ 2 đến 18
    data.value = Math.floor(Math.random() * 16) + 2
  })
  log('DATA', 'Updated with random values', 'orange')
}

// Camera Tour Animation
const startCameraTour = () => {
  if(!cameraRef.value) return
  log('CAMERA', 'Starting tour...', 'magenta')
  
  const startPos = { x: 0, y: 10, z: 25 }
  const path = [
    { x: 15, y: 15, z: 15 },
    { x: 0, y: 20, z: 5 },
    { x: -15, y: 15, z: 15 },
    startPos
  ]
  
  // Animation đơn giản (trong thực tế nên dùng GSAP)
  let step = 0
  const interval = setInterval(() => {
    if(step >= path.length) {
      clearInterval(interval)
      log('CAMERA', 'Tour finished', 'magenta')
      return
    }
    const p = path[step]
    cameraRef.value.position.set(p.x, p.y, p.z)
    cameraRef.value.lookAt(0,0,0)
    step++
  }, 1000)
}

// --- 3. KEYBOARD CONTROLS ---
const handleKeydown = (e) => {
  switch(e.key.toLowerCase()) {
    case 'r':
      updateRandomData()
      break
    case 'a':
      autoRefresh.value = !autoRefresh.value
      log('SYSTEM', `Auto Refresh: ${autoRefresh.value ? 'ON' : 'OFF'}`, autoRefresh.value ? 'green' : 'red')
      break
    case 'c':
      startCameraTour()
      break
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      log('FILTER', `Time Range Changed to Option ${e.key}`, 'yellow')
      updateRandomData() // Giả lập load data mới
      break
  }
}

// --- 4. LOOP & LIFECYCLE ---
const { onLoop } = useRenderLoop()

onLoop(({ delta, elapsed }) => {
  if (autoRefresh.value && elapsed % 3 < delta) { // Refresh mỗi ~3s
    updateRandomData()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  
  console.clear()
  console.log('%c📊 3D ANALYTICS DASHBOARD STARTED', 'font-size: 20px; color: #4ecdc4; font-weight: bold; padding: 10px; background: #333; border-radius: 5px;')
  console.log('%c----------------------------------------', 'color: gray')
  console.log('%c[CLICK]  Click on bars to see details', 'color: #ccc')
  console.log('%c[R]      Refresh Data Randomly', 'color: #ccc')
  console.log('%c[A]      Toggle Auto Refresh', 'color: #ccc')
  console.log('%c[C]      Start Camera Tour', 'color: #ccc')
  console.log('%c[1-5]    Change Time Range', 'color: #ccc')
  console.log('%c----------------------------------------', 'color: gray')
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>