<template>
  <div class="page-container">
    <div class="app-container">
      <canvas ref="canvasRef" class="webgl-canvas"></canvas>
      
      <!-- Start Overlay -->
      <transition name="fade">
        <div v-if="!hasStarted" class="start-overlay" @click="handleStart">
          <div class="start-content">
            <h1 class="title">LoveNis</h1>
            <p class="subtitle">Tap to Start</p>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import { useThreeScene } from '../components/ParticleHeart/useThreeScene';
import { useParticleSystem } from '../components/ParticleHeart/useParticleSystem';
import { useAnimation } from '../components/ParticleHeart/useAnimation';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const hasStarted = ref(false);

let cleanupFns: Array<() => void> = [];
let animationFrameId: number;

onMounted(() => {
  if (!canvasRef.value) return;

  // Initialize Scene
  const sceneContext = useThreeScene(canvasRef.value);
  cleanupFns.push(sceneContext.cleanup);

  // Initialize Particles
  const particleContext = useParticleSystem(sceneContext.scene, sceneContext.heartGeometry);
  cleanupFns.push(particleContext.cleanup);

  // Initialize Animation (GSAP + Howler)
  const animContext = useAnimation({
    heartMaterial: sceneContext.heartMesh.material as any,
    particleState: particleContext.state,
    bloomPass: sceneContext.bloomPass,
    resetParticles: particleContext.resetParticles
  });
  cleanupFns.push(animContext.cleanup);

  // Render Loop
  let lastTime = performance.now();
  
  const tick = (time: number) => {
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    if (hasStarted.value) {
      particleContext.update(deltaTime);
    }
    
    sceneContext.composer.render();
    animationFrameId = requestAnimationFrame(tick);
  };
  
  animationFrameId = requestAnimationFrame(tick);

  // Expose start function for UI
  (window as any)._startExperience = () => {
    hasStarted.value = true;
    animContext.start();
  };
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  cleanupFns.forEach(fn => fn());
});

const handleStart = () => {
  if ((window as any)._startExperience) {
    (window as any)._startExperience();
  }
};
</script>

<style scoped>
/* Page background (desktop) */
.page-container {
  width: 100vw;
  height: 100vh;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

/* 9:16 aspect ratio container for mobile feel on desktop */
.app-container {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: calc(100vh * (9 / 16));
  background-color: #000;
  overflow: hidden;
  box-shadow: 0 0 50px rgba(255, 23, 68, 0.2);
}

.webgl-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  outline: none;
}

/* Tap to start overlay */
.start-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  backdrop-filter: blur(5px);
}

.start-content {
  text-align: center;
  color: #fff;
}

.title {
  font-family: 'Inter', sans-serif;
  font-size: 3rem;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(45deg, #ff1744, #ff8a80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 2px;
}

.subtitle {
  font-family: 'Inter', sans-serif;
  font-size: 1.2rem;
  margin-top: 1rem;
  opacity: 0.8;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
