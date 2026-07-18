<template>
  <div style="width: 100vw; height: 100vh; overflow: hidden; background-color: #1a1a2e;">
    <TresCanvas window-size shadows clear-color="#1a1a2e">
      <TresPerspectiveCamera 
        ref="cameraRef"
        :position="cameraTargetPos" 
        :look-at="[0, 0, 0]" 
        :fov="45" 
      />
      <OrbitControls make-default :enable-damping="true" :damping-factor="0.05" />

      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight 
        :position="[5, 10, 5]" 
        :intensity="1.5" 
        cast-shadow 
      />
      <TresSpotLight
        :position="[0, 5, 0]"
        :intensity="2"
        :angle="0.5"
        penumbra="1"
        cast-shadow
      />

      <TresGroup>
        
        <TresGroup ref="cakeGroup" :position="[0, 0, 0]">
          <TresMesh 
            ref="mainDessert"
            :position="[0, 1, 0]"
            cast-shadow receive-shadow
            @click="zoomToDetail"
            @pointer-enter="onHoverStart"
            @pointer-leave="onHoverEnd"
          >
            <TresCylinderGeometry :args="[1.5, 1.8, 2, 64]" />
            <TresMeshStandardMaterial 
              :color="dessertColor"
              :emissive="dessertColor"
              :emissive-intensity="isHovered ? 0.4 : 0.1"
              :roughness="0.3"
              :metalness="0.1"
            />
          </TresMesh>

          <TresMesh :position="[0, 2.1, 0]" cast-shadow>
            <TresSphereGeometry :args="[0.4, 32, 32]" />
            <TresMeshStandardMaterial color="#ff0000" :roughness="0.1" />
          </TresMesh>

          <Sparkles 
            v-if="showSparkles"
            :count="30"
            :scale="4"
            :size="3"
            :speed="0.5"
            :opacity="0.8"
            color="#ffffaa"
            :position="[0, 1, 0]"
          />
        </TresGroup>

        <Suspense>
          <TresGroup :position="[-4, 3, -2]">
            <Text3D
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
              text="HEART CAKE DLX"
              :size="0.5"
              :height="0.1"
            >
              <TresMeshStandardMaterial color="#ffffff" />
            </Text3D>
            
            <Text3D
              :position="[0, -0.7, 0]"
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
              text="Interactive Demo"
              :size="0.25"
              :height="0.05"
            >
              <TresMeshStandardMaterial color="#8888aa" />
            </Text3D>
          </TresGroup>
        </Suspense>

        <TresGroup :position="[4, 1, 2]" :rotation="[0, -0.5, 0]">
          
          <Suspense>
            <Text3D 
              position="[-1, 1.5, 0]" 
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json" 
              text="COLORS" :size="0.2"
            >
              <TresMeshBasicMaterial color="white" />
            </Text3D>
          </Suspense>

          <TresMesh 
            v-for="(col, idx) in colorOptions" 
            :key="idx"
            :position="[idx - 1, 1, 0]"
            @click="(e) => changeColor(e, col)"
          >
            <TresSphereGeometry :args="[0.3, 32, 32]" />
            <TresMeshStandardMaterial :color="col" />
          </TresMesh>

          <Suspense>
            <Text3D 
              position="[-1, 0, 0]" 
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json" 
              text="AUTO-ROTATE" :size="0.2"
            >
              <TresMeshBasicMaterial color="white" />
            </Text3D>
          </Suspense>

          <TresMesh :position="[0.5, 0.1, 0]" @click="toggleRotation">
            <TresBoxGeometry :args="[0.5, 0.5, 0.1]" />
            <TresMeshStandardMaterial :color="autoRotate ? '#00ff00' : '#ff0000'" />
          </TresMesh>

          <Suspense>
            <Text3D 
              position="[-1, -1, 0]" 
              font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json" 
              text="VIEWS" :size="0.2"
            >
              <TresMeshBasicMaterial color="white" />
            </Text3D>
          </Suspense>

          <TresMesh :position="[-0.5, -1.5, 0]" @click="setCameraView('front')">
            <TresBoxGeometry :args="[0.4, 0.4, 0.4]" />
            <TresMeshStandardMaterial color="#5555ff" />
          </TresMesh>
           <TresMesh :position="[0.5, -1.5, 0]" @click="setCameraView('top')">
            <TresBoxGeometry :args="[0.4, 0.4, 0.4]" />
            <TresMeshStandardMaterial color="#55ffff" />
          </TresMesh>

        </TresGroup>

        <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -0.1, 0]" receive-shadow>
          <TresPlaneGeometry :args="[20, 20]" />
          <TresMeshStandardMaterial color="#222233" :roughness="0.8" :metalness="0.2" />
          <TresGridHelper :args="[20, 20, 0x444466, 0x222233]" :rotation="[-Math.PI/2, 0, 0]" />
        </TresMesh>

      </TresGroup>

      <Suspense>
        <EffectComposer>
          <Bloom :intensity="0.5" :luminance-threshold="0.2" :luminance-smoothing="0.9" />
          <Vignette :darkness="0.5" :offset="0.1" />
        </EffectComposer>
      </Suspense>

    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, Text3D, Sparkles } from '@tresjs/cientos'
