<script setup lang="ts">
// --- 1. IMPORTS GỌN GÀNG ---
import { ref, shallowRef, nextTick, onMounted } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls, Box, Ring, Stars, Precipitation } from '@tresjs/cientos'
import { DoubleSide } from 'three' // Chỉ import những gì thực sự dùng
import { trackCardClick } from '@/utils/analytics'
import gsap from 'gsap'

// Import Models & Assets
import UniversalModel from '@/components/models/UniversalModel.vue'
import Moon from '@/components/models/Moon.vue'

// Import Config
import { SPHERE_ITEMS } from '@/composables/useConfiguration'

// --- DATA CONSTANTS ---
const GIFTS = [
  { id: 'camera_retro', color: '#333333', name: 'Máy Ảnh', details: 'Lưu giữ kỷ niệm .', image: '/pictures/wepb/canon_at-1_retro_camera.webp', component: UniversalModel, props: { Path: '/models/canon_at-1_retro_camera.glb', scale: [10,10,10],position: [0, 0.11, 0], draco: true } },
  { id: 'koi_cat', color: '#FFB6C1', name: 'Mồm lèo', details: 'Rất thích ăn hạt .', image: '/pictures/wepb/koi_cat.webp', component: UniversalModel, props: { Path: '/models/koi_cat-v1.glb', animationName: 'Run',scale: [0.65,0.65,0.65], draco: true } },
  { id: 'moon_dream', color: '#FFFFE0', name: 'Mặt Trăng', details: 'My moon belongs to my soul, though I long to call it mine.', image: '/pictures/wepb/moon.webp', component: Moon, props: { scale: [0.4,0.4,0.4] , position: [0, 0.9, 0] } },  
  { id: 'snow_globe', color: '#E0FFFF', name: 'Quả Cầu Tuyết', details: 'Một thế giới mùa đông thu nhỏ.', image: '/pictures/wepb/cute_snow_globe.webp', component: UniversalModel, props: { Path: '/models/cute_snow_globe.glb', animationName: 'run', scale: [0.05,0.05,0.05], draco: true } },
  { id: 'donut_sweet', color: '#FF69B4', name: 'Donut Handmade', details: 'Tui ms có bản 3D thui , bản real thì k rõ', image: '/pictures/wepb/donut_sweet.webp', component: UniversalModel, props: { Path: '/models/donut.glb', centerOffset: [-0.5, 0, 0], scale: [1.5,1.5,1.5],position: [0.5, 0.4, 0],rotation: [Math.PI/8, 0, 0], draco: true } },
  { id: 'choco_bunny', color: '#8B4513', name: 'Thỏ Socola', details: 'Ly marshmallow chocolate đặc biệt dành tới chill girl.', image: '/pictures/wepb/choco_bunny.webp', component: UniversalModel, props: { Path: '/models/choco_bunny.glb', scale: [1, 1, 1], draco: true } },
  { id: 'reindeer_cute', color: '#A52A2A', name: 'Tuần Lộc Cute', details: 'Người bạn đồng hành của ông già Noel -- (no el).', image: '/pictures/wepb/christmas_cute_reindeer.webp', component: UniversalModel, props: { Path: '/models/christmas_cute_reindeer.glb', scale: [1, 1, 1], draco: true } },
  { id: 'heart_love', color: '#FF0000', name: 'BoonnyBoon Heart', details: 'Đã nhận rất nhiều đủ để tích góp tới tương lai luôn gòi.', image: '/pictures/wepb/heart_in_love.webp', component: UniversalModel, props: { Path: '/models/heart_in_love.glb', scale: [0.009,0.009,0.009],position: [0, 0.8, 0], draco: true } },
]
// --- 2. REFS & STATE ---
const boxRef = shallowRef(null)      
const giftGroupRef = shallowRef(null)
const shockwaveRef = shallowRef(null)
const spotLightRef = shallowRef(null)
const ambientLightRef = shallowRef(null)
const cameraRef = shallowRef(null)

