
<script setup lang="ts">
import { reactive, shallowRef, ref, onMounted, onUnmounted, computed } from 'vue'
import { Vector3, Raycaster, Vector2, Color } from 'three'
import { useRenderLoop } from '@tresjs/core'


// --- CẤU HÌNH ---
const GRAVITY = 0.005
const BAD_TARGET_COUNT = 6
const GOOD_SPAWN_INTERVAL = 30000 // 30s
const ENVIRONMENT_DURATION = 60000 // 60s

// Audio
const clickSound = new Audio('/sounds/click.mp3')

// Danh sách tên
const BAD_NAMES = ['Deadline', 'Kỳ vọng', 'Stress', 'Mệt mỏi', 'So sánh', 'Lo âu']
const GOOD_NAMES = ['Yêu thương', 'Niềm vui', 'Tự do', 'Khích lệ', 'Thư giãn']

// Môi trường
const currentEnv = reactive({ name: 'Bình minh', bg: '#87CEEB', lightIntensity: 1.2 })

const GOOD_THEMES: Record<string, string> = {
  'Yêu thương': '#FF69B4', // Pink
  'Niềm vui': '#FFD700',   // Gold
  'Tự do': '#00BFFF',      // Blue
  'Khích lệ': '#32CD32',   // Green
  'Thư giãn': '#9370DB'    // Purple
}

// Wishes
const currentWish = ref('')
const WISHES = [
  "Chúc bạn một mùa Giáng sinh an lành!",
  "Năm mới tràn đầy niềm vui và hạnh phúc!",
  "Luôn giữ vững niềm tin và hy vọng nhé!",
  "Gửi đến bạn ngàn yêu thương ấm áp!", 
  "May mắn và thành công sẽ đến với bạn!"
]

// Responsive Spawn Range
const spawnRange = reactive({ x: 7, y_min: -5, y_max: 7, z_min: -10, z_max: -25 })

const updateSpawnRange = () => {
  spawnRange.x = window.innerWidth < 768 ? 2.5 : 9
}

onMounted(() => {
  updateSpawnRange()
  window.addEventListener('resize', updateSpawnRange)

  // Wish Interval
  setInterval(() => {
    const wish = WISHES[Math.floor(Math.random() * WISHES.length)]
    currentWish.value = wish
    
    // Hide after 5 seconds
    setTimeout(() => {
      currentWish.value = ''
    }, 5000)
  }, 30000)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateSpawnRange)
})

const cameraRef = shallowRef()
const raycaster = new Raycaster()
const mouse = new Vector2()

// --- STATE QUẢN LÝ GAME ---
const snowCoin = ref(0)
const accumulatedScore = ref(0)
const comboTimeout = ref<any>(null)

// Projectiles
const projectileTypes = [
  { icon: '❄️', name: 'Bóng tuyết', speed: 0.8, gravity: 0.005, damage: 1, radius: 0.2, color: 'white' },
  { icon: '🔔', name: 'Chuông', speed: 1.2, gravity: 0, damage: 1, radius: 0.15, color: '#FFD700' }, 
  { icon: '🎁', name: 'Hộp quà', speed: 1.6, gravity: 0.008, damage: 2, radius: 0.25, color: '#FF69B4' }
]
const currentProjectileIdx = ref(0)
const currentProjectile = computed(() => projectileTypes[currentProjectileIdx.value])

// --- TYPES ---
type TargetType = 'good' | 'bad'
type TargetState = 'alive' | 'dying' | 'respawning'

interface Target {
  id: number
  type: TargetType
  name: string
  x: number; y: number; z: number
  initialX: number; initialY: number
  offset: number
  hp: number
  maxHp: number
  color: string
  state: TargetState
  respawnTime: number
  opacity: number
  scale: number
  glow: number
  shake: number
  screenX: number
  screenY: number
  visible: boolean
}

const targets = reactive<Target[]>([])
const lastGoodSpawnTime = ref(0)

// --- LOGIC TARGET ---
const initTargets = () => {
  for (let i = 0; i < BAD_TARGET_COUNT; i++) {
    createTarget('bad', BAD_NAMES[i % BAD_NAMES.length])
  }
}

