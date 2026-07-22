<template>
  <div class="audio-player" :class="{ 'is-playing': isPlaying, 'is-loading': isBuffering }">

    <!-- Album Art / Waveform Visual -->
    <div class="player-artwork">
      <div class="artwork-ring" :style="{ animationPlayState: isPlaying ? 'running' : 'paused' }">
        <div class="artwork-inner">
          <span class="artwork-icon">{{ typeIcon }}</span>
        </div>
      </div>
      <div class="artwork-glow" :style="{ opacity: isPlaying ? 1 : 0 }"></div>
    </div>

    <!-- Track Info -->
    <div class="player-info">
      <p class="track-title">{{ title || 'Chưa có tiêu đề' }}</p>
      <p class="track-sub">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</p>
    </div>

    <!-- Waveform Progress Bar -->
    <div class="player-progress" @click="seek" @mousemove="onProgressHover" ref="progressRef">
      <div class="progress-bg"></div>
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
    </div>

    <!-- Controls -->
    <div class="player-controls">
      <!-- Rewind 10s -->
      <button class="ctrl-btn ctrl-skip" @click="skipBack" title="Tua lại 10s">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
          <text x="8.5" y="14" font-size="5" fill="currentColor">10</text>
        </svg>
      </button>

      <!-- Play / Pause -->
      <button class="ctrl-btn ctrl-play" @click="togglePlay" :disabled="isBuffering">
        <svg v-if="isBuffering" class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
        </svg>
        <svg v-else-if="isPlaying" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1"/>
          <rect x="14" y="4" width="4" height="16" rx="1"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>

      <!-- Forward 10s -->
      <button class="ctrl-btn ctrl-skip" @click="skipForward" title="Tua tới 10s">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
          <text x="8.5" y="14" font-size="5" fill="currentColor">10</text>
        </svg>
      </button>
    </div>

    <!-- Volume Control -->
    <div class="player-volume">
      <button class="vol-btn" @click="toggleMute">
        <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
      </button>
      <input
        class="vol-slider"
        type="range"
        min="0" max="1" step="0.01"
        :value="isMuted ? 0 : volume"
        @input="onVolumeChange"
      />
    </div>

    <!-- Hidden native audio -->
    <audio
      ref="audioRef"
      :src="src"
      preload="metadata"
      @loadedmetadata="onLoaded"
      @timeupdate="onTimeUpdate"
      @waiting="isBuffering = true"
      @canplay="isBuffering = false"
      @ended="onEnded"
      @error="onError"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// ── Props ──────────────────────────────────────────────────────────────────────
const props = defineProps({
  src:       { type: String, required: true },
  title:     { type: String, default: '' },
  autoplay:  { type: Boolean, default: false },
  type:      { type: String, default: 'audio' } // 'audio' | 'video'
})

const emit = defineEmits(['play', 'pause', 'ended', 'error', 'timeupdate'])

// ── Refs (shallow để tránh Vue reactivity freeze) ──────────────────────────────
const audioRef    = ref(null)
const progressRef = ref(null)

const isPlaying   = ref(false)
const isBuffering = ref(false)
const isMuted     = ref(false)
const currentTime = ref(0)
const duration    = ref(0)
const volume      = ref(0.8)

// ── Computed ───────────────────────────────────────────────────────────────────
const progressPercent = computed(() => {
  if (!duration.value) return 0
  return (currentTime.value / duration.value) * 100
})

const typeIcon = computed(() => {
  const icons = { audio: '🎵', video: '🎬', model: '🌐', image: '🖼️' }
  return icons[props.type] || '🎵'
})

// ── Methods ────────────────────────────────────────────────────────────────────

/**
 * Toggle play/pause — xử lý autoplay policy của browser hiện đại:
 * play() trả về Promise, cần catch nếu bị block
 */
async function togglePlay() {
  const audio = audioRef.value
  if (!audio) return

  if (isPlaying.value) {
    audio.pause()
    isPlaying.value = false
    emit('pause')
  } else {
    try {
      await audio.play()
      isPlaying.value = true
      emit('play')
    } catch (err) {
      // Browser blocked autoplay → cần user gesture, đã có click nên thường không xảy ra
      console.warn('⚠️ Play blocked:', err.message)
    }
  }
}

function skipBack() {
  if (audioRef.value) audioRef.value.currentTime = Math.max(0, currentTime.value - 10)
}

function skipForward() {
  if (audioRef.value) audioRef.value.currentTime = Math.min(duration.value, currentTime.value + 10)
}

function seek(e) {
  const rect   = progressRef.value.getBoundingClientRect()
  const ratio  = (e.clientX - rect.left) / rect.width
  const newTime = Math.max(0, Math.min(1, ratio)) * duration.value
  if (audioRef.value) audioRef.value.currentTime = newTime
}

