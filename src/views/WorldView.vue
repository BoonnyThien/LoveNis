<script setup lang="ts">
import { ref, shallowRef, triggerRef, onMounted, toRaw } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, Stars, Html, Precipitation } from '@tresjs/cientos'
import { TextureLoader, AdditiveBlending, Shape as ThreeShape, ExtrudeGeometry, BackSide } from 'three'
import gsap from 'gsap'
import UniversalModel from '@/components/models/UniversalModel.vue'
import Screenshot from '@/components/ui/Screenshot.vue'
import SnowControls from '@/components/ui/SnowControls.vue'
import LightControls from '@/components/ui/LightControls.vue'
import FormationControls from '@/components/ui/FormationControls.vue'
import ShapeControls from '@/components/ui/ShapeControls.vue'

// --- CONFIGURATION ---
import { SPHERE_ITEMS, ORBIT_RADIUS, SPHERE_RADIUS, SPRITE_SIZE } from '@/composables/useConfiguration'
import { useAnimationLogic } from '@/composables/useAnimationLogic'
import { useHeartShape } from '@/composables/useHeartShape'

// --- STATE ---
const isDarkTheme = ref(true)
const selectedSphere = ref(null)
const showScreenshotUI = ref(false)

// Snow State
const showSnowControls = ref(false)
const snowEnabled = ref(false)
const snowSettings = ref({
  speed: 1,
  count: 1000,
  size: 0.2,
  color: '#FFFFFF'
})

// Light State
const showLightControls = ref(false)
const lightSettings = ref({
  ambientIntensity: 0.5,
  directionalIntensity: 3,
  pointIntensity: 1.5,
  pointColor: '#FFD700',
  bgColor: null // If null, inherits theme
})

// Formation & Shape State
const showFormationControls = ref(false)
const currentFormation = ref('circle')
const currentEffect = ref('none')
const showLabels = ref(true)
const isDancing = ref(false)
const formationWrapperRef = shallowRef(null) // Parent group for rotation
const showShapeControls = ref(false)
const currentShape = ref('sphere')

// VR Background State
const showVrBackground = ref(false)
const vrTextures = shallowRef([])
const currentVrTextureIndex = ref(0)
const bgTexturePaths = [
  '/pictures/Background/6bd19432-fff6-4dbc-b4ca-f6b00ae23b38.webp',
  '/pictures/Background/christmas-wallpapers.jpg',
  '/pictures/Background/snow.png'
]

const toggleVrMode = () => {
  if (!showVrBackground.value) {
    showVrBackground.value = true
  } else {
    currentVrTextureIndex.value = (currentVrTextureIndex.value + 1) % bgTexturePaths.length
    // Cycle through, if back to 0 maybe turn off? Or just cycle.
    // Let's make it: Off -> Tex1 -> Tex2 -> Tex3 -> Off
    if (currentVrTextureIndex.value === 0 && showVrBackground.value) {
       // If we cycled back to 0, check if user wants to turn off? 
       // User requirement: "đổi lần lượt". Let's just cycle textures.
       // Only close if user toggles a specific "Off" button? 
       // The previous request says "đổi lần lượt".
       // Let's implement: Click -> Toggle ON (Tex1). Click again -> Tex2. Click again -> Tex3. Click again -> OFF.
    }
  }
}

// Special Toggle: Off -> 1 -> 2 -> 3 -> Off
const handleVrToggle = () => {
  if (!showVrBackground.value) {
    showVrBackground.value = true
    currentVrTextureIndex.value = 0
  } else {
    const nextIndex = currentVrTextureIndex.value + 1
    if (nextIndex >= bgTexturePaths.length) {
      showVrBackground.value = false
      currentVrTextureIndex.value = 0
    } else {
      currentVrTextureIndex.value = nextIndex
    }
  }
}

// Watch Formation Change to Animate
import { watch } from 'vue'

