<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoaded = ref(false)
const iframeRef = ref<HTMLIFrameElement | null>(null)

function goBack() {
  router.push('/login')
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 300)
})
</script>

<template>
  <div class="project-wrapper">
    <!-- Back Button -->
    <button class="back-btn" @click="goBack" title="Quay lại">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
    </button>

    <!-- Loading Overlay -->
    <div class="loading-overlay" :class="{ 'hidden': isLoaded }">
      <div class="petal-loader">
        <div class="petal" v-for="i in 6" :key="i" :style="{ '--i': i }"></div>
      </div>
      <p>Đang tải Hoa đào...</p>
    </div>

    <!-- Project iframe -->
    <iframe
      ref="iframeRef"
      src="/projects/blossom/index.html"
      class="project-frame"
      :class="{ 'visible': isLoaded }"
      frameborder="0"
      allow="autoplay"
      @load="isLoaded = true"
      title="Blossom Animation 2026"
    ></iframe>
  </div>
</template>

<style scoped>
.project-wrapper {
  width: 100vw;
  height: 100vh;
  background: #ffaacc;
  position: relative;
  overflow: hidden;
}

/* --- BACK BUTTON --- */
.back-btn {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 9999;
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.25);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  backdrop-filter: blur(10px);
  transition: background 0.2s ease, transform 0.2s ease;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.45);
  transform: translateX(-2px);
}

/* --- LOADING OVERLAY --- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: #ffaacc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 100;
  transition: opacity 0.5s ease;
}

.loading-overlay.hidden {
  opacity: 0;
  pointer-events: none;
}

.loading-overlay p {
  color: white;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
}

/* Petal spinner */
.petal-loader {
  position: relative;
  width: 60px;
  height: 60px;
}

.petal {
  position: absolute;
  inset: 0;
  transform: rotate(calc(var(--i) * 60deg));
}

.petal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 10px;
  height: 22px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50% 50% 0 0;
  animation: petalPulse 1.2s ease-in-out calc(var(--i) * 0.2s) infinite alternate;
}

@keyframes petalPulse {
  0% { opacity: 0.3; transform: translateX(-50%) scaleY(0.8); }
  100% { opacity: 1; transform: translateX(-50%) scaleY(1.1); }
}

/* --- IFRAME --- */
.project-frame {
  width: 100%;
  height: 100%;
  border: none;
  opacity: 0;
  transition: opacity 0.6s ease;
}

.project-frame.visible {
  opacity: 1;
}
</style>