const createTarget = (type: TargetType, specificName?: string) => {
  const x = (Math.random() - 0.5) * spawnRange.x * 2
  const y = Math.random() * (spawnRange.y_max - spawnRange.y_min) + spawnRange.y_min
  const z = Math.random() * (spawnRange.z_max - spawnRange.z_min) + spawnRange.z_min

  let name = specificName || ''
  if (type === 'good' && !name) {
    name = GOOD_NAMES[Math.floor(Math.random() * GOOD_NAMES.length)]
  }

  // HP: Bad=4 (để thấy hiệu ứng nứt), Good=1 (chết luôn để hiện text)
  const maxHp = type === 'bad' ? 7 : 1 

  targets.push({
    id: Date.now() + Math.random(),
    type,
    name,
    x, y, z,
    initialX: x, initialY: y,
    offset: Math.random() * 100,
    hp: maxHp,
    maxHp: maxHp,
    color: type === 'bad' ? '#ff4444' : '#44ff44',
    state: 'alive',
    respawnTime: 0,
    opacity: 1,
    scale: 1,
    glow: 0,
    shake: 0,
    screenX: -999,
    screenY: -999,
    visible: false
  })
}

// Logic hồi sinh
const handleTargetRespawn = (t: Target) => {
  if (t.type === 'good') {
    const idx = targets.indexOf(t)
    if (idx > -1) targets.splice(idx, 1)
    return
  }

  const x = (Math.random() - 0.5) * spawnRange.x * 2
  const y = Math.random() * (spawnRange.y_max - spawnRange.y_min) + spawnRange.y_min
  const z = Math.random() * (spawnRange.z_max - spawnRange.z_min) + spawnRange.z_min
  
  t.x = x; t.y = y; t.z = z
  t.initialX = x; t.initialY = y
  t.hp = t.maxHp
  t.state = 'alive'
  t.opacity = 1
  t.scale = 1
  t.glow = 0
  t.shake = 0
  t.color = '#ff4444'
}

initTargets()

// --- BALLS ---
const balls = reactive<{ 
  id: number; 
  x: number; y: number; z: number; 
  vx: number; vy: number; vz: number;
  rx: number; ry: number; rz: number;
  active: boolean;
  typeIdx: number;
}[]>([])

const shoot = (event: MouseEvent | TouchEvent) => {
  if ((event.target as HTMLElement).closest('.ui-layer') || (event.target as HTMLElement).closest('.bottom-ui')) return
  if (!cameraRef.value) return

  // Play Sound
  clickSound.currentTime = 0
  clickSound.play().catch(() => {})

  let clientX, clientY
  if (event.type.startsWith('touch')) {
    clientX = (event as TouchEvent).touches[0].clientX
    clientY = (event as TouchEvent).touches[0].clientY
  } else {
    clientX = (event as MouseEvent).clientX
    clientY = (event as MouseEvent).clientY
  }

  mouse.x = (clientX / window.innerWidth) * 2 - 1
  mouse.y = -(clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, cameraRef.value)
  const dir = raycaster.ray.direction.normalize()
  const startPos = cameraRef.value.position.clone().add(dir.clone().multiplyScalar(1.0))
  
  const proj = currentProjectile.value

  // Init Rotation
  let initialRx = Math.random() * Math.PI
  let initialRy = Math.random() * Math.PI
  
  // Specific rotation for Needle (Type 1) to point forward
  if (currentProjectileIdx.value === 1) {
     initialRx = -Math.PI / 2
     initialRy = 0
  }

  balls.push({
    id: Date.now(),
    x: startPos.x, y: startPos.y, z: startPos.z,
    vx: dir.x * proj.speed, 
    vy: dir.y * proj.speed + 0.05, 
    vz: dir.z * proj.speed,
    rx: initialRx, ry: initialRy, rz: 0,
    active: true,
    typeIdx: currentProjectileIdx.value
  })
}