// Dance Logic
const handleDanceTrigger = () => {
  if (isDancing.value) return // Prevent double click
  isDancing.value = true
  
  if (formationWrapperRef.value) {
    // Spin 2 times (720 deg) over 3 seconds then stop
    gsap.to(formationWrapperRef.value.rotation, {
      y: formationWrapperRef.value.rotation.y + Math.PI * 4,
      duration: 3,
      ease: 'power2.inOut',
      onComplete: () => {
        isDancing.value = false
      }
    })
  }
}

const groupRefs = shallowRef([])

// --- COMPOSABLES ---
const { calculatePosition, applyBaseFormation } = useAnimationLogic(currentFormation, isDancing, groupRefs, formationWrapperRef)
const { heartShape, heartExtrudeSettings } = useHeartShape()

// Watchers
watch(currentFormation, (newVal) => {
  applyBaseFormation(newVal)
})

watch(currentEffect, (newVal) => {
  // Clear Effects
  SPHERE_ITEMS.forEach((_, index) => {
      const targetGroup = groupRefs.value[index]
      if (!targetGroup) return
      const rawGroup = toRaw(targetGroup)
      gsap.killTweensOf(rawGroup.scale)
      gsap.killTweensOf(rawGroup.children) // Clear bloom
      
      // Reset Scale if it was blooming
      // But we need to know the base scale...
      // Simply re-apply base formation pos/scale to be safe
      applyBaseFormation(currentFormation.value)
  })
  
  if (newVal === 'bloom') {
      setTimeout(() => {
        SPHERE_ITEMS.forEach((item, index) => {
           const targetGroup = groupRefs.value[index]
           if (!targetGroup) return
           const rawGroup = toRaw(targetGroup)

           // Bloom: Additive Color + Slow Pulse
           // We can't easily change hex color to additive "brighter" version directly on MeshBasicMaterial without using color math.
           // Instead, let's use emissive or just scale pulse + opacity pulse on the GLOW mesh (MeshBasicMaterial)
           
           rawGroup.traverse((child) => {
             // 1. Mesh Glow (Additive Material)
             if (child.isMesh && child.material && child.material.blending === AdditiveBlending && !child.material.wireframe) {
                gsap.to(child.material, {
                  opacity: 0.8, // Make it very visible
                  duration: 2,
                  yoyo: true,
                  repeat: -1,
                  ease: "sine.inOut"
                })
             }
             
             // 2. Scale Pulse (Subtle)
             if (child.isMesh) {
                gsap.to(child.scale, {
                  x: 1.1, y: 1.1, z: 1.1,
                  duration: 2,
                  yoyo: true,
                  repeat: -1,
                  ease: "sine.inOut",
                  delay: index * 0.5 // Slower stagger
                })
             }
           })
        })
      }, 500)
  }
})

// Textures
const textureLoader = new TextureLoader()
const sphereTextures = shallowRef([])



const onSphereClick = (item, index) => {
  selectedSphere.value = item
  const targetGroup = groupRefs.value[index]
  
  if (targetGroup) {
    const rawGroup = toRaw(targetGroup)
    
    // 1. Scale Animation ("Boom" effect)
    gsap.to(rawGroup.scale, {
      x: 1.5,
      y: 1.5,
      z: 1.5,
      duration: 0.4,
      yoyo: true,
      repeat: 1,
      ease: 'elastic.out(1, 0.3)'
    })
    
    // 2. Bloom/Glow Effect (Intensity + Opacity)
    rawGroup.traverse((child) => {
      // Flash the light
      if (child.isPointLight) {
        gsap.to(child, {
          intensity: 15,
          duration: 0.2,
          yoyo: true,
          repeat: 1
        })
      }
      // Flash the mesh materials
      if (child.isMesh && child.material) {
        gsap.to(child.material, {
          opacity: 0.8,
          duration: 0.3,
          yoyo: true,
          repeat: 1
        })
      }
    })
  }
  
  // Trigger Screenshot UI if ID 1 is clicked
  if (item.id === 1) {
    setTimeout(() => {
      showScreenshotUI.value = true
      showSnowControls.value = false
      showLightControls.value = false
    }, 300)
  }

  // Trigger Snow Effect if ID 4 is clicked
  if (item.id === 4) {
    snowEnabled.value = true
    showSnowControls.value = true
    showScreenshotUI.value = false
    showLightControls.value = false
  }

  // Trigger Light Controls if ID 3 is clicked
  if (item.id === 3) {
    showLightControls.value = true
    showScreenshotUI.value = false
    showSnowControls.value = false
    showFormationControls.value = false
    showShapeControls.value = false
  }

  // Trigger Formation (ID 5 - Donut)
  if (item.id === 5) {
    showFormationControls.value = true
    showScreenshotUI.value = false
    showSnowControls.value = false
    showLightControls.value = false
    showShapeControls.value = false
  }

  // Trigger Shape (ID 2 - Koi Cat)
  if (item.id === 2) {
    showShapeControls.value = true
    showScreenshotUI.value = false
    showSnowControls.value = false
    showLightControls.value = false
    showFormationControls.value = false
  }
}

