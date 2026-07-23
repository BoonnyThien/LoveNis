<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const props = defineProps({
  particleCount: {
    type: Number,
    default: 15000
  },
  showControls: {
    type: Boolean,
    default: true
  }
})

const webglCanvas = ref<HTMLCanvasElement | null>(null)
let reqId: number

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let controls: OrbitControls
let material: THREE.ShaderMaterial
let geometry: THREE.BufferGeometry
let particleGroup: THREE.Group
let composer: EffectComposer

function initThree() {
  if (!webglCanvas.value) return

  const width = window.innerWidth
  const height = window.innerHeight

  renderer = new THREE.WebGLRenderer({
    canvas: webglCanvas.value,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#030308')

  scene = new THREE.Scene()
  
  camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100)
  camera.position.set(0, 0, 8)
  camera.lookAt(0, 0, 0)

  if (props.showControls) {
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.autoRotate = false
    controls.minDistance = 2
    controls.maxDistance = 20
  }

  // Minimal background stars
  const starsGeometry = new THREE.BufferGeometry()
  const starCount = 2000
  const starPos = new Float32Array(starCount * 3)
  for(let i = 0; i < starCount; i++) {
    const r = 10 + Math.random() * 40
    const theta = 2 * Math.PI * Math.random()
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i*3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta)
    starPos[i*3+2] = r * Math.cos(phi)
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.3 })
  scene.add(new THREE.Points(starsGeometry, starsMaterial))

  particleGroup = new THREE.Group()
  particleGroup.position.y = 0.5
  scene.add(particleGroup)

  // Setup Post-processing (Bloom) - Đã căn chỉnh lại cho hài hòa, bớt lóa
  const renderScene = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
  bloomPass.threshold = 0.15
  bloomPass.strength = 0.6
  bloomPass.radius = 0.3

  composer = new EffectComposer(renderer)
  composer.addPass(renderScene)
  composer.addPass(bloomPass)

  window.addEventListener('resize', onResize)
}

