<script setup lang="ts">
import { reactive, shallowRef, watch } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { Vector3, MathUtils } from 'three'
import { 
  MouseParallax, 
  ContactShadows, 
  Precipitation,
  Box,
  OrbitControls 
} from '@tresjs/cientos'

// --- CẤU HÌNH ---
const GAME_CONFIG = {
  gravity: 0.05,
  spawnRate: 0.03,
  playerY: -3.5,
  limitX: 5.5,
  gameDuration: 30,
  colors: {
    gift: '#00ffcc', 
    bomb: '#ff3333',
    player: '#ff00ff'
  }
}

// --- STATE ---
const gameState = reactive({
  isPlaying: true,
  isTransitioning: false, // Biến trạng thái khi đang lùi camera
  timeLeft: GAME_CONFIG.gameDuration,
  score: 0,
  highScore: 0,
  combo: 0
})

const player = reactive({ x: 0, width: 1.8 })
const items = reactive<any[]>([])
const cameraRef = shallowRef()
const controlsRef = shallowRef() // Tham chiếu đến OrbitControls

// --- LOGIC GAMEPLAY ---
const spawnItem = () => {
  const isBomb = Math.random() < 0.25
  items.push({
    id: Date.now() + Math.random(),
    x: (Math.random() - 0.5) * GAME_CONFIG.limitX * 1.8,
    y: 8, z: 0,
    speed: Math.random() * 0.05 + 0.03,
    type: isBomb ? 'bomb' : 'gift',
    color: isBomb ? GAME_CONFIG.colors.bomb : GAME_CONFIG.colors.gift,
    rotationSpeed: Math.random() * 0.1
  })
}

const updatePlayerPosition = (event: MouseEvent | TouchEvent) => {
  if (!gameState.isPlaying) return // Khoá di chuyển giỏ khi hết game

  let clientX
  if (event.type.startsWith('touch')) {
    clientX = (event as TouchEvent).touches[0].clientX
  } else {
    clientX = (event as MouseEvent).clientX
  }
  const ndcX = (clientX / window.innerWidth) * 2 - 1
  player.x = Math.max(-(GAME_CONFIG.limitX - 0.5), Math.min(GAME_CONFIG.limitX - 0.5, ndcX * GAME_CONFIG.limitX))
}

// --- HÀM RESTART (XỬ LÝ CAMERA LOGIC) ---
const restart = () => {
    // 1. Reset thông số game
    gameState.score = 0
    gameState.combo = 0
    gameState.timeLeft = GAME_CONFIG.gameDuration
    gameState.isPlaying = true
    gameState.isTransitioning = false
    items.length = 0 
    
    // 2. RESET CAMERA VỀ VỊ TRÍ CHƠI (Quan trọng)
    if(cameraRef.value) {
        // Đặt cứng lại vị trí bắt đầu
        cameraRef.value.position.set(0, 2, 12)
        cameraRef.value.lookAt(0, 0, 0)
        
        // Reset rotation của camera để không bị lệch do OrbitControls cũ để lại
        cameraRef.value.rotation.set(0, 0, 0)
    }
}

// --- GAME LOOP ---
const { onLoop } = useRenderLoop()

onLoop(({ delta, elapsed }) => {
  // A. KHI ĐANG CHƠI
  if (gameState.isPlaying) {
    gameState.timeLeft -= delta
    if (gameState.timeLeft <= 0) {
      gameState.timeLeft = 0
      gameState.isPlaying = false
      gameState.isTransitioning = true // Bắt đầu hiệu ứng lùi camera
    }
    
    // Logic spawn & rơi đồ...
    if (Math.random() < GAME_CONFIG.spawnRate) spawnItem()
    
    // Logic vật lý...
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i]
        item.y -= (GAME_CONFIG.gravity + item.speed)
        // ... (Giữ nguyên logic va chạm cũ)
        const distY = Math.abs(item.y - GAME_CONFIG.playerY)
        const distX = Math.abs(item.x - player.x)

        if (distY < 0.6 && distX < player.width / 2 + 0.3) {
            if (item.type === 'gift') {
                gameState.combo++
                gameState.score += 100 + (gameState.combo * 20)
            } else {
                gameState.combo = 0
                gameState.score = Math.max(0, gameState.score - 500)
            }
            items.splice(i, 1)
            continue
        }
        if (item.y < -5) {
            if (item.type === 'gift') gameState.combo = 0
            items.splice(i, 1)
        }
    }
  } 
  
  // B. KHI HẾT GIỜ (Hiệu ứng lùi Camera)
  else if (gameState.isTransitioning && cameraRef.value) {
      // Lerp lùi camera ra xa
      const targetZ = 20
      const targetY = 8
      
      // Di chuyển mượt
      cameraRef.value.position.z = MathUtils.lerp(cameraRef.value.position.z, targetZ, delta * 2)
      cameraRef.value.position.y = MathUtils.lerp(cameraRef.value.position.y, targetY, delta * 2)
      cameraRef.value.lookAt(0, 0, 0)

      // Nếu đã lùi đủ xa, tắt chế độ transition -> Bật OrbitControls
      if (Math.abs(cameraRef.value.position.z - targetZ) < 0.5) {
          gameState.isTransitioning = false
          // Lúc này v-if của OrbitControls sẽ hoạt động
      }
  }
})
</script>

