// src/composables/useCoverflow.js
// Three.js Coverflow logic — tách khỏi component để giữ <template> gọn
// QUAN TRỌNG: Tất cả Three.js objects dùng shallowRef để tránh Vue freeze

import { shallowRef, ref, computed, onUnmounted } from 'vue'
import * as THREE from 'three'

// ── Constants ──────────────────────────────────────────────────────────────────
const CARD_W      = 3.2
const CARD_H      = 2.0
const CARD_GAP    = 0.6           // khoảng cách giữa các card
const SPREAD      = CARD_W + CARD_GAP
const ROT_Y_SIDE  = Math.PI / 4  // 45° cho card bên cạnh
const Z_BACK      = -1.5         // card bên lùi về sau
const EASING      = 0.08         // tốc độ lerp (thấp = mượt hơn)

// ── State ──────────────────────────────────────────────────────────────────────
export function useCoverflow() {
  // Three.js core — shallowRef BẮTBUỘC
  const scene    = shallowRef(null)
  const camera   = shallowRef(null)
  const renderer = shallowRef(null)
  const cards    = shallowRef([])   // mảng { mesh, memory }
  const loader   = shallowRef(new THREE.TextureLoader())

  // State reactive
  const activeIndex   = ref(0)
  const targetIndex   = ref(0)
  const isDragging    = ref(false)
  const isReady       = ref(false)
  const loadedCount   = ref(0)
  const totalCount    = ref(0)

  let animFrameId  = null
  let dragStartX   = 0
  let currentLerpX = 0

  const activeMemory = computed(() => cards.value[activeIndex.value]?.memory ?? null)

  // ── Init Three.js Scene ────────────────────────────────────────────────────
  function init(canvas, width, height) {
    // Scene
    const s = new THREE.Scene()
    s.background = null
    scene.value = s

    // Camera
    const c = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    c.position.set(0, 0, 7)
    camera.value = c

    // Renderer
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    r.setSize(width, height)
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    r.shadowMap.enabled = false
    renderer.value = r

    // Ambient light
    s.add(new THREE.AmbientLight(0xffffff, 1.2))

    // Directional light từ trên
    const dir = new THREE.DirectionalLight(0xffc0e0, 0.6)
    dir.position.set(0, 4, 6)
    s.add(dir)

    isReady.value = true
  }

  // ── Load memories thành 3D cards ──────────────────────────────────────────
  function loadMemories(memories) {
    if (!scene.value) return

    // Xóa cards cũ
    cards.value.forEach(c => scene.value.remove(c.mesh))
    cards.value = []

    totalCount.value = memories.length
    loadedCount.value = 0

    memories.forEach((mem, idx) => {
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1)

      if (mem.type === 'image' || mem.thumbnail_url) {
        const url = mem.thumbnail_url || mem.media_url
        loader.value.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace
            mat.map = tex
            mat.needsUpdate = true
            loadedCount.value++
          },
          undefined,
          () => { loadedCount.value++ } // lỗi vẫn count
        )
      }

      // Material với màu placeholder
      const mat = new THREE.MeshStandardMaterial({
        color: mem.color_tag ? parseInt(mem.color_tag.replace('#', '0x')) : 0xff6b9d,
        side: THREE.FrontSide,
        transparent: true,
        roughness: 0.4,
        metalness: 0.1
      })

      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(idx * SPREAD, 0, 0)
      scene.value.add(mesh)

      // Reflection plane (giả mirror ở dưới)
      const refMat = mat.clone()
      refMat.opacity = 0.2
      const refMesh = new THREE.Mesh(geo, refMat)
      refMesh.position.set(0, -CARD_H - 0.1, 0)
      refMesh.scale.y = -1
      mesh.add(refMesh)

      cards.value.push({ mesh, memory: mem, refMesh })
    })
  }

  // ── Animation Loop ────────────────────────────────────────────────────────
  function startLoop() {
    if (animFrameId) return

    function tick() {
      animFrameId = requestAnimationFrame(tick)
      if (!renderer.value || !scene.value || !camera.value) return

      // Lerp targetIndex → currentLerpX
      currentLerpX += (targetIndex.value * -SPREAD - currentLerpX) * EASING

      // Cập nhật vị trí & rotation từng card
      cards.value.forEach(({ mesh }, i) => {
        const worldX = i * SPREAD + currentLerpX
        const norm   = worldX / SPREAD          // vị trí tương đối

        mesh.position.x  = worldX
        mesh.position.z  = Math.abs(norm) > 0.5 ? Z_BACK : Z_BACK * (1 - Math.abs(norm) * 2)

        // Rotation: card ở trung tâm thẳng đứng, card 2 bên xoay
        const rotTarget = norm > 0 ? -ROT_Y_SIDE : ROT_Y_SIDE
        mesh.rotation.y += (norm === 0 ? 0 : rotTarget - mesh.rotation.y) * 0.12

        // Scale: card active lớn hơn
        const scaleTarget = Math.abs(norm) < 0.5 ? 1.0 : 0.8
        mesh.scale.setScalar(mesh.scale.x + (scaleTarget - mesh.scale.x) * 0.1)

        // Opacity reflection
        if (mesh.children[0]) {
          mesh.children[0].material.opacity = Math.max(0, 0.2 - Math.abs(norm) * 0.15)
        }
      })

      // Cập nhật activeIndex theo card gần nhất
      const nearest = Math.round(-currentLerpX / SPREAD)
      const clamped = Math.max(0, Math.min(cards.value.length - 1, nearest))
      if (clamped !== activeIndex.value) activeIndex.value = clamped

      renderer.value.render(scene.value, camera.value)
    }
    tick()
  }

  // ── Navigate ──────────────────────────────────────────────────────────────
  function goTo(index) {
    targetIndex.value = Math.max(0, Math.min(cards.value.length - 1, index))
  }
  function goNext() { goTo(targetIndex.value + 1) }
  function goPrev() { goTo(targetIndex.value - 1) }

  // ── Drag / Touch ──────────────────────────────────────────────────────────
  function onPointerDown(e) {
    isDragging.value = true
    dragStartX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
  }
  function onPointerMove(e) {
    if (!isDragging.value) return
    const x    = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const diff = x - dragStartX
    if (Math.abs(diff) > 50) {
      diff < 0 ? goNext() : goPrev()
      dragStartX = x
    }
  }
  function onPointerUp() { isDragging.value = false }

  // ── Resize ────────────────────────────────────────────────────────────────
  function onResize(width, height) {
    if (!camera.value || !renderer.value) return
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  function dispose() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null }
    cards.value.forEach(({ mesh }) => {
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    renderer.value?.dispose()
    scene.value    = null
    camera.value   = null
    renderer.value = null
    cards.value    = []
  }

  onUnmounted(dispose)

  return {
    // State
    activeIndex, targetIndex, isDragging, isReady, loadedCount, totalCount,
    activeMemory,
    // Methods
    init, loadMemories, startLoop,
    goTo, goNext, goPrev,
    onPointerDown, onPointerMove, onPointerUp,
    onResize, dispose
  }
}
