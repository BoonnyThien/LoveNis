<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const lightOn = ref(false)
const successMode = ref(false)
const username = ref('')
const password = ref('')
const isLoading = ref(false)

// Cord elements refs
const cordLine = ref<SVGLineElement | null>(null)
const cordKnob = ref<SVGGElement | null>(null)
const lampAssembly = ref<SVGGElement | null>(null)

// --- PHYSICS CONSTANTS & VARIABLES ---
const targetY = 235 // Rest height of cord
let y = targetY     // Current position
let vy = 0          // Current velocity
const k = 0.14      // Spring constant
const damping = 0.78 // Damping factor
let isDragging = false
let startDragY = 0
let startY = targetY
let dragDistance = 0
let animationFrameId: number | null = null

// Spring vibration physics loop
function updateSpring() {
  if (!isDragging) {
    const displacement = y - targetY
    const springForce = -k * displacement
    vy += springForce
    vy *= damping
    y += vy

    if (cordLine.value) cordLine.value.setAttribute('y2', y.toString())
    if (cordKnob.value) {
      const delta = y - targetY
      cordKnob.value.setAttribute('transform', `translate(0, ${delta})`)
    }
    if (lampAssembly.value) {
      const angle = (y - targetY) * 0.16
      lampAssembly.value.setAttribute('transform', `rotate(${angle}, 100, 15)`)
    }

    if (Math.abs(vy) > 0.05 || Math.abs(displacement) > 0.05) {
      animationFrameId = requestAnimationFrame(updateSpring)
    } else {
      y = targetY
      vy = 0
      if (cordLine.value) cordLine.value.setAttribute('y2', targetY.toString())
      if (cordKnob.value) {
        cordKnob.value.setAttribute('transform', 'translate(0, 0)')
      }
      if (lampAssembly.value) {
        lampAssembly.value.removeAttribute('transform')
      }
      animationFrameId = null
    }
  }
}

// Synthesis of realistic mechanical switch click using Web Audio API
function playClickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const audioCtx = new AudioContextClass()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.08)
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08)
    
    osc.start()
    osc.stop(audioCtx.currentTime + 0.08)
  } catch (err) {
    // Fallback if browser blocks audio autoplay
  }
}

function toggleLight() {
  lightOn.value = !lightOn.value
  playClickSound()
}

// Drag & Pull Handlers
function onStartDrag(e: MouseEvent | TouchEvent) {
  isDragging = true
  dragDistance = 0
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  startDragY = clientY
  startY = y

  if (e.type === 'mousedown') {
    e.preventDefault()
  }

  window.addEventListener('mousemove', onDrag)
  window.addEventListener('touchmove', onDrag, { passive: false })
  window.addEventListener('mouseup', onEndDrag)
  window.addEventListener('touchend', onEndDrag)
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!isDragging) return
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const deltaY = clientY - startDragY
  dragDistance = Math.abs(deltaY)

  let newY = startY + deltaY
  if (newY < targetY) newY = targetY
  if (newY > targetY + 65) newY = targetY + 65 // Elastic cap

  y = newY
  if (cordLine.value) cordLine.value.setAttribute('y2', y.toString())
  if (cordKnob.value) {
    const delta = y - targetY
    cordKnob.value.setAttribute('transform', `translate(0, ${delta})`)
  }
  if (lampAssembly.value) {
    const angle = (y - targetY) * 0.16
    lampAssembly.value.setAttribute('transform', `rotate(${angle}, 100, 15)`)
  }

  if ('touches' in e && e.cancelable) {
    e.preventDefault()
  }
}

function onEndDrag() {
  if (!isDragging) return
  isDragging = false

  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('mouseup', onEndDrag)
  window.removeEventListener('touchend', onEndDrag)

  if ((y - targetY) > 20 || dragDistance < 4) {
    if (dragDistance < 4) {
      vy = 28 // Tap/Click simulation pull force
    } else {
      vy = 0
    }
    toggleLight()
  }

  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(updateSpring)
  }
}

function handleDirectClick() {
  if (dragDistance < 4 && vy === 0) {
    vy = 28
    toggleLight()
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(updateSpring)
    }
  }
}

function handleSubmit() {
  isLoading.value = true
  setTimeout(() => {
    successMode.value = true
    isLoading.value = false
    
    // Jump lamp shade in joy!
    vy = -35
    if (animationFrameId === null) {
      animationFrameId = requestAnimationFrame(updateSpring)
    }

    // Redirect to Happy New Year page after success animations finish
    setTimeout(() => {
      router.push('/happy-new-year')
    }, 1500)
  }, 1200)
}

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('touchmove', onDrag)
  window.removeEventListener('mouseup', onEndDrag)
  window.removeEventListener('touchend', onEndDrag)
})
</script>

