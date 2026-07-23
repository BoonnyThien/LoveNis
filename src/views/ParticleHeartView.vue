<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ParticleHeart from '../components/ParticleHeart.vue'
import LoveAudioPlayer from '../components/LoveAudioPlayer.vue'

const router = useRouter()
const isVisible = ref(false)

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="view-wrapper" :class="{ 'visible': isVisible }">
    
    <!-- Background Animation -->
    <div class="animation-layer">
      <ParticleHeart />
    </div>
    
    <!-- Header with Meaning -->
    <header class="page-header">
      <h1>Particle Heart</h1>
      <p class="meaning-text">Trái tim bùng cháy - Tình yêu rực rỡ</p>
    </header>
    
    <!-- Audio Controls -->
    <div class="audio-controls">
      <LoveAudioPlayer src="/sounds/surprise.mp3" autoplay title="Tình yêu rực rỡ" />
    </div>
    
    <!-- Navigation back -->
    <button class="back-btn" @click="navigate('/')">
      ← Quay lại
    </button>
  </div>
</template>


<style scoped>
/* ====== LAYOUT ====== */
.view-wrapper {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  background: #000;
  color: #f1f5f9;
  font-family: 'Quicksand', sans-serif;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  overflow: hidden;
}

.view-wrapper.visible {
  opacity: 1;
  transform: translateY(0);
}

.animation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* ====== HEADER ====== */
.page-header {
  position: relative;
  z-index: 10;
  padding: 40px 20px 0;
  text-align: center;
  pointer-events: none; /* Let clicks pass through to 3D canvas if needed */
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #ff9f1c, #ff1744);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(255, 23, 68, 0.3);
}

.meaning-text {
  font-size: 1.2rem;
  color: #fff1b8;
  margin-top: 10px;
  font-weight: 500;
  text-shadow: 0 1px 5px rgba(0,0,0,0.8);
}

/* ====== CONTROLS ====== */
.audio-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10;
}

/* ====== BACK BUTTON ====== */
.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  color: #f1f5f9;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
  backdrop-filter: blur(5px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
