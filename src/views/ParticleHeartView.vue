<template>
  <div class="particle-heart-container">
    <canvas 
      ref="canvasRef"
      class="particle-heart-canvas"
      :style="{ 
        width: `${viewport.width}px`,
        height: `${viewport.height}px`
      }"
    />
    
    <!-- Audio Controls (Optional UI) -->
    <div v-if="showControls" class="audio-controls">
      <button @click="toggleAudio" class="audio-btn">
        {{ isAudioPlaying ? '🔊 Mute' : '🔇 Play' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';
import { physics } from 'popmotion';
import { Howl } from 'howler';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  acceleration: THREE.Vector3;
  age: number;
  lifetime: number;
  size: number;
  color: THREE.Color;
  alpha: number;
  isActive: boolean;
}

interface ParticleSystemState {
  emissionRate: number;
  velocityMultiplier: number;
  gravity: number;
  airResistance: number;
}

interface ViewportSettings {
  width: number;
  height: number;
  aspectRatio: number;
  pixelRatio: number;
}

// ============================================
// REACTIVE STATE
// ============================================

const canvasRef = ref<HTMLCanvasElement>();
const viewport = ref<ViewportSettings>({
  width: 576,
  height: 1024,
  aspectRatio: 576 / 1024, // 9:16
  pixelRatio: 1
});

const showControls = ref(false);
const isAudioPlaying = ref(false);

// Three.js objects
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let bloomPass: UnrealBloomPass;

// Heart & Particles
let heartMesh: THREE.Points;
let particlesGeometry: THREE.BufferGeometry;
let particlesMaterial: THREE.PointsMaterial;
let particleSystem: THREE.Points;
let particlePool: Particle[] = [];

// State
const particleSystemState = ref<ParticleSystemState>({
  emissionRate: 0,
  velocityMultiplier: 0.2,
  gravity: 0,
  airResistance: 0.98
});

// Animation
let timeline: gsap.core.Timeline;
let isAnimating = false;
let lastTime = 0;
let deltaTime = 0;

// Audio
let audioTrack: Howl;

// Physics simulation function references
let particlePhysicsSimulation: ReturnType<typeof physics> | null = null;

// ============================================
// SETUP & INITIALIZATION
// ============================================

function setupViewport() {
  const windowAspect = window.innerWidth / window.innerHeight;
  const targetAspect = 576 / 1024; // 0.5625
  
  let displayWidth: number;
  let displayHeight: number;
  
  if (windowAspect > targetAspect) {
    displayHeight = Math.min(window.innerHeight, 1024);
    displayWidth = displayHeight * targetAspect;
  } else {
    displayWidth = Math.min(window.innerWidth, 576);
    displayHeight = displayWidth / targetAspect;
  }
  
  viewport.value = {
    width: displayWidth,
    height: displayHeight,
    aspectRatio: targetAspect,
    pixelRatio: window.devicePixelRatio || 1
  };
}

function setupThreeJs() {
  if (!canvasRef.value) return;
  
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xFFFFFF);
  scene.fog = null;
  
  // Camera (Orthographic for 2D heart projection)
  const aspect = viewport.value.width / viewport.value.height;
  camera = new THREE.OrthographicCamera(
    -viewport.value.width / 2,
    viewport.value.width / 2,
    viewport.value.height / 2,
    -viewport.value.height / 2,
    0.1,
    1000
  );
  camera.position.z = 100;
  
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: false,
    precision: 'highp'
  });
  renderer.setSize(viewport.value.width, viewport.value.height);
  renderer.setPixelRatio(viewport.value.pixelRatio);
  
  // Post-Processing (EffectComposer + UnrealBloomPass)
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(viewport.value.width, viewport.value.height),
    0.15,  // threshold (only bright particles glow)
    2.5,   // strength (glow intensity)
    1.0    // radius (glow spread)
  );
  composer.addPass(bloomPass);
  
  // Lighting (Minimal - particles provide glow)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);
}

function createHeartGeometry() {
  // Parametric heart equation
  const points: THREE.Vector3[] = [];
  const vertexCount = 2000;
  
  for (let i = 0; i < vertexCount; i++) {
    const u = (i / vertexCount) * Math.PI * 2;
    
    for (let j = 0; j < 10; j++) {
      const v = (j / 10) * 1.5;
      
      // Heart parametric equation
      const x = 16 * Math.sin(u) ** 3;
      const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
      const z = 0;
      
      // Scale to fit viewport
      const scale = 40;
      points.push(new THREE.Vector3(x * v * scale / 20, y * v * scale / 13, z));
    }
  }
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return geometry;
}