function onProgressHover(e) {
  if (e.buttons !== 1) return // chỉ drag khi giữ chuột
  seek(e)
}

function toggleMute() {
  isMuted.value = !isMuted.value
  if (audioRef.value) audioRef.value.muted = isMuted.value
}

function onVolumeChange(e) {
  volume.value = parseFloat(e.target.value)
  if (audioRef.value) {
    audioRef.value.volume = volume.value
    if (volume.value > 0) isMuted.value = false
  }
}

// ── Audio Events ───────────────────────────────────────────────────────────────
function onLoaded() {
  duration.value = audioRef.value?.duration || 0
  if (props.autoplay) togglePlay()
}

function onTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime || 0
  emit('timeupdate', currentTime.value)
}

function onEnded() {
  isPlaying.value = false
  currentTime.value = 0
  emit('ended')
}

function onError(e) {
  console.error('❌ Audio error:', e)
  isBuffering.value = false
  isPlaying.value = false
  emit('error', e)
}

// ── Format time mm:ss ──────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Watch src thay đổi → reset state ──────────────────────────────────────────
watch(() => props.src, () => {
  isPlaying.value   = false
  currentTime.value = 0
  duration.value    = 0
  isBuffering.value = false
})

// ── Init volume ────────────────────────────────────────────────────────────────
onMounted(() => {
  if (audioRef.value) audioRef.value.volume = volume.value
})
</script>

<style scoped>
/* ── Container ─────────────────────────────────────────────────────────────── */
.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 107, 157, 0.15);
  border-radius: 24px;
  width: 100%;
  max-width: 360px;
  transition: border-color 0.3s;
}
.audio-player.is-playing {
  border-color: rgba(255, 107, 157, 0.4);
  box-shadow: 0 0 40px rgba(255, 107, 157, 0.12);
}

/* ── Artwork ───────────────────────────────────────────────────────────────── */
.player-artwork {
  position: relative;
  width: 88px;
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.artwork-glow {
  position: absolute;
  inset: -12px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,107,157,0.35) 0%, transparent 70%);
  transition: opacity 0.5s;
  pointer-events: none;
}
.artwork-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    #ff6b9d, #c44dff, #7b2fff, #ff6b9d
  );
  padding: 3px;
  animation: spin-ring 4s linear infinite;
  animation-play-state: paused;
}
@keyframes spin-ring {
  to { transform: rotate(360deg); }
}
.artwork-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #1a0d2e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

/* ── Info ──────────────────────────────────────────────────────────────────── */
.player-info {
  text-align: center;
}
.track-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}
.track-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  font-variant-numeric: tabular-nums;
}

/* ── Progress ──────────────────────────────────────────────────────────────── */
.player-progress {
  position: relative;
  width: 100%;
  height: 36px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.progress-bg {
  position: absolute;
  inset: 50% 0;
  transform: translateY(-50%);
  height: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
}
.progress-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: linear-gradient(90deg, #ff6b9d, #c44dff);
  border-radius: 4px;
  transition: width 0.1s linear;
  pointer-events: none;
}
.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ff6b9d;
  box-shadow: 0 0 8px rgba(255,107,157,0.7);
  transition: left 0.1s linear;
  pointer-events: none;
}

/* ── Controls ──────────────────────────────────────────────────────────────── */
.player-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}
.ctrl-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.7);
  transition: color 0.2s, transform 0.15s;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ctrl-btn:hover { color: #fff; transform: scale(1.1); }
.ctrl-btn:active { transform: scale(0.95); }
.ctrl-skip svg { width: 28px; height: 28px; }

.ctrl-play {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  color: #fff !important;
  box-shadow: 0 4px 20px rgba(255,107,157,0.4);
  transition: transform 0.2s, box-shadow 0.2s !important;
}
.ctrl-play:hover {
  transform: scale(1.08) !important;
  box-shadow: 0 6px 28px rgba(255,107,157,0.6) !important;
}
.ctrl-play svg { width: 26px; height: 26px; }
.ctrl-play:disabled { opacity: 0.6; cursor: wait; }

/* ── Volume ────────────────────────────────────────────────────────────────── */
.player-volume {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}
.vol-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(255,255,255,0.5);
  padding: 4px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
  flex-shrink: 0;
}
.vol-btn:hover { color: #fff; }
.vol-btn svg { width: 20px; height: 20px; }

.vol-slider {
  flex: 1;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  outline: none;
  cursor: pointer;
}
.vol-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  cursor: pointer;
  box-shadow: 0 0 6px rgba(255,107,157,0.5);
}
.vol-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  cursor: pointer;
}

/* ── Spin animation (buffering) ────────────────────────────────────────────── */
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
