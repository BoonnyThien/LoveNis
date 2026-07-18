<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  currentShape: string
}>()

const emit = defineEmits(['update:shape', 'close'])

const isExpanded = ref(true)

const SHAPES = [
  { id: 'sphere', name: 'Tròn', icon: '🔵' },
  { id: 'heart', name: 'Trái Tim', icon: '❤️' },
  { id: 'icosahedron', name: 'Đa Giác', icon: '🔷' }
]
</script>

<template>
  <div class="controls-container">
    <div class="controls-header">
      <div class="header-left" @click="isExpanded = !isExpanded">
        <span class="icon">💠</span>
        <span class="title">Hình Dạng</span>
        <span class="indicator" :class="{ open: isExpanded }">▼</span>
      </div>
      <div class="header-right">
        <button class="close-btn" @click="$emit('close')" title="Đóng">✕</button>
      </div>
    </div>
      
    <transition name="slide-fade">
      <div class="controls-content" v-if="isExpanded">
        <div class="shape-grid">
          <button 
            v-for="shape in SHAPES" 
            :key="shape.id"
            class="shape-btn"
            :class="{ active: currentShape === shape.id }"
            @click="$emit('update:shape', shape.id)"
          >
            <span class="btn-icon">{{ shape.icon }}</span>
            <span class="btn-text">{{ shape.name }}</span>
          </button>
        </div>
        <div class="separator"></div>

      </div>
    </transition>
  </div>
</template>

<style scoped>
.controls-container {
  position: absolute;
  top: 150px; /* offset below formation controls on desktop */
  left: 20px; 
  z-index: 200;
  width: 200px;
  max-width: 90vw;
  font-family: 'Inter', sans-serif;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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
  pointer-events: auto;
}

.close-btn:hover {
  background: rgba(255, 59, 48, 0.8);
  border-color: rgba(255, 59, 48, 0.8);
}

.controls-content {
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 12px;
  pointer-events: auto;
}

.shape-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.shape-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.shape-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.shape-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #FFD700;
  color: #FFD700;
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-text {
  font-weight: 500;
  font-size: 0.8rem;
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

/* VR Button Styles */
.separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 10px 0;
}

.toggle-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  transition: all 0.2s;
}

.toggle-btn.active {
  background: rgba(255, 215, 0, 0.2);
  border-color: #FFD700;
  color: #FFD700;
}

@media (max-width: 480px) {
  .controls-container {
    top: 130px; /* shift down more on mobile */
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
  }
}
</style>