// --- LIFECYCLE ---
  onMounted(() => {
  SPHERE_ITEMS.forEach((item, index) => {
    textureLoader.load(item.image, (texture) => {
      sphereTextures.value[index] = texture
      triggerRef(sphereTextures)
    })
  })
  
  // Load Background Textures
  bgTexturePaths.forEach((path, index) => {
    textureLoader.load(path, (tex) => {
      vrTextures.value[index] = tex
      triggerRef(vrTextures)
    })
  })
})

// --- ANIMATION LOOP ---
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  // Tree Arc Effect: Rotate the whole formation gently
  // ARC Effect: Rotate the whole formation continuously
  // No continuous rotation loop needed for dance triggered by event
  // if (isDancing.value && formationWrapperRef.value) {
  //    formationWrapperRef.value.rotation.y += elapsed * 0.0002 
  // }
})


</script>

<template>
  <div class="scene-wrapper">
    <TresCanvas shadows alpha window-size preserve-drawing-buffer :dpr="[1, 2]" :clear-color="lightSettings.bgColor || (isDarkTheme ? '#0a0f1a' : '#87CEEB')">
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
      <TresAmbientLight :intensity="lightSettings.ambientIntensity" />
      <TresDirectionalLight :position="[5, 10, 5]" :intensity="lightSettings.directionalIntensity" cast-shadow />
      <TresPointLight :position="[0, 5, 5]" :intensity="lightSettings.pointIntensity" :color="lightSettings.pointColor" />
      
      <!-- Central Christmas Tree -->
      <TresGroup :position="[0, -2, 0]">
        <UniversalModel 
          Path="/models/xmas_tree_-_cartoonish__stylized.glb"
          :scale="[0.5, 0.5, 0.5]"
          :draco="true"
        />
        <!-- <UniversalModel 
          Path="/models/view.glb"
          :scale="[0.5, 0.5, 0.5]"
          :draco="true"
        /> -->
      </TresGroup>
      
      <!-- Snow Effect -->
      <Precipitation 
        v-if="snowEnabled"
        :speed="snowSettings.speed" 
        :count="snowSettings.count" 
        :size="snowSettings.size" 
        :area="[30, 30, 30]" 
        :color="snowSettings.color"
      />
      
      <!-- Formation Wrapper Group for global rotation -->
      <TresGroup ref="formationWrapperRef">
        
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
        
        <!-- Dynamic Geometry based on currentShape -->
        <TresMesh @click="onSphereClick(item, index)">
          <TresSphereGeometry v-if="currentShape === 'sphere'" :args="[SPHERE_RADIUS, 32, 32]" />
          
          <TresExtrudeGeometry
            v-else-if="currentShape === 'heart'"
            :args="[heartShape, heartExtrudeSettings]"
            :scale="[0.08, 0.08, 0.08]"
            :rotation="[Math.PI, 0, 0]"
            :center="true"
          />

          <TresIcosahedronGeometry v-else-if="currentShape === 'icosahedron'" :args="[SPHERE_RADIUS]" />
          
          <TresMeshBasicMaterial 
            :color="item.color" 
            :transparent="true" 
            :opacity="0.4"
            :blending="AdditiveBlending"
            :side="2"
          />
        </TresMesh>
        
        <!-- Outline Mesh - Apply specific rotations per shape if needed -->
        <TresMesh>
           <!-- For Sphere, Icosahedron: Rotation doesn't matter much. For Heart: Must match main mesh -->
           <TresSphereGeometry v-if="currentShape === 'sphere'" :args="[SPHERE_RADIUS, 32, 32]" />
           
           <TresExtrudeGeometry
            v-else-if="currentShape === 'heart'"
            :args="[heartShape, heartExtrudeSettings]"
            :scale="[0.08, 0.08, 0.08]"
            :rotation="[Math.PI, 0, 0]"
            :center="true"
           />

           <TresIcosahedronGeometry v-else-if="currentShape === 'icosahedron'" :args="[SPHERE_RADIUS]" />


          <TresMeshBasicMaterial 
            :color="item.color" 
            :transparent="true" 
            :opacity="0.1"
            :blending="AdditiveBlending"
            :side="2"
            :wireframe="true"
          />
        </TresMesh>
        
        <!-- Point Light - Tạo hình cầu phát sáng -->
        <TresPointLight :color="item.color" :intensity="3" :distance="6" :decay="2" />
        
        <!-- 3D HTML Label -->
        <Html 
          v-if="showLabels"
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
      
      </TresGroup>

      <!-- VR Background Sphere -->
      <TresMesh v-if="showVrBackground" :scale="[1, 1, 1]">
        <TresSphereGeometry :args="[100, 32, 32]" />
        <TresMeshBasicMaterial 
          :map="vrTextures[currentVrTextureIndex]" 
          :side="BackSide"
          :transparent="true" 
          :opacity="1"
        />
      </TresMesh>

    </TresCanvas>
    <!-- UI Overlay -->
    <div class="ui-overlay" v-show="!showScreenshotUI && !showSnowControls && !showLightControls && !showFormationControls && !showShapeControls">

      <transition name="fade">
        <div v-if="selectedSphere" class="selection-info">
          <h2 :style="{ color: selectedSphere.color }">{{ selectedSphere.letter }}</h2>
          <p>{{ selectedSphere.id }} / 8</p>
        </div>
      </transition>
    </div>

    <!-- Snow Controls -->
    <transition name="fade">
      <SnowControls
        v-if="showSnowControls"
        v-model:enabled="snowEnabled"
        :settings="snowSettings"
        @update:settings="newSettings => snowSettings = newSettings"
        @close="showSnowControls = false"
      />
    </transition>
    <!-- Light Controls -->
    <transition name="fade">
      <LightControls
        v-if="showLightControls"
        :settings="lightSettings"
        @update:settings="newSettings => lightSettings = newSettings"
        @close="showLightControls = false"
      />
    </transition>

    <!-- Formation Controls -->
    <transition name="fade">
      <FormationControls 
        v-if="showFormationControls" 
        :current-formation="currentFormation"
        :current-effect="currentEffect"
        :show-labels="showLabels"
        :is-dancing="isDancing"
        @update:formation="val => currentFormation = val"
        @update:effect="val => currentEffect = val"
        @update:labels="val => showLabels = val"
        @update:dancing="val => isDancing = val"
        @trigger-dance="handleDanceTrigger"
        @close="showFormationControls = false"
      />
    </transition>

     <!-- Shape Controls -->
    <transition name="fade">
      <ShapeControls 
        v-if="showShapeControls" 
        :current-shape="currentShape"
        @update:shape="val => currentShape = val"
        @close="showShapeControls = false"
      />
    </transition>

    <!-- Screenshot UI -->
    <transition name="fade-overlay">
      <Screenshot 
        v-if="showScreenshotUI" 
        @close="showScreenshotUI = false" 
      />
    </transition>
  </div>
</template>