const handleHit = (event: { targetId: number, damage: number }) => {
  const t = targets.find(target => target.id === event.targetId)
  if (t && t.state === 'alive') {
    t.hp -= event.damage
    if (t.hp <= 0) {
      t.state = 'dying'
      if (t.type === 'bad') {
         addScore(1)
      } else {
         addScore(10) // Good target hit
         changeEnvironment(t.name)
      }
    }
  }
}

const changeEnvironment = (targetName: string) => {
    const color = GOOD_THEMES[targetName]
    if (color) {
      currentEnv.name = targetName
      currentEnv.bg = color
      currentEnv.lightIntensity = 1.0
    }
}

const addScore = (amount: number) => {
  accumulatedScore.value += amount
  if (comboTimeout.value) clearTimeout(comboTimeout.value)
  comboTimeout.value = setTimeout(() => {
    snowCoin.value += accumulatedScore.value
    accumulatedScore.value = 0
  }, 1000)
}

// --- GAME LOOP ---
const { onLoop } = useRenderLoop()

onLoop(({ elapsed, delta }) => {
  const now = Date.now()
  
  // 0. Environment Update (Removed time based)
  /* sessionTime.value += delta
  if (sessionTime.value > (ENVIRONMENT_DURATION / 1000)) {
    sessionTime.value = 0
    currentEnvIndex.value = (currentEnvIndex.value + 1) % ENVIRONMENTS.length
  } */

  // 1. Spawning Good Target
  if (now - lastGoodSpawnTime.value > GOOD_SPAWN_INTERVAL) {
    const hasGood = targets.some(t => t.type === 'good')
    if (!hasGood) {
      createTarget('good')
      lastGoodSpawnTime.value = now
    }
  }

  // A. UPDATE TARGETS
  targets.forEach(t => {
    // Projection 3D -> 2D
    if (cameraRef.value && t.state !== 'respawning') {
      const vec = new Vector3(t.x, t.y + 0.8, t.z)
      vec.project(cameraRef.value)
      t.screenX = (vec.x * 0.5 + 0.5) * window.innerWidth
      t.screenY = -(vec.y * 0.5 - 0.5) * window.innerHeight
      t.visible = Math.abs(vec.z) < 1 && vec.x >= -1 && vec.x <= 1 && vec.y >= -1 && vec.y <= 1
    } else {
      t.visible = false
    }

    if (t.state === 'respawning') {
      if (now >= t.respawnTime) handleTargetRespawn(t)
      return
    }

    if (t.state === 'dying') {
      if (t.type === 'good') {
        t.y += 2 * delta 
        t.opacity -= 1 * delta
        t.glow += 2 * delta
        if (t.opacity <= 0) {
          t.state = 'respawning'
          t.respawnTime = now + 500 
        }
      } else {
        t.scale -= 3 * delta
        t.shake = 0.5 
        t.x += (Math.random() - 0.5) * t.shake
        if (t.scale <= 0) {
           t.state = 'respawning'
           t.respawnTime = now + Math.random() * 1000 + 1000 
        }
      }
      return
    }

    if (t.state === 'alive') {
      let moveSpeed = delta
      if (t.type === 'good') moveSpeed *= 2.5 

      t.x = t.initialX + Math.sin(elapsed + t.offset) * (t.type === 'good' ? 3 : 1.5)
      t.y = t.initialY + Math.cos(elapsed * 0.5 + t.offset) * 0.5

      // Damage Effects
      if (t.type === 'bad') {
        const hpPercent = t.hp / t.maxHp
        // < 40% HP
        if (hpPercent <= 0.4) {
          t.shake = 0.1
          const flash = Math.sin(elapsed * 15) > 0
          t.color = flash ? '#ffffff' : '#ff0000'
        } 
        // < 80% HP
        else if (hpPercent <= 0.8) {
          t.shake = 0.03
          t.color = '#ff4444'
        } else {
          t.shake = 0
          t.color = '#ff4444'
        }

        if (t.shake > 0) {
          t.x += (Math.random() - 0.5) * t.shake
          t.y += (Math.random() - 0.5) * t.shake
        }
      }
    }
  })

  // B. UPDATE BALLS
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i]
    if (!b.active) continue

    const pType = projectileTypes[b.typeIdx]

    b.vy -= pType.gravity
    b.x += b.vx
    b.y += b.vy
    b.z += b.vz

    // Rotation Animation
    if (b.typeIdx === 1) {
      // Needle: Spin around Z axis (local) -> Since rotated X -90, local Z is world Y? 
      // Actually simpler: just rotate around Z for "Roll" effect if pointing forward
      b.rz += 0.2 
    } else {
      // Tumble
      b.rx += 0.1
      b.ry += 0.1
    }

    let hit = false
    targets.forEach((t) => {
      if (t.state !== 'alive' || hit) return

      const dx = b.x - t.x
      const dy = b.y - t.y
      const dz = b.z - t.z
      const distSq = dx*dx + dy*dy + dz*dz

      const hitRadius = 1.0 
      if (distSq < hitRadius * hitRadius) { 
        t.hp -= pType.damage
        b.active = false
        hit = true
        balls.splice(i, 1)

        if (t.hp <= 0) {
          t.state = 'dying'
          if (t.type === 'bad') {
             addScore(1)
          } else {
             addScore(10)
             changeEnvironment(t.name)
          }
        }
      }
    })

    if (!hit && (b.y < -5 || b.z < -70)) {
      balls.splice(i, 1)
    }
  }
})
</script>

