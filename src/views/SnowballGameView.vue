<script setup lang="ts">
import { ref, shallowRef, onMounted, toRaw } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, Stars, Html } from '@tresjs/cientos'
import { TextureLoader, AdditiveBlending } from 'three'
import gsap from 'gsap'
import UniversalModel from '@/components/models/UniversalModel.vue'

// --- CONFIGURATION ---
const SPHERE_ITEMS = [
  { id: 1, letter: 'I', image: '/pictures/canon_at-1_retro_camera.png', color: '#FF6B6B' },
  { id: 2, letter: 'L', image: '/pictures/choco_bunny.png', color: '#4ECDC4' },
  { id: 3, letter: 'O', image: '/pictures/christmas_cute_reindeer.png', color: '#45B7D1' },
  { id: 4, letter: 'V', image: '/pictures/cute_snow_globe.png', color: '#FFA07A' },
  { id: 5, letter: 'E', image: '/pictures/donut_sweet.png', color: '#98D8C8' },
  { id: 6, letter: 'Y', image: '/pictures/koi_cat.png', color: '#F7DC6F' },
  { id: 7, letter: 'O', image: '/pictures/moon.png', color: '#BB8FCE' },
  { id: 8, letter: 'U', image: '/pictures/nis.png', color: '#F8B500' }
]

const ORBIT_RADIUS = 6
const SPHERE_RADIUS = 0.8
const SPRITE_SIZE = 1.2

// --- STATE ---
const isDarkTheme = ref(true)
const selectedSphere = ref(null)

// Textures
const textureLoader = new TextureLoader()
const sphereTextures = ref([])

// QUAN TRỌNG: shallowRef để tránh lỗi Proxy với GSAP
const groupRefs = shallowRef([])

// --- HELPERS ---
const calculatePosition = (index, total) => {
  const angle = (index / total) * Math.PI * 2
  const x = Math.cos(angle) * ORBIT_RADIUS
  const z = Math.sin(angle) * ORBIT_RADIUS
  const y = 0
  return [x, y, z]
}

const onSphereClick = (item, index) => {
  selectedSphere.value = item
  const targetGroup = groupRefs.value[index]
  if (targetGroup) {
    const rawGroup = toRaw(targetGroup)
    
    gsap.to(rawGroup.scale, {
      x: 1.3,
      y: 1.3,
      z: 1.3,
      duration: 0.3,
      yoyo: true,
      repeat: 1,
      ease: 'elastic.out(1, 0.3)'
    })
  }
}

// --- LIFECYCLE ---
onMounted(() => {
  SPHERE_ITEMS.forEach((item, index) => {
    textureLoader.load(item.image, (texture) => {
      sphereTextures.value[index] = texture
    })
  })
})

// --- ANIMATION LOOP (Tắt để giảm lag) ---
// const { onLoop } = useRenderLoop()
// onLoop(({ elapsed }) => {
//   // Animation sẽ thêm sau
// })
</script>