const gameState = ref('IDLE') // IDLE | OPENING | REVEALED
const giftName = ref('Mystery Item')
const currentGiftColor = ref('#00FF00') 
const currentGiftId = ref(null) // ID của món quà đang mở
const currentGiftComponent = shallowRef(null)
const currentGiftProps = ref({})

const GIFT_BOX_PATHS = [
  { path: '/models/gift_box.glb', scale: [0.005,0.005,0.005] },
  { path: '/models/gift_box_pink.glb', scale: [1,1,1] }
]
const currentBoxPath = ref(GIFT_BOX_PATHS[0])

// Inventory State (for collected items from gift box)
const inventory = ref({}) // { 'pudding_yum': 0, ... }
const showInventory = ref(false)
const isDarkTheme = ref(true)

// Snow State
const showSnow = ref(false)

// Selected Card State for Details Display
const selectedCard = ref(null)

// Card Unlocked State (separate from inventory - for UI cards)
const cardUnlocked = ref({})

// Alternative Box State (for card id=7)
const useAlternativeBox = ref(false)

const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value
}

// Init Inventory (all items start at 0)
GIFTS.forEach(g => {
  if (inventory.value[g.id] === undefined) {
    inventory.value[g.id] = 0
  }
})

// Init Card Unlocked State
SPHERE_ITEMS.forEach(item => {
  cardUnlocked.value[item.id] = false
})

// Unlock card U (id=8) by default for tutorial (UI only, not inventory)
cardUnlocked.value[8] = true

// UI Interactions
const handleCardClick = (itemIndex: number, itemId: number) => {
  // Check if card is unlocked (not inventory)
  const isCardUnlocked = cardUnlocked.value[itemId]
  
  if (!isCardUnlocked) return // Không tương tác được nếu card chưa unlock
  
  // Show details panel
  selectedCard.value = SPHERE_ITEMS[itemIndex]
  
  // Card Features (Toggle on/off)
  if (itemId === 4) {
    // Card 4: Toggle Snow Effect
    showSnow.value = !showSnow.value
  } else if (itemId === 7) {
    // Card 7: Toggle Christmas Tree Box
    useAlternativeBox.value = !useAlternativeBox.value
  }
  const cardLetter = SPHERE_ITEMS[itemIndex].letter
  trackCardClick(itemId, cardLetter)
  // Add more card features here as needed
}

// --- 3. CONFIG & UTILS ---
// Rung camera
const triggerCameraShake = () => {
  if (!cameraRef.value) return

  const originalPos = cameraRef.value.position.clone()
  gsap.to(cameraRef.value.position, {
    x: "+=0.1", y: "+=0.1", duration: 0.05, yoyo: true, repeat: 5,
    onComplete: () => {
       if (cameraRef.value) cameraRef.value.position.copy(originalPos)
    }
  })
}

// Phase A: Chờ đợi
const startIdleAnimation = () => {
  if (!boxRef.value || !boxRef.value.rotation || !boxRef.value.scale) return
  

  
  // Kill cũ để tránh chồng chéo
  gsap.killTweensOf(boxRef.value.scale)
  gsap.killTweensOf(boxRef.value.rotation)
  
  // Hiệu ứng "Dung Dinh" (Swaying/Shaking)
  gsap.to(boxRef.value.rotation, {
    z: 0.1, duration: 1, yoyo: true, repeat: -1, ease: "sine.inOut"
  })
}