<template>
  <div class="game-wrapper" @mousemove="updatePlayerPosition" @touchmove="updatePlayerPosition">
    
    <div class="ui-layer">
      <div class="top-bar">
        <div class="score-box">
            <span class="value">{{ Math.floor(gameState.score) }}</span>
            <span class="label">SCORE</span>
        </div>
        <div class="timer-box" :class="{ 'danger': gameState.timeLeft < 5 }">
            {{ Math.ceil(gameState.timeLeft) }}
        </div>
      </div>

      <div v-if="gameState.combo > 1" class="combo-text">
        x{{ gameState.combo }}
      </div>

      <transition name="fade">
        <div v-if="!gameState.isPlaying" class="restart-panel">
            <div class="result-text">GAME OVER</div>
            <button class="btn-restart" @click="restart">
                ↺ PLAY AGAIN
            </button>
            <p class="hint">Free look enabled</p>
        </div>
      </transition>
    </div>

    <TresCanvas window-size clear-color="#111">
      <TresPerspectiveCamera 
        ref="cameraRef" 
        :position="[0, 2, 12]" 
        :look-at="[0, 0, 0]" 
      />

      <OrbitControls 
        v-if="!gameState.isPlaying && !gameState.isTransitioning" 
        ref="controlsRef"
        make-default
        :enable-pan="true"
        :enable-zoom="true"
        :min-distance="5"
        :max-distance="50"
      />
      
      <MouseParallax v-if="gameState.isPlaying" :factor="1" :ease="2" />

      <TresAmbientLight :intensity="2" />
      <TresDirectionalLight :position="[5, 10, 5]" :intensity="1" />

      <TresGroup :position="[player.x, GAME_CONFIG.playerY, 0]">
        <Box :args="[player.width, 0.5, 1]">
            <TresMeshBasicMaterial :color="GAME_CONFIG.colors.player" />
            <TresLineSegments>
                <TresEdgesGeometry />
                <TresLineBasicMaterial color="white" />
            </TresLineSegments>
        </Box>
      </TresGroup>

      <TresGroup>
        <TresMesh v-for="item in items" :key="item.id" :position="[item.x, item.y, item.z]" :rotation-x="item.rotationX || 0" :rotation-z="item.rotationZ || 0">
          <TresBoxGeometry v-if="item.type === 'gift'" :args="[0.7, 0.7, 0.7]" />
          <TresIcosahedronGeometry v-else :args="[0.45]" />
          <TresMeshBasicMaterial :color="item.color" />
        </TresMesh>
      </TresGroup>

      <ContactShadows :opacity="0.5" :scale="20" :blur="2" :far="10" :resolution="128" color="#000000" :position="[0, -4.5, 0]" />
      <Precipitation :speed="0.5" :area="[15, 10, 15]" :count="50" :size="0.1" color="#ffffff" />

    </TresCanvas>
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100vw; height: 100vh;
  touch-action: none; cursor: grab; background-color: #000;
  overflow: hidden; font-family: 'Segoe UI', sans-serif; user-select: none;
}
.ui-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none; z-index: 10;
}

/* Score & Timer */
.top-bar { display: flex; justify-content: space-between; padding: 20px; }
.score-box { color: white; display: flex; flex-direction: column; }
.score-box .value { font-size: 2rem; font-weight: 800; text-shadow: 0 0 10px cyan; }
.score-box .label { font-size: 0.7rem; letter-spacing: 2px; opacity: 0.8; }
.timer-box { font-size: 2.5rem; font-weight: 900; color: white; }
.timer-box.danger { color: #ff3333; animation: pulse 0.5s infinite; }

/* Combo */
.combo-text {
    position: absolute; top: 15%; width: 100%; text-align: center;
    font-size: 3rem; font-weight: 900; color: yellow; text-shadow: 2px 2px 0 red;
    transform: rotate(-5deg);
}

/* RESTART PANEL (Góc phải dưới) */
.restart-panel {
    position: absolute; bottom: 30px; right: 30px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    text-align: right;
    pointer-events: auto; /* Để bấm được nút */
}
.result-text { color: white; font-size: 1.2rem; font-weight: bold; margin-bottom: 10px; }
.btn-restart {
    background: #00ffcc; color: black; border: none;
    padding: 10px 20px; font-size: 1rem; font-weight: 800;
    border-radius: 8px; cursor: pointer; text-transform: uppercase;
    box-shadow: 0 0 10px #00ffcc; transition: all 0.2s;
}
.btn-restart:active { transform: scale(0.95); }
.hint { color: #aaa; font-size: 0.8rem; margin-top: 5px; font-style: italic; }

/* Animation */
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>