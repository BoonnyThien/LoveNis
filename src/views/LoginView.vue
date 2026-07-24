<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const lightOn = ref(false)
const successMode = ref(false)
const username = ref('')
const password = ref('')
const isLoading = ref(false)
const showUsername = ref(false)
const showPassword = ref(false)

// --- MULTI-PIN AUTH STATE ---
const authError = ref(false)
const authLevel = ref<'vault' | 'master' | 'access' | 'blossom' | 'heart' | 'love' | 'particle' | 'world' | 'opengift' | 'giftfall' | 'hightline' | 'snowballgame' | 'snowball' | null>(null)
const errorMessage = ref('')
let shakeTimeout: number | null = null

// --- AUTH CONFIGURATION ---
// master  (ô trên) = override tuyệt đối → heartvortex
// access  (ô dưới) = mặc định → happynewyear
// blossom (ô dưới) = Hoa đào 3D → /blossom  🌸
// heart   (ô dưới) = Dear Sun → /heartoflove  ❤️
// love    (ô dưới) = Love Animation → /loveanimation  💜
const AUTH_CONFIG = {
  vaultCode: '52013',
  masterCode: '52014',
  accessCode: '13149',
  blossomCode: '33445',
  heartCode: '52406',
  loveCode: '53014',
  particleCode: '52099', // 我爱你久久
  worldCode: '20001',
  opengiftCode: '20002',
  giftfallCode: '20003',
  hightlineCode: '20004',
  snowballgameCode: '20005',
  snowballCode: '20006',
  redirects: {
    vault: '/vault',
    master: '/heartvortex',
    access: '/happynewyear',
    blossom: '/blossom',
    heart: '/heartoflove',
    love: '/loveanimation',
    particle: '/particleheart',
    world: '/world',
    opengift: '/opengift',
    giftfall: '/giftfall',
    hightline: '/hightlinetext',
    snowballgame: '/snowballgame',
    snowball: '/snowball'
  }
}

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

// Error buzz sound synthesis
function playErrorSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch (err) { /* ignore */ }
}