function setupHeartMesh() {
  const heartGeometry = createHeartGeometry();
  
  const heartMaterial = new THREE.PointsMaterial({
    color: 0xFF1744,
    size: 1.5,
    sizeAttenuation: true,
    emissive: 0xFF1744,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true
  });
  
  heartMesh = new THREE.Points(heartGeometry, heartMaterial);
  heartMesh.position.set(0, 0, 0);
  scene.add(heartMesh);
}

function setupParticleSystem() {
  // Create particle pool (10,000 particles)
  const particleCount = 10000;
  particlePool = [];
  
  for (let i = 0; i < particleCount; i++) {
    particlePool.push({
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(0, 0, 0),
      acceleration: new THREE.Vector3(0, 0, 0),
      age: 0,
      lifetime: 6,
      size: 0.1,
      color: new THREE.Color(0xFF1744),
      alpha: 1,
      isActive: false
    });
  }
  
  // Create geometry from pooled particles
  particlesGeometry = new THREE.BufferGeometry();
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 0.09;
    colors[i * 3 + 2] = 0.26;
    
    sizes[i] = 0.1;
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    vertexColors: true,
    sizeAttenuation: true,
    emissive: 0xFF1744,
    emissiveIntensity: 1.0,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true
  });
  
  particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particleSystem);
}

// ============================================
// PARTICLE EMISSION & PHYSICS
// ============================================

function emitParticles(count: number) {
  const heartGeom = heartMesh.geometry as THREE.BufferGeometry;
  const heartPositions = heartGeom.getAttribute('position').array as Float32Array;
  
  let emitted = 0;
  for (let i = 0; i < particlePool.length && emitted < count; i++) {
    const particle = particlePool[i];
    
    if (!particle.isActive) {
      // Random spawn from heart surface
      const randomVertexIndex = Math.floor(Math.random() * (heartPositions.length / 3)) * 3;
      
      particle.position.set(
        heartPositions[randomVertexIndex],
        heartPositions[randomVertexIndex + 1],
        heartPositions[randomVertexIndex + 2]
      );
      
      // Random radial velocity (outward from center)
      const angle = Math.random() * Math.PI * 2;
      const speed = particleSystemState.value.velocityMultiplier * (0.5 + Math.random() * 1.5);
      
      particle.velocity.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        0
      );
      
      particle.age = 0;
      particle.lifetime = 5 + Math.random() * 3; // 5-8 seconds
      particle.alpha = 1;
      particle.isActive = true;
      particle.acceleration.set(0, particleSystemState.value.gravity, 0);
      
      emitted++;
    }
  }
}

function updateParticles(deltaTime: number) {
  const positions = particlesGeometry.getAttribute('position').array as Float32Array;
  let particleIndex = 0;
  
  particlePool.forEach((particle, i) => {
    if (particle.isActive) {
      // Update physics
      particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime / 1000));
      particle.velocity.multiplyScalar(particleSystemState.value.airResistance);
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime / 1000));
      
      // Update age & lifetime
      particle.age += deltaTime / 1000;
      
      // Alpha decay (linear fade)
      particle.alpha = Math.max(0, 1 - (particle.age / particle.lifetime));
      
      // Deactivate if lifetime exceeded
      if (particle.age >= particle.lifetime) {
        particle.isActive = false;
        particle.alpha = 0;
      }
      
      // Update geometry
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
    }
  });
  
  particlesGeometry.getAttribute('position').needsUpdate = true;
}

// ============================================
// GSAP TIMELINE (Master Animation Controller)
// ============================================

