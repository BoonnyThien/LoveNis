<template>
  <div class="glb-viewer" ref="containerRef">

    <!-- Canvas Three.js -->
    <canvas ref="canvasRef" class="glb-canvas" />

    <!-- Loading overlay với progress -->
    <Transition name="fade">
      <div v-if="isLoading" class="glb-loading">
        <div class="glb-progress-ring">
          <svg viewBox="0 0 64 64">
            <circle class="ring-bg"   cx="32" cy="32" r="28" />
            <circle class="ring-fill" cx="32" cy="32" r="28"
              :stroke-dashoffset="ringOffset" />
          </svg>
          <span class="ring-pct">{{ progress }}%</span>
        </div>
        <p class="glb-loading-name">{{ modelName }}</p>
        <p class="glb-loading-sub">Đang tải model 3D…</p>
      </div>
    </Transition>

    <!-- Error state -->
    <div v-if="error" class="glb-error">
      <span>⚠️</span>
      <p>{{ error }}</p>
      <button @click="retry">Thử lại</button>
    </div>

    <!-- Controls hint -->
    <div v-if="!isLoading && !error && model" class="glb-hint">
      🖱️ Drag để xoay • Scroll để zoom
    </div>

    <!-- Animation controls (nếu model có animations) -->
    <div v-if="animations.length > 0" class="glb-anim-bar">
      <button
        v-for="anim in animations"
        :key="anim.name"
        class="anim-btn"
        @click="playAnimation(anim.name)"
      >▶ {{ anim.name || 'Default' }}</button>
      <button class="anim-btn anim-stop" @click="stopAnimation">⏹</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed, shallowRef } from 'vue'
import * as THREE from 'three'
import { useGLBLoader } from '@/composables/useGLBLoader'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  src:        { type: String, required: true },  // R2 public URL của .glb
  autoRotate: { type: Boolean, default: true },
  background: { type: String, default: 'transparent' }
})

// ── Composable ─────────────────────────────────────────────────────────────────
const { model, animations, isLoading, progress, error, modelName,
        loadGLB, updateMixer, playAnimation, stopAnimation } = useGLBLoader()

// ── Three.js (shallowRef) ──────────────────────────────────────────────────────
const scene    = shallowRef(null)
const camera   = shallowRef(null)
const renderer = shallowRef(null)

// ── DOM refs ───────────────────────────────────────────────────────────────────
const containerRef = ref(null)
const canvasRef    = ref(null)

// ── Orbit state (tự implement nhẹ hơn OrbitControls full) ─────────────────────
let isDragging  = false
let lastX = 0, lastY = 0
let rotX  = 0.2, rotY = 0
let zoom  = 5
let animFrameId = null

// ── Progress ring ──────────────────────────────────────────────────────────────
const RING_CIRC  = 2 * Math.PI * 28  // circumference
const ringOffset = computed(() => RING_CIRC - (progress.value / 100) * RING_CIRC)

// ── Init Three.js ──────────────────────────────────────────────────────────────
function initScene(w, h) {
  const s = new THREE.Scene()
  if (props.background !== 'transparent') s.background = new THREE.Color(props.background)
  scene.value = s

  const c = new THREE.PerspectiveCamera(45, w / h, 0.01, 100)
  camera.value = c

  const r = new THREE.WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true })
  r.setSize(w, h)
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  r.shadowMap.enabled = true
  r.shadowMap.type = THREE.PCFSoftShadowMap
  r.toneMapping = THREE.ACESFilmicToneMapping
  r.toneMappingExposure = 1.2
  renderer.value = r

  // Lights
  s.add(new THREE.AmbientLight(0xffeeff, 1.5))
  const key = new THREE.DirectionalLight(0xffffff, 2)
  key.position.set(5, 8, 5)
  key.castShadow = true
  s.add(key)
  s.add(new THREE.HemisphereLight(0xff6b9d, 0x1a0d2e, 0.4))

  // Ground shadow catcher
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.ShadowMaterial({ opacity: 0.15 })
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -1.5
  ground.receiveShadow = true
  s.add(ground)

  startLoop()
}

// ── Animation loop ─────────────────────────────────────────────────────────────
function startLoop() {
  function tick() {
    animFrameId = requestAnimationFrame(tick)
    if (!renderer.value || !scene.value || !camera.value) return

    updateMixer()

    // Auto rotate
    if (props.autoRotate && !isDragging && model.value) {
      rotY += 0.005
    }

    // Camera orbit
    if (model.value) {
      const x = zoom * Math.sin(rotY) * Math.cos(rotX)
      const y = zoom * Math.sin(rotX)
      const z = zoom * Math.cos(rotY) * Math.cos(rotX)
      camera.value.position.set(x, y, z)
      camera.value.lookAt(0, 0, 0)
    }

    renderer.value.render(scene.value, camera.value)
  }
  tick()
}