// --- 4. LOGIC CHÍNH: MỞ HỘP ---
const onOpenBox = async () => {
  if (gameState.value !== 'IDLE') return
  

  gameState.value = 'OPENING'

  // --- Random Logic ---
  // Chọn quà
  const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)]
  
  currentGiftId.value = gift.id
  currentGiftColor.value = gift.color
  giftName.value = gift.name
  currentGiftComponent.value = gift.component || null
  currentGiftProps.value = gift.props || {}
  


  await nextTick() // Chờ Vue render DOM

  const tl = gsap.timeline()

  // --- PHASE B: EXPLOSION ---

  
  if (boxRef.value && boxRef.value.scale && boxRef.value.rotation) {
    gsap.killTweensOf(boxRef.value.scale) 
    gsap.killTweensOf(boxRef.value.rotation) // Dừng rung lắc
  }
  
  // Shockwave
  if (shockwaveRef.value && shockwaveRef.value.scale) {
    tl.fromTo(shockwaveRef.value.scale, 
      { x: 0, y: 0 }, { x: 5, y: 5, duration: 0.4, ease: "power4.out" }, "<"
    )
    if (shockwaveRef.value.material) {
        tl.to(shockwaveRef.value.material, { opacity: 0, duration: 0.3 }, "<0.1")
    }
  }
  
  if (cameraRef.value) {
     tl.call(triggerCameraShake, [], "<")
  }

  // Hộp thụt xuống đất à scale nhỏ lại
  if (boxRef.value && boxRef.value.scale) {
    tl.to(boxRef.value.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "back.in" }, "<")
  }

  // --- PHASE C: REVEAL ---
  // Làm tối đèn
  if (ambientLightRef.value) {
    tl.to(ambientLightRef.value, { intensity: 1.5, duration: 0.5 }, "<")
  }

  // Quà bay lên vị trí Y = 1.5 (Tâm điểm mới)
  if (giftGroupRef.value && giftGroupRef.value.scale && giftGroupRef.value.position) {
    tl.fromTo(giftGroupRef.value.scale, {x:0, y:0, z:0}, {x:1, y:1, z:1, duration: 0.5}, "<")
    tl.to(giftGroupRef.value.position, { y: 2, duration: 1.5, ease: "power2.out" }, "<")
  }

  // Bật đèn Spot chiếu vào quà
  if (spotLightRef.value) {
    tl.to(spotLightRef.value, { intensity: 20, duration: 0.8 }, "-=1.0")
  }

  // Kết thúc animation -> Hiện UI
  tl.call(() => {

    gameState.value = 'REVEALED'
  })
}

// Reset Game -> Collect Item
const resetGame = () => {
  // Cộng vật phẩm vào kho
  if (currentGiftId.value) {
    inventory.value[currentGiftId.value] = (inventory.value[currentGiftId.value] || 0) + 1
    
    // Unlock corresponding card when receiving gift
    const giftIndex = GIFTS.findIndex(g => g.id === currentGiftId.value)
    if (giftIndex !== -1) {
      const cardId = SPHERE_ITEMS[giftIndex]?.id
      if (cardId) {
        cardUnlocked.value[cardId] = true
      }
    }
  }


  
  // Clean all previous GSAP animations
  gsap.globalTimeline.clear()

  gameState.value = 'IDLE'
  
  // Reset Mesh bằng GSAP set (tức thì)
  
  if (boxRef.value && boxRef.value.position && boxRef.value.rotation && boxRef.value.scale) {
    gsap.set(boxRef.value.position, { y: 2, x: 0, z:0 }) 
    gsap.set(boxRef.value.rotation, { x: 0, z: 0 })
    gsap.set(boxRef.value.scale, { x:1, y:1, z:1 }) 
  }
  
  if (giftGroupRef.value && giftGroupRef.value.position && giftGroupRef.value.scale) {
    gsap.set(giftGroupRef.value.position, { y: 0 })
    gsap.set(giftGroupRef.value.scale, { x:0, y:0, z:0 })
  }

  if (ambientLightRef.value) {
    gsap.set(ambientLightRef.value, { intensity: 1 })
  }
  
  if (spotLightRef.value) {
    gsap.set(spotLightRef.value, { intensity: 0 })
  }

  startIdleAnimation()
  
  // Randomize Gift Box for next turn
  currentBoxPath.value = GIFT_BOX_PATHS[Math.floor(Math.random() * GIFT_BOX_PATHS.length)]
}

