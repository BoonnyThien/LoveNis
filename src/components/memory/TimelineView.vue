<template>
  <div
    class="timeline-wrap"
    @wheel.prevent="onWheel"
    @keydown.up.prevent="scrollPrev"
    @keydown.down.prevent="scrollNext"
    tabindex="0"
  >
    <!-- Canvas -->
    <canvas ref="canvasRef" class="tl-canvas" />

    <!-- Loading -->
    <Transition name="fade">
      <div v-if="!isReady" class="tl-loading">
        <div class="tl-spinner" />
        <p>Đang dựng timeline…</p>
      </div>
    </Transition>

    <!-- Progress bar (dọc bên phải) -->
    <div class="tl-progress">
      <div class="tl-progress-fill" :style="{ height: progressPct + '%' }" />
      <span class="tl-progress-label">{{ activeIndex + 1 }}/{{ totalCount }}</span>
    </div>

    <!-- Nav buttons -->
    <div class="tl-nav">
      <button class="tl-btn" @click="scrollPrev" :disabled="activeIndex <= 0">↑</button>
      <button class="tl-btn" @click="scrollNext" :disabled="activeIndex >= totalCount - 1">↓</button>
    </div>

    <!-- Active card overlay -->
    <Transition name="slide-right">
      <div v-if="activeMemory" class="tl-card-info">
        <div class="tl-dot" :style="{ background: activeMemory.color_tag || '#ff6b9d' }" />
        <div>
          <p class="tl-card-title">{{ activeMemory.title || 'Ký ức' }}</p>
          <p class="tl-card-date">{{ formatDate(activeMemory.memory_date || activeMemory.created_at) }}</p>
          <p class="tl-card-msg">{{ activeMemory.message }}</p>
          <span class="tl-badge">{{ typeBadge }}</span>
        </div>
        <button class="tl-fav" @click="toggleFavorite(activeMemory.id)">
          {{ activeMemory.is_favorite ? '❤️' : '🤍' }}
        </button>
      </div>
    </Transition>

    <!-- Hint -->
    <p class="tl-hint">Scroll hoặc ↑↓ để di chuyển</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTimeline3D } from '@/composables/useTimeline3D'
import { useMemories }   from '@/composables/useMemories'

const props = defineProps({
  memories: { type: Array, default: () => [] }
})

const {
  activeIndex, isReady, totalCount, activeMemory, progressPct,
  init, loadMemories, startLoop,
  scrollPrev, scrollNext, onWheel, onResize
} = useTimeline3D()

const { toggleFavorite } = useMemories()
const canvasRef = ref(null)

const TYPE_BADGE = { image: '🖼️ Ảnh', video: '🎬 Video', audio: '🎵 Nhạc', model: '🌐 3D' }
const typeBadge  = computed(() => TYPE_BADGE[activeMemory.value?.type] ?? '')

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  const { width, height } = canvas.parentElement.getBoundingClientRect()
  init(canvas, width, height)
  loadMemories(props.memories)
  startLoop()

  const ro = new ResizeObserver(([e]) => onResize(e.contentRect.width, e.contentRect.height))
  ro.observe(canvas.parentElement)
  onUnmounted(() => ro.disconnect())
})

watch(() => props.memories, list => loadMemories(list), { deep: true })
</script>

<style scoped>
.timeline-wrap {
  position: relative;
  width: 100%;
  height: 600px;
  border-radius: 24px;
  background: radial-gradient(ellipse at 50% 30%, #1a0d2e 0%, #060410 100%);
  overflow: hidden;
  outline: none;
}

.tl-canvas { position: absolute; inset: 0; width: 100%; height: 100%; }

/* ── Loading ─────────────────────────────────── */
.tl-loading {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 14px;
  background: inherit;
  color: rgba(255,255,255,0.5); font-size: 14px;
}
.tl-spinner {
  width: 32px; height: 32px;
  border: 3px solid rgba(255,107,157,0.25);
  border-top-color: #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Progress bar ────────────────────────────── */
.tl-progress {
  position: absolute; right: 20px; top: 50%; transform: translateY(-50%);
  width: 4px; height: 180px;
  background: rgba(255,255,255,0.08);
  border-radius: 4px; z-index: 5;
  display: flex; flex-direction: column; align-items: center;
}
.tl-progress-fill {
  width: 100%;
  background: linear-gradient(180deg, #ff6b9d, #c44dff);
  border-radius: 4px;
  transition: height 0.4s ease;
  min-height: 4px;
}
.tl-progress-label {
  margin-top: 8px; font-size: 11px;
  color: rgba(255,255,255,0.4); white-space: nowrap;
}

/* ── Nav ─────────────────────────────────────── */
.tl-nav {
  position: absolute; right: 36px; top: 50%; transform: translateY(-50%);
  display: flex; flex-direction: column; gap: 8px; z-index: 5;
}
.tl-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.7);
  cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, transform 0.15s;
}
.tl-btn:hover:not(:disabled) {
  background: rgba(255,107,157,0.25); transform: scale(1.1);
}
.tl-btn:disabled { opacity: 0.2; cursor: default; }

/* ── Card Info ───────────────────────────────── */
.tl-card-info {
  position: absolute; bottom: 32px; left: 24px;
  max-width: 300px; z-index: 5;
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 16px;
  display: flex; gap: 12px; align-items: flex-start;
}
.tl-dot {
  width: 10px; height: 10px; border-radius: 50%;
  flex-shrink: 0; margin-top: 5px;
}
.tl-card-title { margin: 0 0 2px; font-size: 14px; font-weight: 700; color: #fff; }
.tl-card-date  { margin: 0 0 4px; font-size: 11px; color: rgba(255,255,255,0.4); }
.tl-card-msg   {
  margin: 0 0 6px; font-size: 12px;
  color: rgba(255,255,255,0.6);
  max-height: 36px; overflow: hidden; text-overflow: ellipsis;
}
.tl-badge {
  display: inline-block; padding: 2px 8px;
  background: rgba(255,107,157,0.15);
  border: 1px solid rgba(255,107,157,0.3);
  border-radius: 20px; font-size: 10px; color: #ff6b9d;
}
.tl-fav {
  background: none; border: none; font-size: 20px;
  cursor: pointer; margin-left: auto; flex-shrink: 0;
  transition: transform 0.2s;
}
.tl-fav:hover { transform: scale(1.2); }

/* ── Hint ────────────────────────────────────── */
.tl-hint {
  position: absolute; bottom: 14px; right: 60px;
  font-size: 10px; color: rgba(255,255,255,0.2);
  margin: 0; pointer-events: none;
}

/* ── Transitions ─────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-right-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-right-leave-active { transition: all 0.2s ease; }
.slide-right-enter-from { opacity: 0; transform: translateX(-16px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(-8px); }
</style>