import { EffectComposer, Bloom, Vignette } from '@tresjs/post-processing'
import * as THREE from 'three'

// --- STATE ---
const dessertColor = ref('#ff6b6b')
const isHovered = ref(false)
const autoRotate = ref(true)
const showSparkles = ref(true)

// Camera State
const cameraRef = ref(null)
const cameraTargetPos = ref([0, 4, 10]) // Vị trí mong muốn của camera

// Refs
const cakeGroup = ref(null)

// Data
const colorOptions = ['#ff6b6b', '#6bffff', '#ffcc00']

// --- ACTIONS & LOGIC ---

// Helper Log
const log = (msg, style = 'color: cyan') => {
  console.log(`%c[SHOWCASE] ${msg}`, style)
}

// 1. Color Interaction
const changeColor = (event, color) => {
  event.stopPropagation()
  dessertColor.value = color
  log(`Color changed to ${color}`, `color: ${color}`)
}

// 2. Rotation Interaction
const toggleRotation = (event) => {
  event.stopPropagation()
  autoRotate.value = !autoRotate.value
  log(`Auto-Rotation: ${autoRotate.value ? 'ON' : 'OFF'}`, autoRotate.value ? 'color: lime' : 'color: red')
}

// 3. Highlight Interaction
const onHoverStart = () => {
  isHovered.value = true
  document.body.style.cursor = 'pointer'
}
const onHoverEnd = () => {
  isHovered.value = false
  document.body.style.cursor = 'auto'
}

// 4. Camera Interaction
const setCameraView = (view) => {
  if (view === 'front') {
    cameraTargetPos.value = [0, 4, 10]
    log('Camera: Front View')
  } else if (view === 'top') {
    cameraTargetPos.value = [0, 10, 0.1] // 0.1 z để tránh khóa gimbal lock
    log('Camera: Top View')
  }
}

const zoomToDetail = (event) => {
  event.stopPropagation()
  cameraTargetPos.value = [0, 2, 4]
  autoRotate.value = false // Tắt xoay để soi kỹ
  log('Action: Zoom Detail & Pause Rotation')
}

// --- ANIMATION LOOP ---
const { onLoop } = useRenderLoop()

onLoop(({ delta }) => {
  // 1. Rotate Cake
  if (autoRotate.value && cakeGroup.value) {
    cakeGroup.value.rotation.y += delta * 0.5
  }

  // 2. Smooth Camera Movement (Lerp)
  // Thay vì dùng GSAP, ta tự code lerp đơn giản trong loop
  if (cameraRef.value) {
    cameraRef.value.position.lerp(new THREE.Vector3(...cameraTargetPos.value), 0.05)
    cameraRef.value.lookAt(0, 1, 0)
  }
})

// --- LIFECYCLE ---
onMounted(() => {
  console.clear()
  console.log('%c🍰 PURE 3D PRODUCT SHOWCASE', 'font-size: 16px; font-weight: bold; background: #222; color: #ff6b6b; padding: 10px;')
  console.log('%c[INTERACT] Click Colored Spheres to change Color', 'color: gray')
  console.log('%c[INTERACT] Click Box Switch to Toggle Rotation', 'color: gray')
  console.log('%c[INTERACT] Click Cake to Zoom In', 'color: gray')
})
</script>