// Loop xoay quà
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  if (gameState.value === 'REVEALED' || gameState.value === 'OPENING') {
    if (giftGroupRef.value) {
      giftGroupRef.value.rotation.y = elapsed * 0.5
      giftGroupRef.value.rotation.z = Math.sin(elapsed * 2) * 0.1
    }
  }
})

onMounted(() => {
  setTimeout(startIdleAnimation, 100)
})
</script>

<template>
  <div class="game-wrapper">
    
    <!-- Theme Toggle & Inventory Button (Always Visible Outside) -->
    <div class="persistent-controls">
      <button class="btn-icon" @click="toggleTheme">
        {{ isDarkTheme ? '🌙' : '☀️' }}
      </button>
      <button class="btn-secondary" @click="showInventory = true">👜 Túi Đồ</button>
    </div>

    <!-- Letter Cards UI (Hidden when REVEALED) -->
    <div class="letter-cards-container" v-show="gameState !== 'REVEALED'">
      <div class="letter-bar">
        <div 
          v-for="(item, index) in SPHERE_ITEMS" 
          :key="item.id" 
          class="letter-card"
          :class="{ 
            'locked': !cardUnlocked[item.id],
            'active-color': (item.id === 4 && showSnow) || (item.id === 7 && useAlternativeBox),
            'clickable': cardUnlocked[item.id]
          }"
          @click="handleCardClick(index, item.id)"
        >
          <!-- Letter Label (Top Left) -->
          <span class="card-letter">{{ item.letter.split('-')[0] }}</span>

          <!-- Image Layer -->
          <div class="card-image-wrapper">
            <img 
              :src="item.image" 
              class="card-img" 
              :alt="item.letter"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Details Panel (Top Left) -->
    <div class="details-panel" v-if="selectedCard">
      <button class="close-btn" @click="selectedCard = null">✕</button>
      <div class="details-header" :style="{ borderColor: selectedCard.color }">
        <span class="details-letter">{{ selectedCard.letter.split('-')[0] }}</span>
        <h3 class="details-title" :style="{ color: selectedCard.color }">
          {{ selectedCard.fullName }}
        </h3>
      </div>
      <div class="details-content">
        <p class="details-text">{{ selectedCard.details }}</p>
      </div>
    </div>
    
    <div class="ui-overlay">
      <div class="ui-top" :class="{ visible: gameState === 'REVEALED' }">
        <div class="notification-card">
          <span class="label"> Ta-Da! Ní Đã Tìm Được</span>
          <h2 class="gift-name" :style="{ color: currentGiftColor }">{{ giftName }}</h2>
        </div>
      </div>

      <div class="ui-spacer"></div>

      <div class="ui-bottom" :class="{ visible: gameState === 'REVEALED' }">
         <button class="btn-primary" @click="resetGame">Nhận Quà</button>
      </div>
    </div>

    <!-- Inventory Modal -->
    <div class="inventory-overlay" v-if="showInventory" @click.self="showInventory = false">
      <div class="inventory-card">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2 class="m-0 text-white fw-bold">👛 TÚI ĐỒ CỦA NÍ 👜</h2>
          <button class="btn-close btn-close-white" @click="showInventory = false"></button>
        </div>
        
        <div class="inventory-grid">
          <div 
            v-for="item in GIFTS" 
            :key="item.id" 
            class="item-slot"
            :class="{ locked: (inventory[item.id] || 0) === 0 }"
          >
            <img :src="item.image" class="item-icon" alt="Item Image" />
            <div class="item-info">
              <span class="item-name">{{ (inventory[item.id] || 0) > 0 ? item.name : '???' }}</span>
              <p class="item-details" v-if="item.details">{{ item.details }}</p>
              <span class="item-count badge bg-primary rounded-pill">+{{ inventory[item.id] || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-rays" :class="{ visible: gameState === 'REVEALED' }"></div>

    <TresCanvas shadows alpha window-size :dpr="[1, 2]">
      <TresPerspectiveCamera ref="cameraRef" :position="[0, 3, 6]" :look-at="[0, 1, 0]" />
      
      <OrbitControls :enable-pan="false" :target="[0, 1.5, 0]" :min-distance="3" :max-distance="10" />
      
      <Stars v-if="isDarkTheme" :radius="50" :depth="50" :count="5000" :size="0.1" :saturation="0" />
      
      <!-- Snow Effect -->
      <Precipitation 
        v-if="showSnow"
        :speed="0.2" 
        :count="1000" 
        :size="0.05" 
        :area="[10, 10, 10]"
        color="#FFFFFF"
      />

      <TresAmbientLight ref="ambientLightRef" :intensity="isDarkTheme ? 0.9 : 2.5" />

      <TresDirectionalLight :position="[0, 5, 5]" :intensity="2" />
      <TresSpotLight 
        ref="spotLightRef"
        :position="[0, 6, 5]" 
        :look-at="[0, 2, 0]"
        :intensity="0" 
        :angle="0.9"
        :penumbra="0.5"
        cast-shadow
      />

      <TresGroup :position="[0, -1, 0]">
        
        <Ring 
          ref="shockwaveRef" 
          :args="[0.5, 1, 32]" 
          :rotation="[-Math.PI/2, 0, 0]" 
          :position="[0, 0.1, 0]"
          :scale="[0,0,0]"
        >
          <TresMeshBasicMaterial color="white" transparent :opacity="0.8" :side="DoubleSide" />
        </Ring>

        <TresGroup ref="boxRef" :position="[0, 2, 0]">
          <!-- Invisible Hit Box for clickable area -->
          <Box 
            :args="[2, 2, 2]" 
            :visible="false" 
            @click="onOpenBox"
          />          
          <!-- Normal Gift Box -->
          <UniversalModel 
            v-if="gameState !== 'REVEALED' && !useAlternativeBox" 
            :Path="currentBoxPath.path"
            :scale="currentBoxPath.scale"
            :draco="true"
          />
          
          <!-- Christmas Tree (Card 7 Feature) -->
          <UniversalModel 
            v-if="gameState !== 'REVEALED' && useAlternativeBox" 
            Path="/models/xmas_tree_-_cartoonish__stylized.glb"
            :scale="[0.3, 0.3, 0.3]"
            :position="[0, 0, 0]"
            :draco="true"
          />
        </TresGroup>

        <TresGroup ref="giftGroupRef" :scale="0" :position="[0, 0, 0]">
          <TresPointLight :color="currentGiftColor" :intensity="2" :distance="4" />
          
          <component 
            v-if="currentGiftComponent"
            :is="currentGiftComponent"
            v-bind="currentGiftProps"
            :key="currentGiftId"
          />
          <template v-else>
          </template>

        </TresGroup>

      </TresGroup>
    </TresCanvas>
  </div>
</template>

<style scoped>
/* Container chính bao trọn màn hình */
.game-wrapper {
  width: 100vw;
  height: 100vh;
  position: relative;
  background-color: v-bind("isDarkTheme ? '#0F172A' : '#FFFFFF'");
  overflow: hidden; /* Chặn thanh cuộn */
  transition: background-color 1s ease;
}

/* --- UI OVERLAY: Flexbox Layout --- */
.ui-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 100; /* Luôn nổi trên Canvas (z-index mặc định canvas thấp) */
  pointer-events: none; /* Quan trọng: để click xuyên qua vùng trống */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Đẩy Top lên trên, Bottom xuống dưới */
  padding: 20px;
}

/* UI Components */
.ui-top, .ui-bottom {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.5s;
  opacity: 0;
}

/* Animation States */
.ui-top { transform: translateY(-50px); }
.ui-bottom { transform: translateY(50px); gap: 15px; }

.ui-top.visible {
  transform: translateY(20px); /* Đẩy xuống chút cho đẹp */
  opacity: 1;
}
.ui-bottom.visible {
  transform: translateY(-60px); /* Đẩy lên chút từ đáy */
  opacity: 1;
}

/* Styling Cards/Buttons */
.notification-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  border: 1px solid rgba(255,255,255,0.5);
}