<template>
  <div class="scene-wrapper">
    <TresCanvas shadows alpha window-size :clear-color="isDarkTheme ? '#0a0f1a' : '#87CEEB'">
      <TresPerspectiveCamera :position="[0, 3, 15]" :look-at="[0, 0, 0]" />
      
      <OrbitControls 
        :enable-pan="false" 
        :enable-zoom="true"
        :min-distance="5"
        :max-distance="50"
        :enable-damping="true"
        :damping-factor="0.05"
      />
      
      <!-- Environment -->
      <Stars v-if="isDarkTheme" :radius="100" :depth="50" :count="3000" :size="0.1" :saturation="0" />
      
      <!-- Lighting -->
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight :position="[5, 10, 5]" :intensity="1.5" cast-shadow />
      <TresPointLight :position="[0, 5, 0]" :intensity="0.8" color="#FFD700" />
      
      <!-- Central Christmas Tree -->
      <TresGroup :position="[0, -2, 0]">
        <UniversalModel 
          Path="/models/xmas_tree_-_cartoonish__stylized.glb"
          :scale="[0.5, 0.5, 0.5]"
          :draco="true"
        />
      </TresGroup>
      
      <!-- 8 Spheres with Sprites -->
      <TresGroup 
        v-for="(item, index) in SPHERE_ITEMS" 
        :key="item.id"
        :ref="el => { if (el) groupRefs[index] = el }"
        :position="calculatePosition(index, SPHERE_ITEMS.length)"
      >
        <!-- Sprite - Ảnh luôn hướng về camera -->
        <TresSprite :scale="[SPRITE_SIZE, SPRITE_SIZE, 1]">
          <TresSpriteMaterial 
            v-if="sphereTextures[index]" 
            :map="sphereTextures[index]" 
            :transparent="true"
            :opacity="1"
          />
        </TresSprite>
        
        <!-- Glass Sphere - Vỏ kính trong suốt bọc ngoài với click event -->
        <TresMesh @click="onSphereClick(item, index)">
          <TresSphereGeometry 
          :args="[SPHERE_RADIUS, 32, 32]" 
          :visible="true"/>
          <TresMeshBasicMaterial 
            :color="item.color" 
            :transparent="true" 
            :opacity="0.1"
            :blending="AdditiveBlending"
            :side="2"
          />
        </TresMesh>
        <TresMesh :rotation="[Math.PI / 2, 0, 0]">
          <TresSphereGeometry :args="[SPHERE_RADIUS, 32, 32]" />
          <TresMeshBasicMaterial 
            :color="item.color" 
            :transparent="true" 
            :opacity="0.1"
            :blending="AdditiveBlending"
            :side="2"
          />
        </TresMesh>
        
        <!-- Point Light - Tạo hình cầu phát sáng -->
        <TresPointLight :color="item.color" :intensity="3" :distance="6" :decay="2" />
        
        <!-- 3D HTML Label - Text theo camera -->
        <Html 
          :position="[0, SPHERE_RADIUS + 0.7, 0]"
          :center="true"
          :distance-factor="8"
          :occlude="false"
          :sprite="true"
        >
          <div class="sphere-label" :style="{ 
            color: item.color,
            textShadow: `0 0 20px ${item.color}, 0 0 40px ${item.color}`
          }">
            {{ item.letter }}
          </div>
        </Html>
      </TresGroup>
      
    </TresCanvas>
    
    <!-- UI Overlay -->
    <div class="ui-overlay">
      <div class="theme-toggle">
        <button class="btn-icon" @click="isDarkTheme = !isDarkTheme">
          {{ isDarkTheme ? '🌙' : '☀️' }}
        </button>
      </div>
      
      <transition name="fade">
        <div v-if="selectedSphere" class="selection-info">
          <h2 :style="{ color: selectedSphere.color }">{{ selectedSphere.letter }}</h2>
          <p>{{ selectedSphere.id }} / 8</p>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.scene-wrapper {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}

.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  pointer-events: auto;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.selection-info {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 20px 50px;
  border-radius: 20px;
  color: white;
  text-align: center;
  backdrop-filter: blur(15px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.selection-info h2 {
  margin: 0;
  font-size: 4rem;
  font-weight: 900;
  text-transform: uppercase;
}

.selection-info p {
  margin: 10px 0 0 0;
  font-size: 1rem;
  opacity: 0.7;
  letter-spacing: 2px;
}

/* 3D HTML Label Styling */
.sphere-label {
  font-family: 'Impact', 'Arial Black', sans-serif;
  font-size: 3rem;
  font-weight: 900;
  color: white;
  padding: 10px 25px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 3px solid currentColor;
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* Mobile Optimization */
@media (max-width: 768px) {
  .sphere-label {
    font-size: 2rem;
    padding: 8px 18px;
  }
  
  .selection-info h2 {
    font-size: 2.5rem;
  }
  
  .btn-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }
}
</style>
