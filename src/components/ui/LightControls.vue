<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  settings: {
    ambientIntensity: number
    directionalIntensity: number
    pointIntensity: number
    pointColor: string
    bgColor: string // Hex color
  }
}>()

const emit = defineEmits(['update:settings', 'close'])

const localSettings = ref({ ...props.settings })
const isExpanded = ref(true)

const PRESETS = [
  { name: 'Bình Minh', amb: 0.6, dir: 2.5, pt: 2.0, col: '#FFD700', bg: '#FAF0E6' }, // Tông trắng ngà
  { name: 'Chạng Vạng', amb: 1.2, dir: 8.0, pt: 5.0, col: '#FF8C00', bg: '#FAB766' }, // Tông cam ngả vàng
  { name: 'Hoàng Hôn', amb: 0.9, dir: 4.0, pt: 3.0, col: '#FF4081', bg: '#2B1B17' } // Tông đen nâu
]

const applyPreset = (p: typeof PRESETS[0]) => {
  localSettings.value.ambientIntensity = p.amb
  localSettings.value.directionalIntensity = p.dir
  localSettings.value.pointIntensity = p.pt
  localSettings.value.pointColor = p.col
  localSettings.value.bgColor = p.bg
}

watch(localSettings, (newVal) => {
  emit('update:settings', newVal)
}, { deep: true })
</script>

<template>
  <div class="controls-container">
    <!-- Header / Toggle Bar -->
    <div class="controls-header">
      <div class="header-left" @click="isExpanded = !isExpanded">
        <span class="icon">💡</span>
        <span class="title">Ánh Sáng</span>
        <span class="indicator" :class="{ open: isExpanded }">▼</span>
      </div>
      
      <div class="header-right">
        <button class="close-btn" @click="$emit('close')" title="Đóng">✕</button>
      </div>
    </div>
      
    <!-- Collapsible Settings Content -->
    <transition name="slide-fade">
      <div class="controls-content" v-if="isExpanded">
        
        <div class="control-row">
           <label>Gói Cài Đặt</label>
           <div class="presets-row">
             <button 
               v-for="p in PRESETS" 
               :key="p.name"
               class="preset-btn"
               @click="applyPreset(p)"
             >
               {{ p.name }}
             </button>
           </div>
        </div>

        <div class="divider"></div>

        <div class="section-title">Cường Độ</div>

        <div class="control-row">
          <label>Môi trường <span>{{ localSettings.ambientIntensity }}</span></label>
          <input type="range" v-model.number="localSettings.ambientIntensity" min="0" max="5" step="0.1">
        </div>
        
        <div class="control-row">
          <label>Hướng <span>{{ localSettings.directionalIntensity }}</span></label>
          <input type="range" v-model.number="localSettings.directionalIntensity" min="0" max="10" step="0.5">
        </div>

        <div class="control-row">
          <label>Điểm <span>{{ localSettings.pointIntensity }}</span></label>
          <input type="range" v-model.number="localSettings.pointIntensity" min="0" max="10" step="0.5">
        </div>

        <div class="divider"></div>

        <div class="section-title">Màu Sắc</div>
        
        <div class="control-row">
           <label>Đèn Điểm</label>
           <div class="color-options">
             <div 
               v-for="c in ['#FFD700', '#FFFFFF', '#FF6B6B', '#4ECDC4']" 
               :key="c"
               class="color-dot"
               :style="{ backgroundColor: c }"
               :class="{ selected: localSettings.pointColor === c }"
               @click="localSettings.pointColor = c"
             ></div>
             <input type="color" v-model="localSettings.pointColor" class="color-input">
           </div>
        </div>

        <div class="control-row">
           <label>Nền</label>
           <div class="color-options">
             <div 
               v-for="c in ['#0a0f1a', '#87CEEB', '#2C3E50', '#000000']" 
               :key="c"
               class="color-dot"
               :style="{ backgroundColor: c }"
               :class="{ selected: localSettings.bgColor === c }"
               @click="localSettings.bgColor = c"
             ></div>
             <input type="color" v-model="localSettings.bgColor" class="color-input">
           </div>
        </div>

      </div>
    </transition>
  </div>
</template>

<style scoped>
.controls-container {
  position: absolute;
  top: 20px; /* Below snow controls if active, or just offset */
  right: 20px;
  z-index: 200;
  width: 280px;
  max-width: 90vw;
  font-family: 'Inter', sans-serif;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Header Bar */
.controls-header {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: auto;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  transition: all 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: white;
  user-select: none;
}

.title {
  font-weight: 600;
  font-size: 0.95rem;
}

.indicator {
  font-size: 0.7rem;
  opacity: 0.6;
  transition: transform 0.3s;
}

.indicator.open {
  transform: rotate(180deg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Close/Exit Button */
.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 59, 48, 0.8);
  border-color: rgba(255, 59, 48, 0.8);
}

/* Content Panel */
.controls-content {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: white;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255,255,255,0.5);
  font-weight: 700;
  margin-top: 4px;
}

.divider {
  height: 1px;
  background: rgba(255,255,255,0.1);
  margin: 4px 0;
}

.control-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-row label {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: space-between;
}

.control-row label span {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.7rem;
}

/* Slider styling */
input[type=range] {
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
}

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  margin-top: -5px;
  box-shadow: 0 0 8px rgba(255,255,255,0.4);
}

input[type=range]::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

/* Color Options */
.color-options {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.color-dot.selected {
  border-color: white;
  transform: scale(1.2);
}

.color-input {
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

@media (max-width: 480px) {
  .controls-container {
    top: 70px; /* Offset from snow controls */
    right: 50%;
    transform: translateX(50%);
    width: 90%;
  }
}

.presets-row {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 4px 0;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
</style>