<template>
  <div class="game-wrapper" @mousedown="shoot" @touchstart="shoot">
    <!-- UI LAYER -->
    <div class="ui-layer">
      <div class="score-board">
        <span class="coin-icon">❄</span>
        <span class="coin-count">{{ snowCoin }}</span>
        <transition name="pop">
          <span v-if="accumulatedScore > 0" class="combo-text">+{{ accumulatedScore }}</span>
        </transition>
      </div>
      <div class="env-info">
        {{ currentEnv.name }}
      </div>
      <transition name="fade">
        <div v-if="currentWish" class="wish-popup">
          {{ currentWish }}
        </div>
      </transition>
    </div>

    <!-- HTML LABELS -->
    <div class="labels-layer">
      <template v-for="t in targets" :key="t.id">
        <div 
          v-if="t.visible && t.state !== 'respawning'"
          class="target-label"
          :class="{ 
            'bad-label': t.type === 'bad', 
            'good-label': t.type === 'good',
            'dying-label': t.state === 'dying',
            'critical': t.type === 'bad' && (t.hp / t.maxHp) <= 0.4
          }"
          :style="{ 
            left: t.screenX + 'px', 
            top: t.screenY + 'px',
            opacity: t.opacity
          }"
        >
          <div class="label-content">
            {{ t.name }}
            <div v-if="t.type === 'bad'" class="hp-bar">
               <div class="hp-fill" :style="{ width: (t.hp / t.maxHp * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- BOTTOM UI -->
    <div class="bottom-ui">
       <div class="projectile-bar">
         <div 
            v-for="(p, idx) in projectileTypes" 
            :key="idx" 
            class="projectile-item"
            :class="{ active: currentProjectileIdx === idx }"
            @click.stop="currentProjectileIdx = idx"
            @touchstart.stop="currentProjectileIdx = idx"
         >
           {{ p.icon }}
         </div>
       </div>
    </div>

    <!-- 3D SCENE -->
    <TresCanvas window-size :clear-color="currentEnv.bg">
      <TresPerspectiveCamera 
        ref="cameraRef"
        :position="[0, 2, 5]" 
        :look-at="[0, 1, -10]"
      />
      
      <TresAmbientLight :intensity="0.5" />
      <TresDirectionalLight 
        :position="[5, 10, 5]" 
        :intensity="currentEnv.lightIntensity" 
      />

      <!-- BALLS -->
      <TresGroup>
        <TresMesh 
          v-for="b in balls" 
          :key="b.id" 
          :position="[b.x, b.y, b.z]"
          :rotation="[b.rx, b.ry, b.rz]"
        >
          <!-- Type 0: Snowball (Sphere) -->
          <TresSphereGeometry v-if="b.typeIdx === 0" :args="[projectileTypes[0].radius, 16, 16]" />
          <!-- Type 1: Bell (Needle) -->
          <TresConeGeometry v-else-if="b.typeIdx === 1" :args="[0.06, 0.7, 16]" />
          <!-- Type 2: Gift (Box) -->
          <TresBoxGeometry v-else-if="b.typeIdx === 2" :args="[0.5, 0.5, 0.5]" />
          
          <TresMeshStandardMaterial 
            :color="projectileTypes[b.typeIdx].color" 
            :emissive="projectileTypes[b.typeIdx].color" 
            :emissive-intensity="0.5"
          />
        </TresMesh>
      </TresGroup>

      <!-- TARGETS -->
      <TresGroup>
        <template v-for="t in targets" :key="t.id">
          <TresGroup 
            v-if="t.state !== 'respawning'"
            :position="[t.x, t.y, t.z]"
            :scale="[t.scale, t.scale, t.scale]"
          >
             <!-- Targets are now Polygons (Icosahedron) -->
             <TresMesh>
                <TresIcosahedronGeometry :args="[0.7, 0]" />
                <TresMeshStandardMaterial 
                  :color="t.color" 
                  :transparent="true"
                  :opacity="t.opacity"
                  :emissive="t.state === 'dying' ? 'white' : 'black'"
                  :emissiveIntensity="t.glow"
                  :roughness="0.2"
                  :metalness="0.5"
                />
             </TresMesh>
          </TresGroup>
        </template>
      </TresGroup>

      <TresGridHelper :args="[50, 50]" :position="[0, -3, -10]" :visible="false" />
    </TresCanvas>
  </div>
