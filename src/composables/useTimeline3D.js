// src/composables/useTimeline3D.js
// 3D Winding Timeline — camera bay dọc theo đường cong khi scroll
// shallowRef BẮTBUỘC cho tất cả Three.js objects

import { shallowRef, ref, computed, onUnmounted } from 'vue'
import * as THREE from 'three'

// ── Constants ──────────────────────────────────────────────────────────────────
const CARD_W      = 2.4
const CARD_H      = 1.6
const CURVE_RADIUS = 6      // bán kính đường cong
const VERTICAL_GAP = 4      // khoảng cách dọc giữa memories
const CAMERA_EASE  = 0.05   // lerp tốc độ (nhỏ = mượt)
const FLOAT_SPEED  = 0.4    // tốc độ float up/down nhẹ

export function useTimeline3D() {
  // ── Three.js (shallowRef) ──────────────────────────────────────────────────
  const scene    = shallowRef(null)
  const camera   = shallowRef(null)
  const renderer = shallowRef(null)
  const curve    = shallowRef(null)    // CatmullRomCurve3
  const cards    = shallowRef([])      // { mesh, memory, targetPos, labelMesh }
  const loader   = shallowRef(new THREE.TextureLoader())

  // ── State ──────────────────────────────────────────────────────────────────
  const activeIndex  = ref(0)
  const scrollT      = ref(0)    // 0..1 dọc theo đường cong
  const isReady      = ref(false)
  const totalCount   = ref(0)

  let animFrameId = null
  let targetScrollT = 0
  let clock = null

  const activeMemory = computed(() => cards.value[activeIndex.value]?.memory ?? null)
  const progressPct  = computed(() => Math.round(scrollT.value * 100))

  // ── Build curve points từ số lượng memories ────────────────────────────────
  function buildCurvePoints(count) {
    const pts = []
    for (let i = 0; i < count; i++) {
      const t     = i / Math.max(count - 1, 1)
      const angle = t * Math.PI * 3         // xoắn 1.5 vòng
      const x     = Math.sin(angle) * CURVE_RADIUS
      const y     = -i * VERTICAL_GAP       // đi xuống
      const z     = Math.cos(angle) * CURVE_RADIUS
      pts.push(new THREE.Vector3(x, y, z))
    }
    return pts
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init(canvas, width, height) {
    const s = new THREE.Scene()
    s.fog = new THREE.FogExp2(0x0d0818, 0.025)
    scene.value = s

    const c = new THREE.PerspectiveCamera(60, width / height, 0.1, 200)
    camera.value = c

    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    r.setSize(width, height)
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value = r

    // Lights
    s.add(new THREE.AmbientLight(0xffeeff, 0.8))
    const pt = new THREE.PointLight(0xff6b9d, 2, 30)
    pt.position.set(0, 4, 0)
    s.add(pt)

    // Star particles background
    _addStars(s)

    clock = new THREE.Clock()
    isReady.value = true
  }

  // ── Stars ──────────────────────────────────────────────────────────────────
  function _addStars(s) {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(600 * 3)
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 120
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({ color: 0xffd6e8, size: 0.15 })
    s.add(new THREE.Points(geo, mat))
  }

  // ── Load memories ──────────────────────────────────────────────────────────
  function loadMemories(memories) {
    if (!scene.value) return

    // Clear
    cards.value.forEach(c => scene.value.remove(c.group))
    cards.value = []

    if (!memories.length) return

    totalCount.value = memories.length

    // Build curve
    const pts = buildCurvePoints(memories.length)
    const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
    curve.value = c

    // Draw tube path
    const tubeGeo = new THREE.TubeGeometry(c, memories.length * 6, 0.04, 6, false)
    const tubeMat = new THREE.MeshBasicMaterial({
      color: 0xff6b9d, transparent: true, opacity: 0.25
    })
    scene.value.add(new THREE.Mesh(tubeGeo, tubeMat))

    // Tạo card cho mỗi memory
    memories.forEach((mem, idx) => {
      const group = new THREE.Group()
      group.position.copy(pts[idx])

      // Card plane
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H)
      const mat = new THREE.MeshStandardMaterial({
        color: mem.color_tag ? parseInt(mem.color_tag.replace('#', '0x')) : 0xff6b9d,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9
      })

      // Load texture nếu là ảnh
      if (mem.type === 'image' || mem.thumbnail_url) {
        loader.value.load(mem.thumbnail_url || mem.media_url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          mat.map = tex
          mat.color.set(0xffffff)
          mat.needsUpdate = true
        })
      }

      const mesh = new THREE.Mesh(geo, mat)
      group.add(mesh)

      // Card border glow
      const borderGeo = new THREE.EdgesGeometry(geo)
      const borderMat = new THREE.LineBasicMaterial({
        color: mem.color_tag || '#ff6b9d',
        transparent: true, opacity: 0.6
      })
      group.add(new THREE.LineSegments(borderGeo, borderMat))

      // Point light tại mỗi card (nhỏ)
      const glow = new THREE.PointLight(0xff6b9d, 0.5, 4)
      group.add(glow)

      scene.value.add(group)
      cards.value.push({ group, mesh, memory: mem, baseY: pts[idx].y })
    })

    // Đặt camera ở điểm đầu
    _positionCamera(0)
  }

  // ── Đặt camera theo t ──────────────────────────────────────────────────────
  function _positionCamera(t) {
    if (!curve.value || !camera.value) return
    const clampedT = Math.max(0, Math.min(1, t))

    const pos    = curve.value.getPoint(clampedT)
    const ahead  = curve.value.getPoint(Math.min(1, clampedT + 0.01))

    // Camera lùi ra ngoài curve một chút
    const dir = new THREE.Vector3().subVectors(pos, ahead).normalize()
    camera.value.position.copy(pos).addScaledVector(dir, -3).add(new THREE.Vector3(0, 1.5, 0))
    camera.value.lookAt(pos.x, pos.y, pos.z)

    // Cập nhật activeIndex
    const nearest = Math.round(clampedT * (cards.value.length - 1))
    activeIndex.value = Math.max(0, Math.min(cards.value.length - 1, nearest))
  }

  // ── Animation loop ─────────────────────────────────────────────────────────
  function startLoop() {
    if (animFrameId) return

    function tick() {
      animFrameId = requestAnimationFrame(tick)
      if (!renderer.value || !scene.value || !camera.value) return

      const elapsed = clock?.getElapsedTime() ?? 0

      // Lerp scrollT → targetScrollT
      scrollT.value += (targetScrollT - scrollT.value) * CAMERA_EASE
      _positionCamera(scrollT.value)

      // Float animation cho cards
      cards.value.forEach(({ group, baseY }, i) => {
        group.position.y = baseY + Math.sin(elapsed * FLOAT_SPEED + i * 0.8) * 0.12

        // Fade opacity theo khoảng cách với active
        const dist = Math.abs(i - activeIndex.value)
        if (group.children[0]?.material) {
          group.children[0].material.opacity = dist === 0 ? 1 : Math.max(0.3, 1 - dist * 0.25)
        }
      })

      renderer.value.render(scene.value, camera.value)
    }
    tick()
  }

  // ── Scroll control ─────────────────────────────────────────────────────────
  function scrollTo(index) {
    if (!cards.value.length) return
    const i = Math.max(0, Math.min(cards.value.length - 1, index))
    targetScrollT = i / Math.max(cards.value.length - 1, 1)
  }

  function scrollNext() { scrollTo(activeIndex.value + 1) }
  function scrollPrev() { scrollTo(activeIndex.value - 1) }

  function onWheel(e) {
    e.deltaY > 0 ? scrollNext() : scrollPrev()
  }

  // ── Resize ─────────────────────────────────────────────────────────────────
  function onResize(w, h) {
    if (!camera.value || !renderer.value) return
    camera.value.aspect = w / h
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(w, h)
  }

  // ── Dispose ────────────────────────────────────────────────────────────────
  function dispose() {
    if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null }
    cards.value.forEach(({ group }) => {
      group.traverse(obj => {
        obj.geometry?.dispose()
        obj.material?.dispose()
      })
    })
    renderer.value?.dispose()
    scene.value = camera.value = renderer.value = null
    cards.value = []
  }

  onUnmounted(dispose)

  return {
    activeIndex, scrollT, isReady, totalCount, activeMemory, progressPct,
    init, loadMemories, startLoop,
    scrollTo, scrollNext, scrollPrev,
    onWheel, onResize, dispose
  }
}
