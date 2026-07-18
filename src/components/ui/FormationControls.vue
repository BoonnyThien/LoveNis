<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  currentFormation: string,
  currentEffect: string,
  showLabels: boolean,
  isDancing: boolean
}>()

const emit = defineEmits(['update:formation', 'update:effect', 'update:labels', 'update:dancing', 'trigger-dance', 'close'])

const isExpanded = ref(true)

const BASE_FORMATIONS = [
  { id: 'circle', name: 'Vòng Tròn', icon: '⭕' },
  { id: 'tree', name: 'Trang Trí', icon: '🎄' }
]

const EFFECTS = [
  { id: 'none', name: 'Tĩnh', icon: '🛑' },
  { id: 'bloom', name: 'Nhấp Nháy', icon: '✨' }
]
</script>

<template>
  <div class="controls-container">
    <div class="controls-header">
      <div class="header-left" @click="isExpanded = !isExpanded">
        <span class="icon">✨</span>
        <span class="title">Đội Hình</span>
        <span class="indicator" :class="{ open: isExpanded }">▼</span>
      </div>
      <div class="header-right">
        <button class="close-btn" @click="$emit('close')" title="Đóng">✕</button>
      </div>
    </div>
      
    <transition name="slide-fade">
      <div class="controls-content" v-if="isExpanded">
        <div class="formation-grid">
          <label class="section-label">Đội Hình Cơ Bản</label>
          <button 
            v-for="form in BASE_FORMATIONS" 
            :key="form.id"
            class="formation-btn"
            :class="{ active: currentFormation === form.id }"
            @click="$emit('update:formation', form.id)"
          >
            <span class="btn-icon">{{ form.icon }}</span>
            <span class="btn-text">{{ form.name }}</span>
          </button>

          <div class="separator"></div>
          
          <label class="section-label">Hiệu Ứng Di Chuyển</label>
          <div class="effect-row">
            <button 
              v-for="eff in EFFECTS" 
              :key="eff.id"
              class="effect-btn"
              :class="{ active: currentEffect === eff.id }"
              @click="$emit('update:effect', eff.id)"
            >
              <span class="btn-icon-small">{{ eff.icon }}</span>
              <span class="btn-text-small">{{ eff.name }}</span>
            </button>
          </div>



          <div class="separator"></div>
          
          <button 
            class="toggle-btn" 
            :class="{ active: isDancing }"
            @click="$emit('trigger-dance')"
          >
            <span class="btn-icon">💃</span>
            <span class="btn-text">Múa</span>
          </button>

          <div class="separator"></div>
          
          <button 
            class="toggle-btn" 
            :class="{ active: showLabels }"
            @click="$emit('update:labels', !showLabels)"
          >
            <span class="btn-icon">{{ showLabels ? '👁️' : '🙈' }}</span>
            <span class="btn-text">Hiển Thị Chữ</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.controls-container {
  position: absolute;
  top: 20px;
  left: 20px; /* Left side to distinguish from others */
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

.formation-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.formation-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  text-align: left;
}

.formation-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.formation-btn.active {
  background: rgba(78, 205, 196, 0.2);
  border-color: #4ECDC4;
  color: #4ECDC4;
}

.section-label {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.5);
  margin: 4px 0 2px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
}

.effect-row {
  display: flex;
  gap: 5px;
}

.effect-btn {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.effect-btn.active {
  background: rgba(255, 215, 0, 0.15);
  border-color: #FFD700;
  color: #FFD700;
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
  transition: all 0.2s;
}
.toggle-btn.active {
  background: rgba(100, 255, 100, 0.15);
  border-color: #4eff88;
  color: #4eff88;
}

.btn-icon {
  font-size: 1.2rem;
}

.btn-text {
  font-weight: 500;
  font-size: 0.9rem;
}

.btn-icon-small {
  font-size: 1rem;
}
.btn-text-small {
  font-size: 0.7rem;
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
    top: 70px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
  }
}
</style>