.gift-name {
  margin: 5px 0 0 0;
  font-size: 2rem;
  font-weight: 900;
  text-transform: uppercase;
  text-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.label {
  font-size: 0.8rem;
  font-weight: bold;
  color: #555;
  letter-spacing: 1px;
}

/* Buttons */
.btn-primary {
  pointer-events: auto; /* Để nút bấm được */
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  border: none;
  transition: transform 0.1s;
}
.btn-primary {
  background: linear-gradient(135deg, #ea00ff, #b32d00);
  color: white;
  box-shadow: 0 4px 15px rgba(0,123,255,0.4);
}
.btn-primary:active , .btn-secondary:active { transform: scale(0.95); }

.btn-secondary {
  background: linear-gradient(135deg, #26ff00, #00b327);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  transition: transform 0.1s;
  pointer-events: auto;
}

/* Persistent Controls (Top Right) */
.persistent-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 101;
  pointer-events: auto;
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-icon {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.btn-icon:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

/* Rays Effect */
.bg-rays {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 200vmax; height: 200vmax; /* Đảm bảo phủ kín mọi màn hình */
  background: repeating-conic-gradient(
    from 0deg, 
    transparent 0deg, 
    rgba(255, 255, 255, 0.059) 10deg, 
    transparent 20deg
  );
  opacity: 0;
  pointer-events: none;
  z-index: 0; /* Nằm dưới 3d (Canvas thường auto) */
  animation: spin 20s linear infinite;
  transition: opacity 0.4s;
}
.bg-rays.visible { opacity: 1; }

@keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }

/* Details Panel (Top Left) */
.details-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-width: calc(100vw - 40px);
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 20px;
  z-index: 160;
  pointer-events: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  border: 2px solid rgba(255,255,255,0.1);
  animation: slideInLeft 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.details-panel.tutorial-mode {
  border: 2px solid #F8B500;
  box-shadow: 0 0 30px rgba(248, 181, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: rotate(90deg);
}

.details-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid;
  margin-bottom: 15px;
}

.details-letter {
  font-size: 2.5rem;
  font-weight: 900;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.details-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.details-content {
  color: #ddd;
}

.details-text {
  margin: 0;
  line-height: 1.6;
  font-size: 0.95rem;
  white-space: pre-line;
}

/* Tutorial Highlights */
.tutorial-highlights {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 155;
}

.highlight-pointer {
  position: absolute;
  border: 3px solid #F8B500;
  border-radius: 15px;
  box-shadow: 0 0 20px rgba(248, 181, 0, 0.8), inset 0 0 20px rgba(248, 181, 0, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

.highlight-cards {
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 650px;
  height: 110px;
  max-width: calc(100vw - 20px);
}

.highlight-inventory {
  top: 18px;
  right: 18px;
  width: 110px;
  height: 48px;
  border-radius: 12px;
}

.highlight-giftbox {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 220px;
  height: 220px;
  border-radius: 50%;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    box-shadow: 0 0 20px rgba(248, 181, 0, 0.6), inset 0 0 20px rgba(248, 181, 0, 0.2);
  }
  50% {
    opacity: 1;
    box-shadow: 0 0 30px rgba(248, 181, 0, 1), inset 0 0 30px rgba(248, 181, 0, 0.5);
  }
}

/* Letter Cards Container (Bottom Center) */
.letter-cards-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  pointer-events: auto;
}

.letter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: rgba(20, 20, 20, 0.6);
  padding: 15px 25px;
  border-radius: 20px;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  max-width: 95vw;
  justify-content: center;
}

/* Letter Card Styling */
.letter-card {
  width: 60px;
  height: 80px;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background: #1a1a1a;
  flex-shrink: 0;
}

.card-letter {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 0.9rem;
  font-weight: 900;
  color: #fff;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  opacity: 0.9;
}

.letter-card.clickable:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.5);
  border-color: rgba(255,255,255,0.9);
  cursor: pointer;
  z-index: 10;
}

.letter-card.clickable:active {
  transform: scale(0.95);
}

.card-image-wrapper {
  padding-top: 0px;
  width: 100%;
  height: 100%;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s;
}

/* Locked State: Black Silhouette */
.letter-card.locked .card-img {
  filter: brightness(0);
  opacity: 0.3;
}

.letter-card.locked {
  background: #000;
  border-color: #333;
}

.letter-card.locked .card-letter {
  color: #555;
}

/* Active State (Snow Toggle) */
.letter-card.active-color {
  border-color: #00ffff !important;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.6) !important;
}

.letter-card.active-color .card-img {
  filter: brightness(1.2) sepia(0.2) hue-rotate(180deg) !important;
}

/* Mobile Optimization */

@media (max-width: 768px) {
  .gift-name { font-size: 1.5rem; }
  .notification-card { padding: 0.8rem 1.5rem; }
  .btn-primary, .btn-secondary { padding: 10px 20px; font-size: 0.9rem; }
  .inventory-grid { grid-template-columns: repeat(2, 1fr) !important; }
  
  /* Letter Cards Mobile */
  .letter-cards-container {
    bottom: 8px;
    width: 100%;
    left: 0;
    transform: none;
    padding: 0 5px;
  }
  
  .letter-bar {
    gap: 6px;
    margin-bottom: 60px;
    padding: 8px 10px;
    border-radius: 12px;
    max-width: 100%;
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-template-rows: repeat(1, 1fr);
  }
  
  .letter-card {
    width: 100%;
    aspect-ratio: 3/4;
    height: auto;
    border-radius: 8px;
  }
  
  .card-letter {
    font-size: 0.7rem;
    top: 3px;
    left: 4px;
  }
  
  /* Details Panel Mobile */
  .details-panel {
    width: calc(100vw - 40px);
    top: 10px;
    left: 10px;
    padding: 15px;
  }
  
  .details-letter {
    font-size: 2rem;
  }
  
  .details-title {
    font-size: 1rem;
  }
  
  .details-text {
    font-size: 0.85rem;
  }
  
  /* Tutorial Highlights Mobile */
  .highlight-cards {
    bottom: 8px;
    height: 85px;
    width: calc(100vw - 15px);
  }
  
  .highlight-inventory {
    top: 18px;
    right: 18px;
    width: 90px;
    height: 42px;
  }
  
  .highlight-giftbox {
    width: 180px;
    height: 180px;
    transform: translate(-50%, -50%);
  }
}

/* Inventory Styles */
.inventory-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.85); /* Darker backdrop */
  z-index: 200; /* Trên cả UI */
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s;
}

.inventory-card {
  background: #1a1a1a;
  border: 1px solid #333;
  width: 90%;
  max-width: 600px;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.item-slot {
  background: rgba(255,255,255,0.05);
  border-radius: 15px;
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s, background 0.2s;
  border: 1px solid transparent;
}
.item-slot:hover {
  background: rgba(255,255,255,0.1);
  transform: translateY(-5px);
}

.item-icon {
  width: 50px;
  height: 50px;
  
  /* Thay background-size bằng cái này */
  object-fit: contain; 
  
  /* Nếu muốn chắc chắn không có màu nền lạ */
  background-color: transparent; 
}

.item-name {
  display: block;
  font-size: 0.8rem;
  color: #ccc;
  margin-bottom: 0.5rem;
  height: auto; 
  overflow: visible;
}

.item-details {
  font-size: 0.7rem;
  color: #aaa;
  margin-bottom: 0.5rem;
  line-height: 1.2;
  display: -webkit-box;
 
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Locked State */
.item-slot.locked .item-icon {
  filter: grayscale(100%) brightness(0%); /* Silhouette effect */
  opacity: 0.3;
}
.item-slot.locked .item-name {
  color: #555;
}
.item-slot.locked .item-count {
  background: #333 !important;
  color: #666;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>