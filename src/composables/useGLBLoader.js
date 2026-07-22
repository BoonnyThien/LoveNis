// src/composables/useGLBLoader.js
// Lazy-load .glb từ R2 với DRACOLoader + progress tracking
// shallowRef BẮTBUỘC cho tất cả Three.js objects

import { shallowRef, ref, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// DRACO decoder path — dùng CDN để tránh bundle thêm 2MB
const DRACO_DECODER_URL = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'

export function useGLBLoader() {
  // Kết quả load (shallowRef để Three.js objects không bị Vue proxy)
  const model      = shallowRef(null)   // THREE.Group
  const mixer      = shallowRef(null)   // AnimationMixer (nếu có animation)
  const animations = shallowRef([])     // Array<AnimationClip>

  // State
  const isLoading   = ref(false)
  const progress    = ref(0)           // 0–100
  const error       = ref(null)
  const modelName   = ref('')

  // Singleton loaders — tạo 1 lần, tái sử dụng
  let _gltfLoader  = null
  let _dracoLoader = null
  let _clock       = null

  // ── Khởi tạo loaders ────────────────────────────────────────────────────────
  function _initLoaders() {
    if (_gltfLoader) return

    _dracoLoader = new DRACOLoader()
    _dracoLoader.setDecoderPath(DRACO_DECODER_URL)
    _dracoLoader.preload()   // tải decoder ngay, không block main thread

    _gltfLoader = new GLTFLoader()
    _gltfLoader.setDRACOLoader(_dracoLoader)

    _clock = new THREE.Clock()
  }

  // ── Load .glb từ URL (R2 public URL) ────────────────────────────────────────
  async function loadGLB(url, options = {}) {
    const { autoCenter = true, autoScale = true, targetSize = 3 } = options

    _initLoaders()
    isLoading.value = true
    progress.value  = 0
    error.value     = null
    modelName.value = url.split('/').pop()

    // Dispose model cũ nếu có
    _disposeModel()

    return new Promise((resolve, reject) => {
      _gltfLoader.load(
        url,

        // ── onLoad ────────────────────────────────────────────────────────────
        (gltf) => {
          const group = gltf.scene

          // Auto-center: đưa model về gốc tọa độ
          if (autoCenter) {
            const box    = new THREE.Box3().setFromObject(group)
            const center = box.getCenter(new THREE.Vector3())
            group.position.sub(center)
          }

          // Auto-scale: fit model vừa targetSize
          if (autoScale) {
            const box  = new THREE.Box3().setFromObject(group)
            const size = box.getSize(new THREE.Vector3())
            const max  = Math.max(size.x, size.y, size.z)
            if (max > 0) group.scale.setScalar(targetSize / max)
          }

          // Enable shadow & optimize materials
          group.traverse((obj) => {
            if (obj.isMesh) {
              obj.castShadow    = true
              obj.receiveShadow = true
              // Tránh over-bright với env map
              if (obj.material?.envMapIntensity !== undefined) {
                obj.material.envMapIntensity = 0.5
              }
            }
          })

          // Animation mixer
          if (gltf.animations?.length) {
            const m = new THREE.AnimationMixer(group)
            gltf.animations.forEach(clip => m.clipAction(clip).play())
            mixer.value      = m
            animations.value = gltf.animations
          }

          model.value     = group
          isLoading.value = false
          progress.value  = 100

          resolve({ model: group, mixer: mixer.value, animations: gltf.animations })
        },

        // ── onProgress ────────────────────────────────────────────────────────
        (event) => {
          if (event.lengthComputable) {
            progress.value = Math.round((event.loaded / event.total) * 100)
          } else {
            // Nếu server không trả Content-Length (R2 thường có)
            progress.value = Math.min(progress.value + 2, 90)
          }
        },

        // ── onError ───────────────────────────────────────────────────────────
        (err) => {
          console.error('❌ GLB load error:', err)
          error.value     = `Không tải được model: ${err.message || url}`
          isLoading.value = false
          reject(err)
        }
      )
    })
  }

  // ── Cập nhật animation mixer mỗi frame ──────────────────────────────────────
  // Gọi hàm này trong animation loop của scene cha
  function updateMixer() {
    if (mixer.value && _clock) {
      mixer.value.update(_clock.getDelta())
    }
  }

  // ── Dừng/Phát animation theo tên ────────────────────────────────────────────
  function playAnimation(name) {
    if (!mixer.value || !animations.value.length) return
    const clip   = animations.value.find(a => a.name === name) ?? animations.value[0]
    const action = mixer.value.clipAction(clip)
    action.reset().play()
  }

  function stopAnimation() {
    mixer.value?.stopAllAction()
  }

  // ── Dispose model + materials ────────────────────────────────────────────────
  function _disposeModel() {
    if (!model.value) return
    model.value.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose()
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose())
        } else {
          obj.material?.dispose()
        }
      }
    })
    mixer.value?.stopAllAction()
    mixer.value      = null
    model.value      = null
    animations.value = []
  }

  onUnmounted(() => {
    _disposeModel()
    _dracoLoader?.dispose()
  })

  return {
    model, mixer, animations,
    isLoading, progress, error, modelName,
    loadGLB, updateMixer, playAnimation, stopAnimation
  }
}
