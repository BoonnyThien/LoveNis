<template>
  <!-- Wrapper -->
  <div
    class="coverflow-wrap"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointerleave="onPointerUp"
    @wheel.prevent="onWheel"
  >
    <!-- Canvas Three.js -->
    <canvas ref="canvasRef" class="cf-canvas" />

    <!-- Loading overlay -->
    <Transition name="fade">
      <div v-if="!isReady" class="cf-loading">
        <div class="cf-spinner" />
        <p>Đang tải memories…</p>
      </div>
    </Transition>

    <!-- Nav arrows -->
    <button class="cf-arrow cf-arrow-left"  @click.stop="goPrev" :disabled="activeIndex <= 0">‹</button>
    <button class="cf-arrow cf-arrow-right" @click.stop="goNext" :disabled="activeIndex >= memories.length - 1">›</button>

    <!-- Info panel (active card) -->
    <Transition name="slide-up">
      <div v-if="activeMemory" class="cf-info">
        <span class="cf-type-badge">{{ typeBadge }}</span>
        <p class="cf-title">{{ activeMemory.title || 'Không có tiêu đề' }}</p>
        <p class="cf-message">{{ activeMemory.message }}</p>
        <p class="cf-date">{{ formatDate(activeMemory.memory_date || activeMemory.created_at) }}</p>

        <!-- Audio player nếu là audio -->
        <LoveAudioPlayer
          v-if="activeMemory.type === 'audio'"
          :src="activeMemory.media_url"
          :title="activeMemory.title"
          class="cf-audio"
        />

        <!-- Favorite toggle -->
        <button class="cf-fav" @click="toggleFavorite(activeMemory.id)">
          {{ activeMemory.is_favorite ? '❤️' : '🤍' }}
        </button>
      </div>
    </Transition>

    <!-- Dot indicators -->
    <div class="cf-dots">
      <button
        v-for="(_, i) in memories"
        :key="i"
        class="cf-dot"
        :class="{ active: i === activeIndex }"
        @click.stop="goTo(i)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useCoverflow } from '@/composables/useCoverflow'
import { useMemories }  from '@/composables/useMemories'
import LoveAudioPlayer  from '@/components/LoveAudioPlayer.vue'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  memories: { type: Array, default: () => [] }
})

// ── Composables ────────────────────────────────────────────────────────────────
const {
  activeIndex, isReady, activeMemory,
  init, loadMemories, startLoop,
  goTo, goNext, goPrev,
  onPointerDown, onPointerMove, onPointerUp,
  onResize
} = useCoverflow()

const { toggleFavorite } = useMemories()

// ── Canvas ref ─────────────────────────────────────────────────────────────────
const canvasRef = ref(null)

// ── Computed ───────────────────────────────────────────────────────────────────
const TYPE_BADGE = { image: '🖼️ Ảnh', video: '🎬 Video', audio: '🎵 Nhạc', model: '🌐 3D' }
const typeBadge  = computed(() => TYPE_BADGE[activeMemory.value?.type] ?? '')

// ── Format date ────────────────────────────────────────────────────────────────
function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

// ── Wheel navigation ───────────────────────────────────────────────────────────
function onWheel(e) {
  e.deltaY > 0 ? goNext() : goPrev()
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const { width, height } = canvas.parentElement.getBoundingClientRect()
  init(canvas, width, height)
  loadMemories(props.memories)
  startLoop()

  // Resize observer
  const ro = new ResizeObserver(([entry]) => {
    const { width: w, height: h } = entry.contentRect
    onResize(w, h)
    canvas.style.width  = w + 'px'
    canvas.style.height = h + 'px'
  })
  ro.observe(canvas.parentElement)
  onUnmounted(() => ro.disconnect())
})

// Watch khi memories thay đổi từ bên ngoài
watch(() => props.memories, (list) => loadMemories(list), { deep: true })
</script>

<style scoped>
/* ── Wrapper ─────────────────────────────────────────────────────────────── */
.coverflow-wrap {
  position: relative;
  width: 100%;
  height: 520px;
  overflow: hidden;
  border-radius: 24px;
  background: radial-gradient(ellipse at center, #1a0d2e 0%, #0d0818 100%);
  user-select: none;
  touch-action: none;
}

/* ── Canvas ──────────────────────────────────────────────────────────────── */
.cf-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* ── Loading ─────────────────────────────────────────────────────────────── */
.cf-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: inherit;
  color: rgba(255,255,255,0.6);
  font-size: 14px;
  z-index: 10;
}
.cf-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba(255,107,157,0.3);
  border-top-color: #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Nav Arrows ──────────────────────────────────────────────────────────── */
.cf-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.12);
  color: #fff;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, transform 0.2s;
}
.cf-arrow:hover:not(:disabled) { background: rgba(255,107,157,0.25); transform: translateY(-50%) scale(1.1); }
.cf-arrow:disabled { opacity: 0.25; cursor: default; }
.cf-arrow-left  { left: 16px; }
.cf-arrow-right { right: 16px; }

/* ── Info Panel ──────────────────────────────────────────────────────────── */
.cf-info {
  position: absolute;
  bottom: 52px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  text-align: center;
  z-index: 5;
  pointer-events: auto;
}
.cf-type-badge {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(255,107,157,0.2);
  border: 1px solid rgba(255,107,157,0.35);
  border-radius: 20px;
  font-size: 11px;
  color: #ff6b9d;
  margin-bottom: 6px;
}
.cf-title {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 12px rgba(0,0,0,0.8);
}
.cf-message {
  margin: 0 0 4px;
  font-size: 13px;
  color: rgba(255,255,255,0.55);
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cf-date { margin: 0; font-size: 11px; color: rgba(255,255,255,0.3); }
.cf-audio { margin-top: 10px; }

.cf-fav {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  margin-top: 8px;
  transition: transform 0.2s;
}
.cf-fav:hover { transform: scale(1.2); }

/* ── Dots ────────────────────────────────────────────────────────────────── */
.cf-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}
.cf-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}
.cf-dot.active {
  background: #ff6b9d;
  transform: scale(1.4);
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.slide-up-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }
</style>
