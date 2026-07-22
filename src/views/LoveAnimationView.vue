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
      <div class="love-loader">
        <span>I</span>
        <span>💜</span>
        <span>L</span>
        <span>O</span>
        <span>V</span>
        <span>E</span>
        <span>Y</span>
        <span>O</span>
        <span>U</span>
      </div>
      <p>Đang tải Love Animation...</p>
    </div>

    <!-- Project iframe -->
    <iframe
      src="/projects/love-animation/index.html"
      class="project-frame"
      :class="{ 'visible': isLoaded }"
      frameborder="0"
      allow="autoplay"
      @load="isLoaded = true"
      title="Love Animation"
    ></iframe>
  </div>
</template>

<style scoped>
.project-wrapper {
  width: 100vw;
  height: 100vh;
  background: #0f0020;
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
  background: rgba(192, 132, 252, 0.15);
  border: 1.5px solid rgba(192, 132, 252, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #c084fc;
  backdrop-filter: blur(10px);
  transition: background 0.2s ease, transform 0.2s ease;
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn:hover {
  background: rgba(192, 132, 252, 0.3);
  transform: translateX(-2px);
}

/* --- LOADING OVERLAY --- */
.loading-overlay {
  position: absolute;
  inset: 0;
  background: #0f0020;
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
  color: #c084fc;
  font-family: 'Quicksand', sans-serif;
  font-size: 16px;
  font-weight: 600;
}

.love-loader {
  display: flex;
  gap: 4px;
  font-family: 'Quicksand', sans-serif;
  font-size: 24px;
  font-weight: 700;
}

.love-loader span {
  color: #c084fc;
  animation: letterBounce 1s ease-in-out infinite alternate;
}

.love-loader span:nth-child(1) { animation-delay: 0s; }
.love-loader span:nth-child(2) { animation-delay: 0.1s; }
.love-loader span:nth-child(3) { animation-delay: 0.2s; }
.love-loader span:nth-child(4) { animation-delay: 0.3s; }
.love-loader span:nth-child(5) { animation-delay: 0.4s; }
.love-loader span:nth-child(6) { animation-delay: 0.5s; }
.love-loader span:nth-child(7) { animation-delay: 0.6s; }
.love-loader span:nth-child(8) { animation-delay: 0.7s; }
.love-loader span:nth-child(9) { animation-delay: 0.8s; }

@keyframes letterBounce {
  0% { transform: translateY(0); opacity: 0.5; }
  100% { transform: translateY(-10px); opacity: 1; }
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