</template>

<style scoped>
.game-wrapper {
  width: 100vw; height: 100vh; position: relative;
  touch-action: none;
  cursor: crosshair;
  overflow: hidden;
  background: #111;
  user-select: none;
  font-family: sans-serif;
}

.ui-layer {
  position: absolute; top: 0; left: 0; padding: 20px;
  pointer-events: none;
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
}

.score-board, .env-info {
  color: #fff;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
}
.score-board { font-size: 24px; display: flex; align-items: center; }
.coin-icon { margin-right: 8px; }
.env-info { font-size: 14px; opacity: 0.8; }

.combo-text {
  margin-left: 10px;
  color: #ffff00;
  animation: bounce 0.3s;
}

/* HTML Labels Layer */
.labels-layer {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 5;
}

.target-label {
  position: absolute;
  transform: translate(-50%, -100%);
  text-align: center;
  white-space: nowrap;
  transition: opacity 0.1s;
}

.label-content {
  background: rgba(0,0,0,0.6);
  padding: 4px 8px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.bad-label .label-content { border: 1px solid #ff4444; }
.good-label .label-content { 
  background: rgba(50, 205, 50, 0.6); border: 1px solid #44ff44; 
  font-size: 16px;
  text-shadow: 0 0 5px white;
}

.critical .label-content {
  animation: shake 0.5s infinite;
  color: #ffaaaa;
  border-color: red;
}

.dying-label {
  animation: floatUp 1s forwards;
}

.hp-bar {
  width: 100%; height: 4px; background: rgba(255,255,255,0.3);
  margin-top: 4px; border-radius: 2px; overflow: hidden;
}
.hp-fill {
  height: 100%; background: #ff4444;
  transition: width 0.2s;
}

@keyframes shake {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-2px, 0); }
  50% { transform: translate(2px, 0); }
  75% { transform: translate(-2px, 0); }
  100% { transform: translate(0, 0); }
}

@keyframes floatUp {
  to { transform: translate(-50%, -200%); opacity: 0; }
}

.bottom-ui {
  position: absolute; bottom: 80px; left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  pointer-events: auto;
  z-index: 10;
}

.projectile-bar {
  display: flex;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

.projectile-item {
  font-size: 30px;
  cursor: pointer;
  width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.projectile-item.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: #fff;
  transform: scale(1.1);
}

@keyframes bounce {
  0% { transform: scale(0.5); opacity: 0; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.pop-enter-active, .pop-leave-active { transition: all 0.3s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(20px); }

.wish-popup {
  position: absolute;
  top: 60px;
  left: 20px;
  background: rgba(255, 105, 180, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(255, 105, 180, 0.5);
  max-width: 250px;
  z-index: 20;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>