function buildParticles() {
  geometry = new THREE.BufferGeometry()
  const count = props.particleCount
  
  const positions = new Float32Array(count * 3)
  const colors    = new Float32Array(count * 3)
  const noises    = new Float32Array(count * 3)  // aNoise: 3 components, -1 to 1
  const delays    = new Float32Array(count)
  const speeds    = new Float32Array(count * 2)

  const colorPink  = new THREE.Color('#ff88cc')
  const colorWhite = new THREE.Color('#ffddee')
  const tempColor  = new THREE.Color()

  for (let i = 0; i < count; i++) {
    // 1. Công thức Parametric Trái Tim chuẩn (Thêm độ dày phân bố để hạt trải đều hơn)
    const t  = Math.random() * Math.PI * 2
    
    // Thêm hệ số độ dày (thickness) để dàn đều hạt thành dải volume, thay vì dính chặt vào 1 đường mảnh gây lóa
    const thickness = 0.75 + Math.random() * 0.5 
    
    const hx = 16 * Math.pow(Math.sin(t), 3) * 0.1 * thickness
    const hy = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 0.1 * thickness

    // 2. Nhiễu đa chiều phân bổ Z sâu hơn để hạt thành một khối 3D mềm mại
    const nx = (Math.random() - 0.5) * 0.25
    const ny = (Math.random() - 0.5) * 0.25
    const nz = (Math.random() - 0.5) * 0.8

    positions[i*3]     = hx + nx
    positions[i*3 + 1] = hy + ny
    positions[i*3 + 2] = nz

    // aNoise riêng để shader dùng làm nhiễu gốc (độc lập với position)
    noises[i*3]     = Math.random() * 2.0 - 1.0
    noises[i*3 + 1] = Math.random() * 2.0 - 1.0
    noises[i*3 + 2] = Math.random() * 2.0 - 1.0

    // Colors: hồng đậm → trắng hồng nhạt
    tempColor.lerpColors(colorPink, colorWhite, Math.random() * 0.5)
    colors[i*3]     = tempColor.r
    colors[i*3 + 1] = tempColor.g
    colors[i*3 + 2] = tempColor.b

    delays[i]       = Math.random() * -10.0
    speeds[i*2]     = (Math.random() * 2.0 - 1.0) * 0.8  // swirl direction & speed
    speeds[i*2 + 1] = Math.random() * 0.4 + 0.2           // life cycle speed
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color',    new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aNoise',   new THREE.BufferAttribute(noises, 3))
  geometry.setAttribute('aDelay',   new THREE.BufferAttribute(delays, 1))
  geometry.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds, 2))

  material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      #define PI 3.14159265358979

      uniform float uTime;
      attribute float aDelay;
      attribute vec2  aSpeed;
      attribute vec3  aNoise;
      varying vec3  vColor;
      varying float vLife;

      void main() {
        vColor = color;

        // ── LIFE CYCLE ──────────────────────────────────────────────
        float life = fract(uTime * aSpeed.y * 0.2 + aDelay);
        vLife = life;

        // ── GỐC ĐÁY (Chóp nhọn): nhiễu nhỏ để tránh tia laser ──────
        vec3 rootPos = vec3(0.0, -1.5, 0.0) + aNoise * 0.1;

        // ── CUBIC EASE OUT: vút nhanh khỏi đáy, chậm dần tiếp đích ──
        float ease = 1.0 - pow(1.0 - life, 3.0);

        // ── BAY TỪ GỐC ĐẾN ĐÍCH ─────────────────────────────────────
        vec3 finalPos = mix(rootPos, position, ease);

        // ── MA THUẬT XOÁY: góc → 0 khi ease → 1 ────────────────────
        // Khi hạt gần đích (ease≈1), angle≈0 → hình trái tim được giữ nguyên
        float angle = (1.0 - ease) * aSpeed.x * 20.0;
        float ca = cos(angle);
        float sa = sin(angle);
        finalPos.xz = mat2(ca, -sa, sa, ca) * finalPos.xz;

        // ── MVP ──────────────────────────────────────────────────────
        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // ── SIZE: 0 lúc sinh, to ở giữa, teo về 0 lúc chết ─────────
        float sizePulse = sin(life * PI);
        gl_PointSize = (50.0 / -mvPosition.z) * sizePulse * 1.5;
        gl_PointSize = clamp(gl_PointSize, 0.2, 6.0);
      }
    `,
    fragmentShader: `
      varying vec3  vColor;
      varying float vLife;
      void main() {
        // Hình tròn mềm mại
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;

        // Mờ viền, nhòe sinh/tử
        float shapeAlpha = smoothstep(0.5, 0.15, d);
        float lifeAlpha  = sin(vLife * 3.14159);

        // Glow: trắng ở tâm, hồng ở viền
        vec3 glowCol = mix(vec3(1.0, 0.9, 0.97), vColor, d * 2.0);

        // Giảm Alpha xuống 0.35 để kết hợp AdditiveBlending không bị lóa trắng xóa
        gl_FragColor = vec4(glowCol, shapeAlpha * lifeAlpha * 0.35);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true
  })

  const points = new THREE.Points(geometry, material)
  particleGroup.add(points)
}

const clock = new THREE.Clock()

function animate() {
  reqId = requestAnimationFrame(animate)
  const elapsed = clock.getElapsedTime()
  
  if (material) {
    material.uniforms.uTime.value = elapsed
  }

  particleGroup.rotation.y = elapsed * 0.2 // Xoay tổng thể cả cụm chậm rãi

  if (controls) controls.update()
  if (composer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}

function onResize() {
  if (!camera || !renderer) return
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  if (composer) {
    composer.setSize(width, height)
  }
}

onMounted(() => {
  initThree()
  buildParticles()
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(reqId)
  window.removeEventListener('resize', onResize)
  
  if (geometry) geometry.dispose()
  if (material) material.dispose()
  if (renderer) renderer.dispose()
  if (controls) controls.dispose()
})
</script>

<template>
  <canvas ref="webglCanvas" class="webgl-canvas"></canvas>
</template>

<style scoped>
.webgl-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  outline: none;
}
</style>