function handleSubmit() {
  // Clear previous error state
  authError.value = false
  authLevel.value = null
  isLoading.value = true

  setTimeout(() => {
    const masterValue = username.value.trim()
    const accessValue = password.value.trim()

    // --- RULE 1: Master code (top) has ABSOLUTE priority ---
    if (masterValue === AUTH_CONFIG.masterCode) {
      authLevel.value = 'master'
      successMode.value = true
      isLoading.value = false

      // Lamp turns cyan/gold for master
      vy = -35
      if (animationFrameId === null) {
        animationFrameId = requestAnimationFrame(updateSpring)
      }

      setTimeout(() => {
        router.push(AUTH_CONFIG.redirects.master)
      }, 1500)
      return
    }

    // --- RULE 2: Access code → Happy New Year ---
    if (accessValue === AUTH_CONFIG.accessCode) {
      authLevel.value = 'access'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.access) }, 1500)
      return
    }

    // --- RULE NEW: Vault Code → Memory Vault ---
    if (accessValue === AUTH_CONFIG.vaultCode) {
      authLevel.value = 'vault'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.vault) }, 1500)
      return
    }

    // --- RULE 3: Blossom → Hoa đào 3D 🌸 ---
    if (accessValue === AUTH_CONFIG.blossomCode) {
      authLevel.value = 'blossom'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.blossom) }, 1500)
      return
    }

    // --- RULE 4: Heart → Dear Sun ❤️ ---
    if (accessValue === AUTH_CONFIG.heartCode) {
      authLevel.value = 'heart'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.heart) }, 1500)
      return
    }

    // --- RULE 5: Love Animation 💜 ---
    if (accessValue === AUTH_CONFIG.loveCode) {
      authLevel.value = 'love'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.love) }, 1500)
      return
    }

    // --- RULE 6: Particle Heart ❤️‍🔥 ---
    if (accessValue === AUTH_CONFIG.particleCode) {
      authLevel.value = 'particle'
      successMode.value = true
      isLoading.value = false
      vy = -35
      if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
      setTimeout(() => { router.push(AUTH_CONFIG.redirects.particle) }, 1500)
      return
    }

    // --- RULE 7: EXTRA ROUTES ---
    const extraRoutes = [
      { code: AUTH_CONFIG.worldCode, level: 'world', path: AUTH_CONFIG.redirects.world },
      { code: AUTH_CONFIG.opengiftCode, level: 'opengift', path: AUTH_CONFIG.redirects.opengift },
      { code: AUTH_CONFIG.giftfallCode, level: 'giftfall', path: AUTH_CONFIG.redirects.giftfall },
      { code: AUTH_CONFIG.hightlineCode, level: 'hightline', path: AUTH_CONFIG.redirects.hightline },
      { code: AUTH_CONFIG.snowballgameCode, level: 'snowballgame', path: AUTH_CONFIG.redirects.snowballgame },
      { code: AUTH_CONFIG.snowballCode, level: 'snowball', path: AUTH_CONFIG.redirects.snowball }
    ]

    for (const route of extraRoutes) {
      if (accessValue === route.code) {
        authLevel.value = route.level as any
        successMode.value = true
        isLoading.value = false
        vy = -35
        if (animationFrameId === null) animationFrameId = requestAnimationFrame(updateSpring)
        setTimeout(() => { router.push(route.path) }, 1500)
        return
      }
    }

    // --- RULE 7: Tất cả đều sai → ERROR ---
    isLoading.value = false
    authError.value = true
    errorMessage.value = 'Sai thông tin đăng nhập'
    playErrorSound()
    if (shakeTimeout) clearTimeout(shakeTimeout)
    shakeTimeout = window.setTimeout(() => {
      authError.value = false
    }, 3000)
  }, 900)
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
  <div class="login-page-body" :class="{ 'light-on': lightOn, 'success-mode': successMode, 'error-mode': authError, 'vault-mode': authLevel === 'vault', 'master-mode': authLevel === 'master', 'access-mode': authLevel === 'access', 'blossom-mode': authLevel === 'blossom', 'heart-mode': authLevel === 'heart', 'love-mode': authLevel === 'love', 'particle-mode': authLevel === 'particle', 'world-mode': authLevel === 'world', 'opengift-mode': authLevel === 'opengift', 'giftfall-mode': authLevel === 'giftfall', 'hightline-mode': authLevel === 'hightline', 'snowballgame-mode': authLevel === 'snowballgame', 'snowball-mode': authLevel === 'snowball' }">
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

            <!-- Physical Light Bulb (Semi-exposed) -->
            <circle class="lamp-bulb" cx="100" cy="172" r="22" />

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
        
        <form v-if="!successMode" @submit.prevent="handleSubmit" id="login-form" :class="{ 'shake': authError }">
          <h2 class="form-title">Đăng Nhập</h2>
          
          <!-- TOP: Master Override Code (disguised as username) -->
          <div class="input-group">
            <input v-model="username" :type="showUsername ? 'text' : 'password'" inputmode="numeric" pattern="[0-9]*" maxlength="5" class="form-input" placeholder="Tên đăng nhập" autocomplete="off" />
            <svg class="input-icon" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <button type="button" class="toggle-password" @click="showUsername = !showUsername">
              <svg v-if="!showUsername" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
            </button>
          </div>

          <!-- BOTTOM: Access Code (disguised as password) -->
          <div class="input-group">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" inputmode="numeric" pattern="[0-9]*" maxlength="5" class="form-input" placeholder="Mật khẩu" required />
            <svg class="input-icon" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>
            </button>
          </div>

          <!-- Error feedback -->
          <div class="auth-feedback" :class="{ 'visible': authError }">
            <span class="feedback-icon">⚠️</span>
            <span class="feedback-text">{{ errorMessage }}</span>
          </div>

          <button type="submit" class="submit-btn" :disabled="isLoading">
            <span v-if="!isLoading">Đăng Nhập</span>
            <span v-else class="spinner"></span>
          </button>
        </form>

        <div v-else class="success-message">
          <svg class="success-icon" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" :stroke="authLevel === 'master' ? '#00d4ff' : '#d49a2a'" stroke-width="2"/>
            <path d="M8 12l3 3 5-5" fill="none" :stroke="authLevel === 'master' ? '#00d4ff' : '#d49a2a'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="success-text">
            <h3>{{ authLevel === 'master' ? '✨ Master Access ✨' : 'Thành Công!' }}</h3>
            <p>{{ authLevel === 'master' ? 'Chào mừng trở lại, chủ nhân! 👑' : (authLevel === 'vault' ? 'Khởi động Memory Vault...' : 'Chào mừng Ní đã đăng nhập! 🎉') }}</p>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* --- PAGE WRAPPER & THEME STATE --- */