// ── Load GLB ───────────────────────────────────────────────────────────────────
async function loadModel(url) {
  if (!scene.value || !url) return

  // Xóa model cũ khỏi scene
  if (model.value) {
    scene.value.remove(model.value)
  }

  try {
    const { model: group } = await loadGLB(url, { autoCenter: true, autoScale: true, targetSize: 3 })
    scene.value.add(group)
  } catch (_) { /* error đã được handle trong composable */ }
}

async function retry() {
  await loadModel(props.src)
}

// ── Mouse/Touch orbit controls ─────────────────────────────────────────────────
function onMouseDown(e)  { isDragging = true;  lastX = e.clientX; lastY = e.clientY }
function onMouseMove(e) {
  if (!isDragging) return
  rotY += (e.clientX - lastX) * 0.01
  rotX += (e.clientY - lastY) * 0.01
  rotX  = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, rotX))
  lastX = e.clientX; lastY = e.clientY
}
function onMouseUp()     { isDragging = false }
function onWheel(e)      { zoom = Math.max(1, Math.min(20, zoom + e.deltaY * 0.01)) }

function onTouchStart(e) { if (e.touches[0]) { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY } }
function onTouchMove(e)  { if (isDragging && e.touches[0]) onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }) }
function onTouchEnd()    { isDragging = false }

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  const { width, height } = containerRef.value.getBoundingClientRect()
  initScene(width, height)
  await loadModel(props.src)

  const ro = new ResizeObserver(([e]) => {
    const { width: w, height: h } = e.contentRect
    if (camera.value) { camera.value.aspect = w / h; camera.value.updateProjectionMatrix() }
    renderer.value?.setSize(w, h)
  })
  ro.observe(containerRef.value)
  onUnmounted(() => {
    ro.disconnect()
    if (animFrameId) cancelAnimationFrame(animFrameId)
    renderer.value?.dispose()
  })
})

watch(() => props.src, loadModel)
</script>

<style scoped>
.glb-viewer {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: 20px;
  background: radial-gradient(ellipse, #1a0d2e 0%, #060410 100%);
  overflow: hidden;
  cursor: grab;
}
.glb-viewer:active { cursor: grabbing; }
.glb-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ── Loading ─────────────────────────────────── */
.glb-loading {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 10px;
}
.glb-progress-ring {
  position: relative; width: 72px; height: 72px;
  display: flex; align-items: center; justify-content: center;
}
.glb-progress-ring svg {
  position: absolute; inset: 0;
  transform: rotate(-90deg); width: 100%; height: 100%;
}
.ring-bg   { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 4; }
.ring-fill {
  fill: none;
  stroke: url(#grad);
  stroke: #ff6b9d;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 175.9;
  transition: stroke-dashoffset 0.3s ease;
}
.ring-pct  { font-size: 14px; font-weight: 700; color: #ff6b9d; position: relative; z-index: 1; }
.glb-loading-name { margin: 0; font-size: 13px; color: rgba(255,255,255,0.7); max-width: 200px; text-align: center; word-break: break-all; }
.glb-loading-sub  { margin: 0; font-size: 11px; color: rgba(255,255,255,0.35); }

/* ── Error ───────────────────────────────────── */
.glb-error {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  color: rgba(255,255,255,0.6); text-align: center;
  padding: 24px;
}
.glb-error span { font-size: 36px; }
.glb-error p    { margin: 0; font-size: 13px; }
.glb-error button {
  padding: 8px 20px; border-radius: 20px;
  background: rgba(255,107,157,0.2);
  border: 1px solid rgba(255,107,157,0.4);
  color: #ff6b9d; cursor: pointer; font-size: 13px;
  transition: background 0.2s;
}
.glb-error button:hover { background: rgba(255,107,157,0.35); }

/* ── Hint ────────────────────────────────────── */
.glb-hint {
  position: absolute; bottom: 12px; left: 50%;
  transform: translateX(-50%);
  font-size: 10px; color: rgba(255,255,255,0.25);
  pointer-events: none; white-space: nowrap;
}

/* ── Animation bar ───────────────────────────── */
.glb-anim-bar {
  position: absolute; bottom: 36px; left: 50%;
  transform: translateX(-50%);
  display: flex; gap: 6px; z-index: 5;
}
.anim-btn {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.7);
  cursor: pointer; font-size: 11px;
  transition: background 0.2s;
}
.anim-btn:hover { background: rgba(255,107,157,0.25); color: #fff; }
.anim-stop { background: rgba(255,60,60,0.1); border-color: rgba(255,60,60,0.2); }

/* ── Transition ──────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
