<template>
  <TresGroup :position="position" :rotation="rotation" :scale="scale">
    <TresGroup :position="centerOffset">
      <Suspense>
        <primitive v-if="clonedScene" :object="clonedScene" />
      </Suspense>
    </TresGroup>
  </TresGroup>
</template>

<script setup>
import { ref, shallowRef, watch, onBeforeUnmount } from 'vue'
import { useGLTF, useAnimations } from '@tresjs/cientos'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

// --- Props ---
const props = defineProps({
  Path: { type: String, required: true },
  
  // Vị trí đặt trong game
  position: { type: Array, default: () => [0, 0, 0] },
  rotation: { type: Array, default: () => [0, 0, 0] },
  scale: { type: Array, default: () => [1, 1, 1] },
  // Nếu model bị lệch, bạn truyền giá trị ngược lại vào đây. VD: [-2, 0, 5]
  centerOffset: { type: Array, default: () => [0, 0, 0] },

  draco: { type: Boolean, default: false },
  animationName: { type: String, default: null }, // Tên animation cụ thể muốn chạy
  effect: { type: String, default: 'default' },
  color: { type: String, default: null }
})


// Refs
const clonedScene = shallowRef(null)
const currentActions = shallowRef(null)
const materialUpdated = ref(false) // 🔒 Safeguard: Ensure material only updates once

/**
 * Load model using useGLTF (with caching) and clone it
 */
const loadModel = async () => {
  try {
    // 1. Load model (cached automatically by useGLTF)
    const { scene: originalScene, animations } = await useGLTF(props.Path, {
      draco: props.draco
    })

    // 2. Clone the scene for this instance (important if using multiple instances)
    clonedScene.value = clone(originalScene)

    // 3. Update material ONCE
    if (!materialUpdated.value) {
      updateMaterial(clonedScene.value)
      materialUpdated.value = true
    }

    // 4. Setup animations if available
    if (animations && animations.length > 0) {
      try {
        const { actions } = useAnimations(animations, clonedScene.value)
        currentActions.value = actions

        // Auto-play animation logic
        let actionToPlay = null

        if (props.animationName && actions[props.animationName]) {
          actionToPlay = actions[props.animationName]
        } else {
          const firstKey = Object.keys(actions)[0]
          if (firstKey) {
            actionToPlay = actions[firstKey]
            console.log(`🎬 Auto-playing default animation: ${firstKey}`)
          }
        }

        if (actionToPlay) {
          actionToPlay.reset().fadeIn(0.5).play()
        }
      } catch (err) {
        console.warn("⚠️ Lỗi khởi tạo animation:", err)
      }
    }
  } catch (error) {
    console.error("❌ Error loading model:", error)
  }
}

// Load model on mount
loadModel()

// Cleanup on unmount
onBeforeUnmount(() => {
  // Stop all animations
  if (currentActions.value) {
    Object.values(currentActions.value).forEach(action => {
      if (action) action.stop()
    })
  }

  // Dispose cloned scene
  if (clonedScene.value) {
    clonedScene.value.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
})


/**
 * Hàm thay đổi vật liệu (Giữ nguyên logic của bạn)
 */
function updateMaterial(scene) {
  scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const oldMat = child.material
      // Nếu có prop color thì dùng, không thì lấy màu gốc
      const targetColor = props.color ? new THREE.Color(props.color) : oldMat.color

      let newMat = null
      
      // Giữ lại map cũ để không mất texture
      const materialParams = {
        color: targetColor,
        map: oldMat.map,
        normalMap: oldMat.normalMap,
        transparent: true
      }

      switch (props.effect) {
        case 'glass': 
          newMat = new THREE.MeshPhysicalMaterial({
            ...materialParams,
            metalness: 0.1, roughness: 0.05, transmission: 1.0, thickness: 1.5, opacity: 0.8
          })
          break;
        case 'mirror':
          newMat = new THREE.MeshStandardMaterial({
            ...materialParams,
            metalness: 1.0, roughness: 0.0, envMapIntensity: 1.5
          })
          break; 
        case 'custom':
          newMat = new THREE.MeshPhysicalMaterial({
            ...materialParams,
            metalness: 0.5, roughness: 0.2, clearcoat: 1.0
          })
          break;
        default:
          if (props.color) oldMat.color = targetColor
          return; 
      }

      if (newMat) {
        child.material = newMat
      }
    }
  })
}

// Watch đổi animation động
watch(() => props.animationName, (newVal) => {
  if (currentActions.value) {
    // Dừng cái cũ
    Object.values(currentActions.value).forEach(action => action.fadeOut(0.5))
    
    // Chạy cái mới nếu có tên
    if (newVal && currentActions.value[newVal]) {
      currentActions.value[newVal].reset().fadeIn(0.5).play()
    } else {
       // Nếu đổi sang tên rỗng, có thể chạy lại mặc định (tuỳ logic game của bạn)
       const firstKey = Object.keys(currentActions.value)[0]
       if(firstKey) currentActions.value[firstKey].reset().fadeIn(0.5).play()
    }
  }
})
</script>