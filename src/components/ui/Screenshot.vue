<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['close'])

const isFlashing = ref(false)

const takeScreenshot = async () => {
  isFlashing.value = true
  
  // Find the TresJS canvas
  const canvas = document.querySelector('canvas')
  
  if (canvas) {
    try {
      // Capture the image
      const dataUrl = canvas.toDataURL('image/png')
      
      // Create download link
      const link = document.createElement('a')
      link.download = `screenshot-${new Date().toISOString()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error('Screenshot failed:', e)
    }
  }

  setTimeout(() => {
    isFlashing.value = false
  }, 150)
}
</script>

<template>
  <div class="screenshot-overlay">
    <!-- Camera Flash Effect -->
    <div class="flash" :class="{ active: isFlashing }"></div>
    
    <!-- Viewfinder UI -->
    <div class="camera-interface">
      <div class="top-bar">
        <div class="mode-pill">PHOTO</div>
        <div class="settings-icon">HD</div>
      </div>
      
      <div class="crosshair"></div>
      
      <div class="corners">
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
      </div>
      
      <div class="bottom-controls">
        <div class="gallery-preview"></div>
        
        <button class="shutter-btn" @click="takeScreenshot">
          <div class="shutter-inner"></div>
        </button>
        
        <button class="close-btn" @click="$emit('close')">
          <span class="close-icon">✕</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.screenshot-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  user-select: none;
}

/* Flash Effect */
.flash {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  opacity: 0;
  pointer-events: none;
  z-index: 1002;
  transition: opacity 0.1s ease-out;
}

.flash.active {
  opacity: 1;
}

.camera-interface {
  width: 100%;
  height: 100%;
  position: relative;
  box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}

/* Pseudo-letterboxing for cinematic feel */
.camera-interface::before,
.camera-interface::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0,0,0,0.8);
  z-index: 0;
}
.camera-interface::before { top: 0; }
.camera-interface::after { bottom: 0; }

.top-bar {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.mode-pill {
  background: rgba(255, 235, 59, 0.9);
  color: #000;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.settings-icon {
  position: absolute;
  right: 10px;
  color: white;
  font-weight: bold;
  border: 2px solid white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

/* Crosshair center */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}
.crosshair::before, .crosshair::after {
  content: '';
  position: absolute;
  background: rgba(255,255,255,0.5);
}
.crosshair::before { top: 9px; left: 0; width: 20px; height: 2px; }
.crosshair::after { left: 9px; top: 0; height: 20px; width: 2px; }

/* Corners */
.corners {
  position: absolute;
  top: 80px;
  bottom: 120px;
  left: 40px;
  right: 40px;
  pointer-events: none;
  z-index: 1;
}

.corner {
  position: absolute;
  width: 40px;
  height: 40px;
  border-color: rgba(255,255,255,0.8);
  border-style: solid;
  border-width: 0;
}

.tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
.tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
.bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
.br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }

.bottom-controls {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  margin-bottom: 20px;
}

.gallery-preview {
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.2);
  border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.5);
}

.shutter-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 4px solid white;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.2s;
}

.shutter-btn:active {
  transform: scale(0.9);
}

.shutter-inner {
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 50%;
  transition: background 0.2s;
}

.shutter-btn:active .shutter-inner {
  background: #ffeb3b;
}

.close-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.4);
  border: none;
  color: white;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  backdrop-filter: blur(5px);
  transition: background 0.3s;
}
.close-btn:hover {
  background: rgba(255, 0, 0, 0.7);
}
</style>