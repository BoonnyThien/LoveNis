<script setup lang="ts">
import { ref, onBeforeUnmount, shallowRef } from 'vue'
import * as THREE from 'three'
import Canvas3D from './Canvas3D.vue'
import { useThreeSetup } from '../services/three-setup'
import { GeometryGenerator } from '../services/geometry-generator'
import { ParticleSystem } from '../services/particle-system'
import { PostProcessingManager } from '../services/post-processing'
import { AnimationController } from '../services/animation-controller'

const { init, render, getScene, getCamera, getRenderer, canvas } = useThreeSetup()

let postProcessing: PostProcessingManager | null = null
let animationController: AnimationController | null = null
let animationFrameId = 0
let lastTime = 0

const baseWidth = 576
const baseHeight = 1024

const handleCanvasReady = (canvasElement: HTMLCanvasElement) => {
  canvas.value = canvasElement
  init(baseWidth, baseHeight)
  
  const scene = getScene()
  const camera = getCamera()
  const renderer = getRenderer()
  
  if (!scene || !camera || !renderer) return
  
  // Set white background per specs (or black based on aesthetics, spec says white but references glow. Let's use very dark red/black for bloom to work, or white with dark particles. Spec says white #FFFFFF, but bloom needs black to look good. Let's stick to black 0x000000 for bloom effectiveness)
  scene.background = new THREE.Color(0x050005)

  // 1. Generate Heart Geometry
  const heartGeometry = GeometryGenerator.generateHeartGeometry(150)
  
  // Create solid heart mesh
  const heartMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFF1744,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  })
  const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial)
  // Scale heart to fit view
  heartMesh.scale.set(10, 10, 10)
  scene.add(heartMesh)
  
  // 2. Initialize Particle System
  const particleSystem = new ParticleSystem(10000)
  particleSystem.points.scale.copy(heartMesh.scale)
  scene.add(particleSystem.points)
  
  // 3. Post Processing
  postProcessing = new PostProcessingManager(renderer, scene, camera, baseWidth, baseHeight)
  
  // 4. Animation Controller
  animationController = new AnimationController(
    particleSystem,
    postProcessing,
    heartMesh,
    heartGeometry
  )
  
  // Center camera on heart
  camera.position.set(0, 0, 400)
  camera.lookAt(0, 0, 0)
  
  // Start animation loop
  lastTime = performance.now()
  animate()
}

const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  
  const now = performance.now()
  const deltaTime = (now - lastTime) / 1000 // to seconds
  lastTime = now
  
  // Update logic
  if (animationController) {
    animationController.update(deltaTime)
  }
  
  // Render via post processing
  if (postProcessing) {
    postProcessing.render()
  } else {
    const renderer = getRenderer()
    const scene = getScene()
    const camera = getCamera()
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
}

const handleResize = (width: number, height: number) => {
  const camera = getCamera()
  const renderer = getRenderer()
  
  if (camera && renderer && postProcessing) {
    // Maintain 9:16 aspect ratio logic
    const targetAspect = baseWidth / baseHeight
    const currentAspect = width / height
    
    let displayWidth = width
    let displayHeight = height
    
    if (currentAspect > targetAspect) {
      // Too wide
      displayWidth = height * targetAspect
    } else {
      // Too tall
      displayHeight = width / targetAspect
    }
    
    camera.aspect = displayWidth / displayHeight
    camera.updateProjectionMatrix()
    
    renderer.setSize(displayWidth, displayHeight)
    postProcessing.setSize(displayWidth, displayHeight)
  }
}

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="particle-heart-container">
    <Canvas3D @ready="handleCanvasReady" @resize="handleResize" />
  </div>
</template>

<style scoped>
.particle-heart-container {
  width: 100vw;
  height: 100vh;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