.login-page-body {
  --bg-dark: #020617;
  --bg-dark-illuminated: #0F172A;
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
  overflow: hidden;
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
  gap: 15px;
  width: 100%;
  max-width: 440px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px 16px;
  position: relative;
  z-index: 5;
}

@media (max-width: 480px) {
  .app-container {
    gap: 10px;
    padding: 10px;
  }
}

/* --- LAMP CONTAINER --- */
.lamp-section {
  position: relative;
  width: 260px;
  height: 280px;
  display: flex;
  justify-content: center;
  z-index: 10;
}

@media (max-width: 480px) {
  .lamp-section {
    width: 220px;
    height: 240px;
  }
}

.lamp-svg {
  overflow: visible;
  width: 100%;
  height: 100%;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
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
  background: radial-gradient(circle, rgba(253, 224, 71, 0.25) 0%, rgba(253, 224, 71, 0.05) 46%, transparent 72%);
  filter: blur(70px);
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

@media (max-width: 480px) {
  .form-section {
    padding: 24px 20px;
  }
}

.light-on .form-section {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

/* Tăng cường độ tương phản text khi đèn bật */
.light-on .form-title {
  background: none;
  -webkit-text-fill-color: initial;
  color: #fffbeb;
  font-weight: 800;
  text-shadow: 0 0 10px rgba(255, 235, 150, 0.5);
}

.light-on .form-input {
  color: #E2E8F0;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  box-shadow: none;
}

.light-on .form-input::placeholder {
  color: #E2E8F0;
  opacity: 0.7;
  font-weight: normal;
}

.light-on .input-icon {
  fill: #E2E8F0;
}

.light-on .form-input:focus {
  background: rgba(0, 0, 0, 0.4);
  outline: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.light-on .form-input:focus + .input-icon {
  fill: #fffbeb;
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
  padding: 15px 48px 15px 48px;
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

.toggle-password {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.4);
  transition: color var(--transition-medium);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: rgba(255, 255, 255, 0.8);
}

.light-on .toggle-password {
  color: #64748b;
}

.light-on .toggle-password:hover {
  color: #fffbeb;
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
  animation: none;
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

/* =============================================================================
 * AUTH VISUAL FEEDBACK — LAMP COLOR CHANGES
 * ============================================================================= */

/* --- ERROR MODE: Lamp turns RED --- */
.error-mode.light-on .lamp-shade {
  fill: #ff4757 !important;
  filter: drop-shadow(0 0 20px rgba(255, 71, 87, 0.6)) !important;
}

.error-mode.light-on .lamp-shade-rim {
  fill: #ff6b81 !important;
  filter: drop-shadow(0 0 12px rgba(255, 71, 87, 0.5)) !important;
}

.error-mode.light-on .lamp-bulb {
  fill: #ff4757 !important;
  filter: drop-shadow(0 0 15px rgba(255, 71, 87, 0.8)) !important;
}

.error-mode .light-cone {
  background: radial-gradient(ellipse at top center, rgba(255, 71, 87, 0.35) 0%, rgba(255, 71, 87, 0.12) 35%, rgba(255, 71, 87, 0) 72%) !important;
}

.error-mode .ambient-glow {
  background: radial-gradient(circle, rgba(255, 71, 87, 0.18) 0%, rgba(255, 71, 87, 0.05) 50%, rgba(0, 0, 0, 0) 70%) !important;
}

.error-mode.light-on .blush-cheeks ellipse {
  fill: #ff4757 !important;
}

/* --- MASTER MODE: Lamp turns CYAN/GOLD --- */
.master-mode.light-on .lamp-shade {
  fill: #00d4ff !important;
  filter: drop-shadow(0 0 25px rgba(0, 212, 255, 0.7)) !important;
}

.master-mode.light-on .lamp-shade-rim {
  fill: #7df9ff !important;
  filter: drop-shadow(0 0 15px rgba(0, 212, 255, 0.6)) !important;
}

.master-mode.light-on .lamp-bulb {
  fill: #e0f7ff !important;
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.9)) !important;
}

.master-mode .light-cone {
  background: radial-gradient(ellipse at top center, rgba(0, 212, 255, 0.35) 0%, rgba(0, 212, 255, 0.12) 35%, rgba(0, 212, 255, 0) 72%) !important;
}

.master-mode .ambient-glow {
  background: radial-gradient(circle, rgba(0, 212, 255, 0.18) 0%, rgba(0, 212, 255, 0.05) 50%, rgba(0, 0, 0, 0) 70%) !important;
}

.master-mode.light-on .blush-cheeks ellipse {
  fill: #00d4ff !important;
}

/* --- ACCESS MODE: Lamp turns GREEN --- */
.access-mode.light-on .lamp-shade {
  fill: #42b883 !important;
  filter: drop-shadow(0 0 25px rgba(66, 184, 131, 0.7)) !important;
}

.access-mode.light-on .lamp-shade-rim {
  fill: #68d391 !important;
  filter: drop-shadow(0 0 15px rgba(66, 184, 131, 0.6)) !important;
}

.access-mode.light-on .lamp-bulb {
  fill: #e6fffa !important;
  filter: drop-shadow(0 0 20px rgba(66, 184, 131, 0.9)) !important;
}

.access-mode .light-cone {
  background: radial-gradient(ellipse at top center, rgba(66, 184, 131, 0.35) 0%, rgba(66, 184, 131, 0.12) 35%, rgba(66, 184, 131, 0) 72%) !important;
}

.access-mode .ambient-glow {
  background: radial-gradient(circle, rgba(66, 184, 131, 0.18) 0%, rgba(66, 184, 131, 0.05) 50%, rgba(0, 0, 0, 0) 70%) !important;
}

.access-mode.light-on .blush-cheeks ellipse {
  fill: #42b883 !important;
}

/* --- FORM SHAKE ANIMATION --- */
@keyframes shakeForm {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-8px); }
  20% { transform: translateX(8px); }
  30% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  50% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  70% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

form.shake {
  animation: shakeForm 0.6s ease-out;
}

/* --- ERROR FEEDBACK BAR --- */
.auth-feedback {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  margin-bottom: 0;
  border-radius: 12px;
  background: rgba(255, 71, 87, 0.08);
  border: 1px solid rgba(255, 71, 87, 0.2);
  color: #ff4757;
  font-size: 13px;
  font-weight: 500;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.35s ease, max-height 0.35s ease, margin 0.35s ease, padding 0.35s ease;
}

.auth-feedback.visible {
  opacity: 1;
  max-height: 60px;
  margin-bottom: 16px;
  padding: 10px 14px;
}

.light-on .auth-feedback.visible {
  background: rgba(255, 71, 87, 0.12);
  border-color: rgba(255, 71, 87, 0.3);
  color: #d63031;
}

.feedback-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.feedback-text {
  line-height: 1.3;
}

/* =====================================================
   MÀU ĐÈN CHO TỪNG MÃ PIN — 3 DỰ ÁN MỚI
   ===================================================== */

/* 🌸 BLOSSOM MODE — Hoa đào (hồng phấn + tím nhạt) */
.blossom-mode.light-on .lamp-shade {
  fill: #ffaacc;
  filter: drop-shadow(0 0 28px rgba(255, 150, 200, 0.8));
}
.blossom-mode.light-on .lamp-shade-rim {
  fill: #ff77aa;
  filter: drop-shadow(0 0 12px rgba(255, 100, 170, 0.6));
}
.blossom-mode.light-on .lamp-bulb {
  fill: #fff0f5;
  filter: drop-shadow(0 0 18px rgba(255, 150, 200, 0.9));
}
.blossom-mode.light-on .light-cone {
  background: radial-gradient(ellipse at top center, rgba(255, 150, 200, 0.42) 0%, rgba(255, 150, 200, 0.16) 32%, rgba(255, 150, 200, 0) 72%);
}
.blossom-mode.light-on .ambient-glow {
  background: radial-gradient(circle, rgba(255, 150, 200, 0.18) 0%, rgba(255, 150, 200, 0.06) 46%, rgba(0, 0, 0, 0) 72%);
}
.blossom-mode.success-mode .success-icon circle { stroke: #ff77aa; }
.blossom-mode.success-mode .success-icon path { stroke: #ff77aa; }

/* ❤️ HEART MODE — Dear Sun (đỏ hồng rực rỡ) */
.heart-mode.light-on .lamp-shade {
  fill: #ff6b9d;
  filter: drop-shadow(0 0 30px rgba(255, 80, 140, 0.85));
}
.heart-mode.light-on .lamp-shade-rim {
  fill: #e0255a;
  filter: drop-shadow(0 0 14px rgba(220, 30, 80, 0.7));
}
.heart-mode.light-on .lamp-bulb {
  fill: #fff0f3;
  filter: drop-shadow(0 0 20px rgba(255, 80, 130, 0.9));
}
.heart-mode.light-on .light-cone {
  background: radial-gradient(ellipse at top center, rgba(255, 80, 130, 0.4) 0%, rgba(255, 80, 130, 0.14) 32%, rgba(255, 80, 130, 0) 72%);
}
.heart-mode.light-on .ambient-glow {
  background: radial-gradient(circle, rgba(255, 80, 130, 0.18) 0%, rgba(255, 80, 130, 0.06) 46%, rgba(0, 0, 0, 0) 72%);
}
.heart-mode.success-mode .success-icon circle { stroke: #ff6b9d; }
.heart-mode.success-mode .success-icon path { stroke: #ff6b9d; }

/* 💜 LOVE MODE — Love Animation (tím lavender huyền bí) */
.love-mode.light-on .lamp-shade {
  fill: #c084fc;
  filter: drop-shadow(0 0 30px rgba(180, 100, 255, 0.85));
}
.love-mode.light-on .lamp-shade-rim {
  fill: #9333ea;
  filter: drop-shadow(0 0 14px rgba(150, 50, 230, 0.7));
}
.love-mode.light-on .lamp-bulb {
  fill: #faf5ff;
  filter: drop-shadow(0 0 20px rgba(180, 100, 255, 0.9));
}
.love-mode.light-on .light-cone {
  background: radial-gradient(ellipse at top center, rgba(180, 100, 255, 0.4) 0%, rgba(180, 100, 255, 0.14) 32%, rgba(180, 100, 255, 0) 72%);
}
.love-mode.light-on .ambient-glow {
  background: radial-gradient(circle, rgba(180, 100, 255, 0.18) 0%, rgba(180, 100, 255, 0.06) 46%, rgba(0, 0, 0, 0) 72%);
}
.love-mode.success-mode .success-icon circle { stroke: #c084fc; }
.love-mode.success-mode .success-icon path { stroke: #c084fc; }

/* 🔥 PARTICLE MODE — Particle Heart (đỏ cam rực rỡ) */
.particle-mode.light-on .lamp-shade {
  fill: #ff1744;
  filter: drop-shadow(0 0 30px rgba(255, 23, 68, 0.85));
}
.particle-mode.light-on .lamp-shade-rim {
  fill: #d50000;
  filter: drop-shadow(0 0 14px rgba(213, 0, 0, 0.7));
}
.particle-mode.light-on .lamp-bulb {
  fill: #ffebee;
  filter: drop-shadow(0 0 20px rgba(255, 23, 68, 0.9));
}
.particle-mode.light-on .light-cone {
  background: radial-gradient(ellipse at top center, rgba(255, 23, 68, 0.4) 0%, rgba(255, 23, 68, 0.14) 32%, rgba(255, 23, 68, 0) 72%);
}
.particle-mode.light-on .ambient-glow {
  background: radial-gradient(circle, rgba(255, 23, 68, 0.18) 0%, rgba(255, 23, 68, 0.06) 46%, rgba(0, 0, 0, 0) 72%);
}
.particle-mode.success-mode .success-icon circle { stroke: #ff1744; }
.particle-mode.success-mode .success-icon path { stroke: #ff1744; }

/* 🌍 EXTRA MODES: world, opengift, giftfall, hightline, snowballgame, snowball */
.world-mode.light-on .lamp-shade { fill: #3498db; }
.opengift-mode.light-on .lamp-shade { fill: #e67e22; }
.giftfall-mode.light-on .lamp-shade { fill: #f1c40f; }
.hightline-mode.light-on .lamp-shade { fill: #2ecc71; }
.snowballgame-mode.light-on .lamp-shade { fill: #9b59b6; }
.snowball-mode.light-on .lamp-shade { fill: #ecf0f1; }
</style>