<template>
  <div class="login-page-body" :class="{ 'light-on': lightOn, 'success-mode': successMode }">
    <div class="app-container">
      
      <!-- --- LAMP SECTION --- -->
      <div class="lamp-section">
        <!-- Dynamic diffused light elements (Wide-Screen alignment fix) -->
        <div class="light-cone"></div>
        <div class="ambient-glow"></div>

        <svg class="lamp-svg" viewBox="0 0 200 320" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Linen/canvas texture pattern -->
            <pattern id="fabric-pattern-vue" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="none" />
              <path d="M 0 3 L 12 3 M 0 9 L 12 9 M 3 0 L 3 12 M 9 0 L 9 12" stroke="rgba(255, 255, 255, 0.25)" stroke-width="1.2" />
              <path d="M 0 6 L 12 6 M 6 0 L 6 12" stroke="rgba(0, 0, 0, 0.18)" stroke-width="1.2" />
            </pattern>

            <!-- Metallic gradients for the cord and connectors -->
            <linearGradient id="metalGradVue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#b89742" />
              <stop offset="25%" stop-color="#ffd97d" />
              <stop offset="50%" stop-color="#8c6a1c" />
              <stop offset="75%" stop-color="#ffd97d" />
              <stop offset="100%" stop-color="#6e5010" />
            </linearGradient>

            <!-- Lampshade shading to create a 3D rounded look -->
            <radialGradient id="lampshadeShadingVue" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stop-color="rgba(255, 255, 255, 0.1)" />
              <stop offset="60%" stop-color="rgba(0, 0, 0, 0.0)" />
              <stop offset="100%" stop-color="rgba(0, 0, 0, 0.35)" />
            </radialGradient>

            <!-- Bulb glows (only active when lamp is ON) -->
            <radialGradient id="bulbGlowGradVue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(255, 235, 150, 1)" />
              <stop offset="40%" stop-color="rgba(255, 200, 100, 0.6)" />
              <stop offset="100%" stop-color="rgba(255, 200, 100, 0)" />
            </radialGradient>
            <radialGradient id="bulbInnerGlowGradVue" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="50%" stop-color="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stop-color="rgba(255, 235, 150, 0)" />
            </radialGradient>
          </defs>

          <!-- Ceiling Canopy / Mount -->
          <path d="M 80 0 L 120 0 L 115 15 L 85 15 Z" fill="#2d2d35" />
          
          <!-- Swingable Lamp Assembly Group -->
          <g id="lamp-assembly" ref="lampAssembly">
            <!-- Hanging Wire -->
            <line x1="100" y1="15" x2="100" y2="70" stroke="#2d2d35" stroke-width="3.5" />

            <!-- Socket Connector -->
            <rect x="91" y="70" width="18" height="15" rx="3" fill="#4a4a54" />
            <rect x="88" y="80" width="24" height="6" rx="1.5" fill="url(#metalGradVue)" />

            <!-- Warm ambient bulb glow group behind shade & bulb -->
            <g class="bulb-glow-group">
              <circle cx="100" cy="172" r="55" fill="url(#bulbGlowGradVue)" />
              <circle cx="100" cy="172" r="32" fill="url(#bulbInnerGlowGradVue)" />
            </g>

            <!-- Cute Lampshade Body & Rim (Character Base) -->
            <g class="lamp-shade-group">
              <path class="lamp-shade" d="
                M 100 85 
                C 75 85, 45 110, 45 140 
                C 45 155, 35 162, 35 165 
                L 165 165 
                C 165 162, 155 155, 155 140 
                C 155 110, 125 85, 100 85 Z
              " />
              <ellipse class="lamp-shade-rim" cx="100" cy="165" rx="65" ry="6" />

              <!-- 3D Shading Overlay -->
              <path d="
                M 100 85 
                C 75 85, 45 110, 45 140 
                C 45 155, 35 162, 35 165 
                L 165 165 
                C 165 162, 155 155, 155 140 
                C 155 110, 125 85, 100 85 Z
              " fill="url(#lampshadeShadingVue)" style="mix-blend-mode: multiply; pointer-events: none;" />
              <ellipse cx="100" cy="165" rx="65" ry="6" fill="url(#lampshadeShadingVue)" style="mix-blend-mode: multiply; pointer-events: none;" />

              <!-- Fabric Weave Texture Overlay -->
              <path d="
                M 100 85 
                C 75 85, 45 110, 45 140 
                C 45 155, 35 162, 35 165 
                L 165 165 
                C 165 162, 155 155, 155 140 
                C 155 110, 125 85, 100 85 Z
              " fill="url(#fabric-pattern-vue)" style="mix-blend-mode: overlay; opacity: 0.7; pointer-events: none;" />
              <ellipse cx="100" cy="165" rx="65" ry="6" fill="url(#fabric-pattern-vue)" style="mix-blend-mode: overlay; opacity: 0.7; pointer-events: none;" />
            </g>

            <!-- Physical Light Bulb (Semi-exposed) -->
            <circle class="lamp-bulb" cx="100" cy="172" r="22" />

            <!-- Cute Facial Expressions -->
            <!-- Sleep state: Eyes closed (visible by default) -->
            <g class="eyes-closed-group">
              <path class="eye-closed" id="eye-left-closed" d="M 70 125 Q 78 133 86 125" />
              <path class="eye-closed" id="eye-right-closed" d="M 114 125 Q 122 133 130 125" />
            </g>

            <!-- Active state: Shiny, sparkling open eyes -->
            <g class="eyes-open-group">
              <!-- Left Eye -->
              <g class="eye-open-left">
                <circle cx="78" cy="124" r="10" fill="#1a1a24" />
                <circle class="eye-sparkle-large" cx="75.5" cy="120.5" r="3.2" fill="#ffffff" />
                <circle class="eye-sparkle-small" cx="81.5" cy="127.5" r="1.5" fill="#ffffff" />
              </g>
              <!-- Right Eye -->
              <g class="eye-open-right">
                <circle cx="122" cy="124" r="10" fill="#1a1a24" />
                <circle class="eye-sparkle-large" cx="119.5" cy="120.5" r="3.2" fill="#ffffff" />
                <circle class="eye-sparkle-small" cx="125.5" cy="127.5" r="1.5" fill="#ffffff" />
              </g>
              <!-- Success mode: Right eye changes to a cute wink -->
              <path class="wink-eye" d="M 114 125 Q 122 115 130 125" />
            </g>

            <!-- Glowing Blushing Cheeks -->
            <g class="blush-cheeks">
              <ellipse cx="64" cy="135" rx="8" ry="4.5" fill="#ff4d6d" />
              <ellipse cx="136" cy="135" rx="8" ry="4.5" fill="#ff4d6d" />
            </g>

            <!-- Smiling mouth -->
            <path class="mouth" d="M 93 138 Q 100 144 107 138" />
            
            <!-- Sticking out tongue -->
            <path class="tongue" id="lamp-tongue" d="M 96 140 C 96 149, 104 149, 104 140 Z" />

            <!-- Interactive Pull Cord -->
            <line ref="cordLine" x1="145" y1="165" x2="145" y2="235" stroke="#94a3b8" stroke-dasharray="0 9" stroke-width="5.5" stroke-linecap="round" />
            <g ref="cordKnob" cursor="pointer" @mousedown="onStartDrag" @touchstart="onStartDrag" @click="handleDirectClick">
              <circle cx="145" cy="235" r="22" fill="transparent" />
              <circle cx="145" cy="227" r="4.5" fill="url(#metalGradVue)" stroke="rgba(0,0,0,0.15)" stroke-width="0.5" />
              <rect x="139" y="230" width="12" height="20" rx="2" fill="url(#metalGradVue)" stroke="rgba(0,0,0,0.2)" stroke-width="0.5" />
              <line x1="139.5" y1="234" x2="150.5" y2="234" stroke="rgba(0,0,0,0.25)" stroke-width="0.8" />
              <line x1="139.5" y1="238" x2="150.5" y2="238" stroke="rgba(0,0,0,0.25)" stroke-width="0.8" />
              <line x1="139.5" y1="242" x2="150.5" y2="242" stroke="rgba(0,0,0,0.25)" stroke-width="0.8" />
              <line x1="139.5" y1="246" x2="150.5" y2="246" stroke="rgba(0,0,0,0.25)" stroke-width="0.8" />
              <path d="M 137 250 L 153 250 L 150 256 L 140 256 Z" fill="url(#metalGradVue)" stroke="rgba(0,0,0,0.2)" stroke-width="0.5" />
              <circle cx="145" cy="256" r="4" fill="url(#metalGradVue)" stroke="rgba(0,0,0,0.2)" stroke-width="0.5" />
            </g>
          </g>
        </svg>
        <div class="lamp-hint">Kéo dây công tắc để bật đèn! 💡</div>
      </div>

      <!-- --- LOGIN FORM SECTION --- -->
      <div class="form-section" id="form-container">
        
        <form v-if="!successMode" @submit.prevent="handleSubmit" id="login-form">
          <h2 class="form-title">Đăng Nhập</h2>
          
          <div class="input-group">
            <input v-model="username" type="text" class="form-input" placeholder="Tên đăng nhập" required autocomplete="off" />
            <svg class="input-icon" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>

          <div class="input-group">
            <input v-model="password" type="password" class="form-input" placeholder="Mật khẩu" required />
            <svg class="input-icon" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="!isLoading">Đăng Nhập</span>
            <span v-else class="spinner"></span>
          </button>
        </form>

        <div v-else class="success-message">
          <svg class="success-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="#42b883" stroke-width="2"/>
            <path d="M8 12l3 3 5-5" fill="none" stroke="#42b883" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="success-text">
            <h3>Thành Công!</h3>
            <p>Chào mừng Ní đã đăng nhập! 🎉</p>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* --- PAGE WRAPPER & THEME STATE --- */
.login-page-body {
  --bg-dark: #070709;
  --bg-dark-illuminated: #0f0f13;
  --lamp-off: #32323a;
  --lamp-on: #fff1b8;
  --accent-color: #ff9f1c;
  --text-muted: #64748b;
  --text-light: #f1f5f9;
  --transition-slow: 0.65s cubic-bezier(0.25, 1, 0.25, 1);
  --transition-medium: 0.3s ease;

  width: 100vw;
  min-height: 100vh;
  background: var(--bg-dark);
  color: var(--text-light);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow-x: hidden;
  position: relative;
  transition: background var(--transition-slow);
}

.login-page-body.light-on {
  background: var(--bg-dark-illuminated);
}

/* --- LAYOUT CONTAINER (GRID SYSTEM - LAMP TOP, FORM BOTTOM) --- */
.app-container {
  display: grid;
  grid-template-rows: auto auto;
  justify-items: center;
  align-content: center;
  gap: 20px;
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 30px 24px;
  position: relative;
  z-index: 5;
}

/* --- LAMP CONTAINER --- */
.lamp-section {
  position: relative;
  width: 280px;
  height: 300px;
  display: flex;
  justify-content: center;
  z-index: 10;
}

.lamp-svg {
  overflow: visible;
  width: 100%;
  height: 100%;
}

/* --- DYNAMIC LIGHT DIFFUSION (WIDE-SCREEN FIX) --- */
.light-cone {
  position: absolute;
  top: 155px;
  left: 50%;
  transform: translateX(-50%);
  width: 190vw;
  height: 170vh;
  background: radial-gradient(ellipse at top center, rgba(255, 235, 150, 0.42) 0%, rgba(255, 235, 150, 0.16) 32%, rgba(255, 235, 150, 0) 72%);
  clip-path: ellipse(48% 44% at 50% 0%);
  filter: blur(44px);
  opacity: 0;
  pointer-events: none;
  z-index: -1;
  transform-origin: top center;
  transition: opacity var(--transition-slow);
}

.ambient-glow {
  position: absolute;
  top: 150px;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140vw;
  height: 140vw;
  background: radial-gradient(circle, rgba(255, 235, 150, 0.16) 0%, rgba(255, 235, 150, 0.055) 46%, rgba(0, 0, 0, 0) 72%);
  filter: blur(60px);
  opacity: 0;
  pointer-events: none;
  z-index: -2;
  transition: opacity var(--transition-slow);
}

.light-on .light-cone,
.light-on .ambient-glow {
  opacity: 1;
}

/* --- SVG STYLE MAPPINGS --- */
.lamp-shade {
  fill: var(--lamp-off);
  transition: fill var(--transition-slow), filter var(--transition-slow);
  filter: none;
}

.lamp-shade-rim {
  fill: #222228;
  transition: fill var(--transition-slow), filter var(--transition-slow);
  filter: none;
}

.lamp-bulb {
  fill: #4c4c54;
  transition: fill var(--transition-slow), filter var(--transition-slow);
  filter: none;
}

.bulb-glow-group {
  opacity: 0;
  transition: opacity var(--transition-slow);
  pointer-events: none;
}

.eye-closed {
  stroke: #121216;
  stroke-width: 3.5;
  stroke-linecap: round;
  fill: none;
  transition: opacity var(--transition-medium);
}

.eyes-open-group {
  opacity: 0;
  transition: opacity var(--transition-medium);
}

.blush-cheeks {
  opacity: 0;
  transition: opacity var(--transition-slow);
  pointer-events: none;
}

.tongue {
  opacity: 0;
  transform-origin: 100px 140px;
  transition: opacity var(--transition-slow);
}

.wink-eye {
  display: none;
  stroke: #1a1a24;
  stroke-width: 4.2;
  stroke-linecap: round;
  fill: none;
}

/* Theme shift states */
.light-on .lamp-shade {
  fill: var(--lamp-on);
  filter: none;
}

.light-on .lamp-shade-rim {
  fill: #ffe894;
  filter: none;
}

.light-on .lamp-bulb {
  fill: #ffffff;
  filter: none;
}

.light-on .bulb-glow-group {
  opacity: 1;
}

.light-on .eyes-closed-group {
  opacity: 0;
}

.light-on .eyes-open-group {
  opacity: 1;
}

.light-on .blush-cheeks {
  opacity: 0.75;
}

.light-on .tongue {
  opacity: 1;
  animation: tongueWiggle 0.4s infinite alternate ease-in-out;
}

@keyframes tongueWiggle {
  0% { transform: rotate(-5deg) scaleY(1); }
  100% { transform: rotate(5deg) scaleY(1.18); }
}

/* Success mode wink */
.success-mode .eye-open-right {
  display: none;
}

.success-mode .wink-eye {
  display: block;
}

/* --- ADVANCED GLASSMORPHISM LOGIN CARD --- */
.form-section {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.005);
  border: 1px solid rgba(255, 255, 255, 0.015);
  border-radius: 28px;
  padding: 40px 32px;
  opacity: 0.01;
  transform: translateY(30px);
  pointer-events: none;
  transition: 
    opacity var(--transition-slow), 
    transform var(--transition-slow), 
    background var(--transition-slow),
    border var(--transition-slow),
    box-shadow var(--transition-slow);
}

.light-on .form-section {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
  background: rgba(255, 255, 255, 0.045);
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    inset 0 -1px 3px rgba(0, 0, 0, 0.4),
    0 24px 50px rgba(0, 0, 0, 0.45),
    0 0 80px rgba(255, 235, 150, 0.05);
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 28px;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.input-group {
  position: relative;
  margin-bottom: 22px;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  fill: var(--text-muted);
  transition: fill var(--transition-medium);
  pointer-events: none;
}

.form-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.035);
  border: 1.5px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  padding: 15px 18px 15px 48px;
  color: #ffffff;
  font-family: var(--font-family);
  font-size: 15px;
  outline: none;
  transition: 
    border-color var(--transition-medium),
    background-color var(--transition-medium),
    box-shadow var(--transition-medium);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-input:focus {
  border-color: rgba(255, 235, 150, 0.7);
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 0 0 4px rgba(255, 235, 150, 0.15);
}

.form-input:focus + .input-icon {
  fill: rgba(255, 235, 150, 0.75);
}

.submit-btn {
  width: 100%;
  background: linear-gradient(135deg, var(--accent-color) 0%, #f77f00 100%);
  border: none;
  border-radius: 16px;
  padding: 16px;
  color: #050507;
  font-family: var(--font-family);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 
    transform var(--transition-medium),
    box-shadow var(--transition-medium);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 159, 28, 0.45);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(5, 5, 7, 0.25);
  border-radius: 50%;
  border-top-color: #050507;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.lamp-hint {
  position: absolute;
  bottom: -65px;
  left: 0;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  opacity: 0.85;
  pointer-events: none;
  animation: pulseHint 2s infinite alternate ease-in-out;
  transition: opacity var(--transition-medium);
  text-align: center;
}

.light-on .lamp-hint {
  opacity: 0;
}

@keyframes pulseHint {
  0% { transform: translateY(0); opacity: 0.45; }
  100% { transform: translateY(-5px); opacity: 0.95; }
}

.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 18px;
  animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}

.success-icon {
  width: 64px;
  height: 64px;
  fill: #42b883;
}

.success-text h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 6px;
  background: linear-gradient(135deg, #ffffff 0%, #a7f3d0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.success-text p {
  font-size: 15px;
  color: var(--text-muted);
}
</style>