function createTimeline() {
  timeline = gsap.timeline({ repeat: -1, paused: true });
  
  // -------- SEQUENCE 1: HEART FORMATION (0-2s) --------
  timeline.to(heartMesh.material, {
    opacity: 1,
    duration: 0.5,
    ease: 'power2.inOut'
  }, 0);
  
  timeline.to(particleSystemState.value, {
    emissionRate: 0,
    duration: 2,
    ease: 'none'
  }, 0);
  
  // -------- SEQUENCE 2: PARTICLE SPAWN (2-5s) --------
  timeline.to(particleSystemState.value, {
    emissionRate: 3000,
    velocityMultiplier: 0.2,
    duration: 3,
    ease: 'power1.inOut'
  }, 2);
  
  timeline.to(bloomPass, {
    strength: 1.5,
    duration: 3,
    ease: 'power1.inOut'
  }, 2);
  
  // -------- SEQUENCE 3: BURST (5-10s) --------
  timeline.to(heartMesh.material, {
    opacity: 0,
    duration: 2,
    ease: 'power2.out'
  }, 5);
  
  timeline.to(particleSystemState.value, {
    velocityMultiplier: 2.0,
    gravity: -0.1,
    duration: 5,
    ease: 'power2.in',
    onUpdate: () => {
      // Emit particles during burst
      const emitCount = Math.floor(particleSystemState.value.emissionRate * 0.016); // 60fps
      emitParticles(Math.max(1, emitCount));
    }
  }, 5);
  
  timeline.to(bloomPass, {
    strength: 2.5,
    duration: 5,
    ease: 'power2.in'
  }, 5);
  
  // -------- SEQUENCE 4: PARTICLE CLOUD (10-15s) --------
  timeline.to(particleSystemState.value, {
    emissionRate: 0,
    gravity: -0.1,
    duration: 5,
    ease: 'none'
  }, 10);
  
  timeline.to(bloomPass, {
    strength: 2.0,
    duration: 5,
    ease: 'none'
  }, 10);
  
  // -------- SEQUENCE 5: LOOP RESET (15-21.08s) --------
  timeline.call(() => {
    // Clear particles for loop
    particlePool.forEach(p => (p.isActive = false));
  }, [], 15);
  
  timeline.to(bloomPass, {
    strength: 0.5,
    duration: 2,
    ease: 'power2.out'
  }, 15);
  
  timeline.to(heartMesh.material, {
    opacity: 0,
    duration: 1,
    ease: 'power2.out'
  }, 15);
  
  return timeline;
}

// ============================================
// AUDIO
// ============================================

function setupAudio() {
  audioTrack = new Howl({
    src: ['/audio/background-music.mp3'],
    format: 'mp3',
    volume: 0.4,
    loop: true,
    autoplay: false,
    html5: true
  });
}

function toggleAudio() {
  if (isAudioPlaying.value) {
    audioTrack.pause();
  } else {
    audioTrack.play();
  }
  isAudioPlaying.value = !isAudioPlaying.value;
}

// ============================================
// RENDER LOOP
// ============================================

function animate(time: number) {
  if (lastTime === 0) lastTime = time;
  deltaTime = Math.min(time - lastTime, 33); // Cap at 33ms for stability
  lastTime = time;
  
  // Update particles
  updateParticles(deltaTime);
  
  // Emit based on timeline state
  if (isAnimating && particleSystemState.value.emissionRate > 0) {
    const emitCount = (particleSystemState.value.emissionRate / 60); // Distribute over frames
    emitParticles(Math.ceil(emitCount));
  }
  
  // Render
  composer.render();
  
  requestAnimationFrame(animate);
}

// ============================================
// LIFECYCLE
// ============================================

onMounted(() => {
  setupViewport();
  setupThreeJs();
  setupHeartMesh();
  setupParticleSystem();
  setupAudio();
  
  timeline = createTimeline();
  timeline.play();
  isAnimating = true;
  
  requestAnimationFrame(animate);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    setupViewport();
    if (renderer) {
      renderer.setSize(viewport.value.width, viewport.value.height);
      composer.setSize(viewport.value.width, viewport.value.height);
    }
  });
});

onUnmounted(() => {
  if (timeline) timeline.kill();
  if (renderer) renderer.dispose();
  if (audioTrack) audioTrack.unload();
  isAnimating = false;
});
</script>

<style scoped lang="scss">
.particle-heart-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  background: #ffffff;
  overflow: hidden;
  position: relative;
  
  .particle-heart-canvas {
    display: block;
    background: #ffffff;
    image-rendering: crisp-edges;
  }
  
  .audio-controls {
    position: absolute;
    bottom: 30px;
    right: 30px;
    z-index: 100;
    
    .audio-btn {
      padding: 10px 20px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.7);
        transform: scale(1.05);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// Mobile responsive
@media (max-width: 768px) {
  .particle-heart-container {
    .audio-controls {
      bottom: 20px;
      right: 20px;
      
      .audio-btn {
        padding: 8px 16px;
        font-size: 12px;
      }
    }
  }
}
</style>
