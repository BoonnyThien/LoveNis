<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoaded = ref(false)

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
      <div class="heart-loader">
        <div class="heart-beat">❤️</div>
      </div>
      <p>Đang tải Dear Sun...</p>
    </div>

    <!-- Project iframe -->
    <iframe
      src="/projects/heart-of-love/index.html"
      class="project-frame"
      :class="{ 'visible': isLoaded }"
      frameborder="0"
      allow="autoplay"
      @load="isLoaded = true"
      title="Heart of Love"
    ></iframe>
  </div>
</template>

<style scoped>
.project-wrapper {
  width: 100vw;
  height: 100vh;
  background: #1a0a2e;
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
  background: rgba(255, 100, 150, 0.2);
  border: 1.5px solid rgba(255, 100, 150, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ff6b9d;
  backdrop-filter: blur(10px);
  transition: background 0.2s ease, transform 0.2s ease;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn:hover {
  background: rgba(255, 100, 150, 0.35);
  transform: translateX(-2px);
}

/* --- LOADING OVERLAY --- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: #1a0a2e;
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
  color: #ff6b9d;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
}

.heart-loader {
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-beat {
  font-size: 48px;
  animation: heartbeat 0.8s ease-in-out infinite alternate;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  100% { transform: scale(1.3); }
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
