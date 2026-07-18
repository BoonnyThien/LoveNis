<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  enabled: boolean
  settings: {
    speed: number
    count: number
    size: number
    color: string
  }
}>()

const emit = defineEmits(['update:enabled', 'update:settings', 'close'])

const localSettings = ref({ ...props.settings })
const isExpanded = ref(true) // Start expanded, user can toggle

const PRESETS = [
  { name: 'Nhẹ', speed: 0.5, count: 200, size: 0.1 },
  { name: 'Vừa', speed: 1.5, count: 1000, size: 0.2 },
  { name: 'Bão', speed: 4, count: 3000, size: 0.3 }
]

const applyPreset = (preset: typeof PRESETS[0]) => {
  localSettings.value.speed = preset.speed
  localSettings.value.count = preset.count
  localSettings.value.size = preset.size
}

// Watch for changes in local settings to emit updates
watch(localSettings, (newVal) => {
  emit('update:settings', newVal)
}, { deep: true })

</script>

<template>
  <div class="snow-controls-container">
    <!-- Header / Toggle Bar -->
    <div class="snow-header">
      <div class="header-left" @click="isExpanded = !isExpanded">
        <span class="icon">❄️</span>
        <span class="title">Tuyết</span>
        <span class="indicator" :class="{ open: isExpanded }">▼</span>
      </div>
      
      <div class="header-right">
        <!-- Toggle Switch -->
        <button 
          class="toggle-switch" 
          :class="{ active: enabled }"
          @click="$emit('update:enabled', !enabled)"
          title="Bật/Tắt"
        >
          <div class="knob"></div>
        </button>
        
        <!-- Separate Close Button -->
        <button class="close-btn" @click="$emit('close')" title="Đóng">✕</button>
      </div>
    </div>
      
    <!-- Collapsible Settings Content -->
    <transition name="slide-fade">
      <div class="snow-content" v-if="isExpanded">
        <!-- Presets -->
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

        <div class="control-row">
          <label>Tốc độ <span>{{ localSettings.speed }}</span></label>
          <input type="range" v-model.number="localSettings.speed" min="0" max="5" step="0.1">
        </div>
        
        <div class="control-row">
          <label>Mật độ <span>{{ localSettings.count }}</span></label>
          <input type="range" v-model.number="localSettings.count" min="100" max="3000" step="100">
        </div>

         <div class="control-row">
          <label>Kích thước <span>{{ localSettings.size }}</span></label>
          <input type="range" v-model.number="localSettings.size" min="0.05" max="0.5" step="0.01">
        </div>
        
        <div class="control-row color-row">
           <div class="color-options">
             <div 
               v-for="c in ['#FFFFFF', '#A5F2F3', '#FFD1DC', '#FFFACD']" 
               :key="c"
               class="color-dot"
               :style="{ backgroundColor: c }"
               :class="{ selected: localSettings.color === c }"
               @click="localSettings.color = c"
             ></div>
           </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.snow-controls-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 200;
  width: 280px;
  max-width: 90vw; /* Mobile responsive */
  font-family: 'Inter', sans-serif;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Header Bar */
.snow-header {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px; /* Pill shape */
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

/* Toggle Switch */
.toggle-switch {
  width: 36px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  border: none;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
  padding: 2px;
  flex-shrink: 0;
}

.toggle-switch.active {
  background: #4ECDC4;
}

.knob {
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch.active .knob {
  transform: translateX(16px);
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
.snow-content {
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

/* Controls styling */
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
.color-row {
  flex-direction: row;
  justify-content: center;
  margin-top: 4px;
}

.color-options {
  display: flex;
  gap: 12px;
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

/* Mobile specific overrides */
@media (max-width: 480px) {
  .snow-controls-container {
    top: 10px;
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
