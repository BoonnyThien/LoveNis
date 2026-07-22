<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { trackVisitor, trackCardClick } from '@/utils/analytics'

const confettiContainer = ref<HTMLElement | null>(null)
let animationFrameId: number | null = null

// Confetti logic
const initConfetti = () => {
  if (!confettiContainer.value) return
  const colors = ['#ff6699', '#ffcc66', '#66ffcc', '#66ccff', '#ff66cc']
  const shapes = ['circle', 'star', 'heart']

  // Reduce count for mobile performance
  const count = window.innerWidth < 768 ? 40 : 100

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div')
    confetti.classList.add('confetti')
    confetti.classList.add(shapes[Math.floor(Math.random() * shapes.length)])
    confetti.style.left = Math.random() * 100 + 'vw'
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
    confetti.style.animationDuration = (2 + Math.random() * 3) + 's'
    confetti.style.width = confetti.style.height = (5 + Math.random() * 10) + 'px'
    confettiContainer.value.appendChild(confetti)
  }
}

// horse animation logic
const inithorse = () => {
  const horse = document.getElementById('horse') as HTMLElement
  if (!horse) return

  // Start position (right edge)
  let horsePos = window.innerWidth
  
  const animatehorse = () => {
    // Speed
    horsePos -= 2 
    
    // Reset if off-screen (approx horse width + extra)
    if (horsePos < -150) { 
      horsePos = window.innerWidth + 50
    }
    
    // Use transform for smooth 60fps animation
    horse.style.transform = `translate3d(${horsePos}px, 0, 0)`

    // Drop hearts randomly
    if (Math.random() < 0.05) {
      const heart = document.createElement('div')
      heart.classList.add('heart-drop')
      
      // Heart position is fixed, so we calculate left based on current horse pos
      // Since horse is fixed at top: 20%, we just set the heart's fixed position
      heart.style.left = (horsePos + 50) + 'px'
      
      const horseRect = horse.getBoundingClientRect()
      heart.style.top = (horseRect.top + 30) + 'px'
      
      heart.textContent = '❤️'
      if (confettiContainer.value) {
        confettiContainer.value.appendChild(heart)
      }
      // Remove heart after animation
      setTimeout(() => heart.remove(), 4000)
    }
    animationFrameId = requestAnimationFrame(animatehorse)
  }

  animatehorse()
}

// Media Data (Images & Videos)
interface MediaItem {
  type: 'image' | 'video'
  src: string
}

// Updated to use local files from public/pictures/2026 HNYnis
const mediaList: MediaItem[] = [
  { type: 'video', src: '/pictures/2026 HNYnis/FBDown.to_AQMqYeFbNPg3CdE43MxMVhUbCSFajFP2-TDyc9Ok08DW1VwyZwDbP97HvQ7ovgIur1SmtlfEUFAcx6IcLyc-Q0zjvwFwuYgO5RK6JZzEvP2Emg_720p_(HD).mp4' },
  { type: 'video', src: '/pictures/2026 HNYnis/Cat.mp4' },
  { type: 'image', src: '/pictures/2026 HNYnis/Gemini_Generated_Image_q7i2maq7i2maq7i2.png' },
  { type: 'image', src: '/pictures/2026 HNYnis/giphy (6).gif' },
  { type: 'image', src: '/pictures/2026 HNYnis/Screenshot_2025-09-18-05-57-49-39.png' }

]

const texts = [ 
  "You are cute", "You are My <3",
  "You are amazing!","Ní là tuyệt nhất!",
  "Happy New Year my dear",
]

const isModalOpen = ref(false)
const currentMedia = ref<MediaItem>({ type: 'image', src: '' })
const modalTextContent = ref('')

const openModal = (wishIndex: number) => {
  // Pick random media
  const index = Math.floor(Math.random() * mediaList.length)
  currentMedia.value = mediaList[index]
  
  // Pick text (allow cycling if texts.length < wishIndex)
  modalTextContent.value = texts[wishIndex % texts.length] || texts[Math.floor(Math.random() * texts.length)]
  
  isModalOpen.value = true
  
  // Track the click
  trackCardClick(wishIndex, `Wish-${wishIndex + 1}`)
}

const closeModal = () => {
  isModalOpen.value = false
}

// Click outside to close (handled by backdrop click)
const handleBackdropClick = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('modal-backdrop')) {
    closeModal()
  }
}

onMounted(() => {
  trackVisitor()
  initConfetti()
  inithorse()
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
})
</script>

<template>
  <div class="app-container">
    <div class="confetti-container" ref="confettiContainer"></div>
    <header>
      Happy Lunar New Year
    </header>
    <footer class="text-center py-4 text-muted">
      Gửi đến My Sunshine <b> Tạ thúi</b> |
      <a href="https://tathuy-blossom.netlify.app/" class="btn github" target="_blank">
        Don't click
      </a>
    </footer>

    <div class="wish-container">
      <div class="wish" @click="openModal(0)">Chúc ní Tết tràn ngập niềm vui cũng như những bất ngờ ngọt ngào.</div>
      <div class="wish" @click="openModal(1)">Chúc mừng một năm đầy tình yêu, những điều cutie cùng như là ngầu nhất .</div>
      <div class="wish" @click="openModal(3)">Mong ní luôn vui vẻ, và hy vọng ... này sẽ tiến xa hơn những gì chúng ta nghĩ.</div>
      <div class="wish" @click="openModal(4)">Mong ní luôn rạng rỡ như hoa mai, và ... của chúng ta sẽ nở hoa thành điều gì đó tuyệt vời hơn.</div>
      <div class="wish" @click="openModal(2)">Tết Nguyên Đán này, gửi ní lời chúc sức khỏe và hạnh phúc, và biết đâu năm nay chúng ta sẽ có thêm nhiều kỷ niệm chung</div>
      <div class="wish" @click="openModal(5)">Chúc ní Tết tràn ngập tiếng cười, và tui sẽ là người đầu tiên nghĩ về ní trong khoảnh khắc giao thừa.</div>


    </div>

    <!-- Modal Structure Updated for Better Mobile Scrolling -->
    <div v-if="isModalOpen" class="modal-backdrop" @click="handleBackdropClick">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>{{ modalTextContent }}</h2>
        
        <!-- Video -->
        <video 
          v-if="currentMedia.type === 'video'" 
          :src="currentMedia.src" 
          controls 
          autoplay 
          loop 
          muted
          playsinline
          class="modal-media"
        ></video>
        
        <!-- Image -->
        <img 
          v-else 
          :src="currentMedia.src" 
          alt="Memory" 
          class="modal-media" 
        />
      </div>
    </div>

    <!-- horse -->
    <!-- Running Elements -->
    <div class="running-container">
      <!-- Horse: Left to Right -->
      <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmxhbndncXg2b3U3ZXJ0Y2I0YXFqYTBmZnBnYmw3cHgxMjhhM29wbSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/kNMwnuFs4yGUY59Jjz/giphy.gif" class="running-horse" alt="Running Horse">
      
      <!-- User Item: Right to Left -->
      <img src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGk5cWxocmVzN3Bkb3d4bzVuc29rb2dkYzhpMXBkZGg1bXZza2YyeCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/NqYpeCjGW4KEGE7Qir/giphy.gif" class="running-other" alt="Running Item">
    </div>

    <footer class="text-center py-4 text-muted">
      "Chúc <b>Thúy</b> có khởi đầu tốt đẹp, hạnh phúc, thành công và vui vẻ trong năm 2026." Từ - <b>Boonny Boon</b><p>Mỗi dòng tin có thể click để xem bên trong</p>
      <br><br>
    </footer>
  </div>
</template>

<style>
:root {
  /* Đảm bảo font size không bị scale lạ trên mobile */
  touch-action: pan-x pan-y;
}

html {
  /* Cho phép cuộn mượt mà */
  scroll-behavior: smooth;
  /* Đảm bảo thanh cuộn hoạt động */
  overflow-x: hidden;
  overflow-y: auto; 
}

body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  font-family: 'Mali', cursive, sans-serif;
  background: linear-gradient(to right, #ffe6f0, #fff5cc);
  position: relative;
  
  /* QUAN TRỌNG: Ghi đè style mặc định của Vite */
  display: block !important; 
  place-items: unset !important;
  min-width: unset !important;
  
  -webkit-overflow-scrolling: touch; 
}

/* Fix for Vue root element */
#app {
  width: 100%;
  min-height: 100vh;
  /* Đảm bảo app không bị giới hạn max-width của Vite */
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important; /* Reset text-align nếu bị center */
  
  display: flex;
  flex-direction: column;
}

/* Confetti container to prevent scrollbar issues */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* App Container */
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding-bottom: 80px; /* Extra space for footer */
  position: relative;
  z-index: 2;
}

header {
  text-align: center;
  padding: 50px 20px 20px;
  color: #ff4d6d;
  font-family: 'Dancing Script', cursive;
  font-weight: 700;
  font-size: 3.5rem;
  position: relative;
  line-height: 1.2;
}

@media (max-width: 768px) {
  header {
    font-size: 2.5rem;
    padding: 30px 10px 10px;
  }
}

/* Confetti styles */
.confetti {
  position: fixed;
  width: 10px;
  height: 10px;
  background-color: #ff6699;
  top: -10px;
  animation: fall linear infinite;
  opacity: 0.8;
  border-radius: 50%;
  pointer-events: none;
  z-index: 1; 
  /* Optimization */
  will-change: transform; 
}

.confetti.star::after { content: '⭐'; font-size: 1em; }
.confetti.heart::after { content: '❤️'; font-size: 0.9em; }

@keyframes fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}

/* Shine Animation */
@keyframes shine {
  0% { left: -100%; opacity: 0; }
  20% { left: 100%; opacity: 1; }
  100% { left: 100%; opacity: 0; }
}

/* Floating Icon Animation */
@keyframes gentleFloat {
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
}

.wish-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  max-width: 1000px;
  z-index: 3;
}

.wish {
  /* Mixed gradient background */
  background: linear-gradient(135deg, #fff0f5 0%, #ffeaf2 50%, #fff5cc 100%);
  border-radius: 20px;
  padding: 10px;
  width: 310px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  color: #555;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overflow: hidden; /* Clip the shine */
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* Shine effect layer */
.wish::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  transform: skewX(-25deg);
  animation: shine 3s infinite; /* Run every 3s */
  pointer-events: none;
}

/* Vary shine timing for natural feel */
.wish:nth-child(2n)::before { animation-delay: 0.5s; }
.wish:nth-child(3n)::before { animation-delay: 1.2s; }
.wish:nth-child(5n)::before { animation-delay: 2s; }

.wish:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(255, 102, 153, 0.2);
  z-index: 10;
}

.wish:active {
  transform: scale(0.98);
}

.wish::after {
  content: "💖";
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 1.2em;
  opacity: 0.8;
  animation: gentleFloat 2s ease-in-out infinite alternate;
}

footer {
  margin-top: auto;
  padding: 20px;
  font-size: 1.1em;
  color: #ff6699;
  text-align: center;
  width: 100%;
  z-index: 3;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(5px);
}

footer b {
  color: #d63384; /* Highlight name in pink */
}

/* GitHub Link Styling */
.github {
  text-decoration: none;
  color: #d63384;
  margin-left: 5px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.8);
  padding: 5px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(214, 51, 132, 0.2);
  display: inline-block;
}

.github:hover {
  background: #d63384;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(214, 51, 132, 0.3);
}
.modal-backdrop {
  position: fixed;
  z-index: 9999;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.8); /* Darker backdrop */
  
  display: flex;
  justify-content: center;
  align-items: flex-start; /* Start from top to allow scrolling long content */
  
  overflow-y: auto; 
  padding: 20px 10px; /* Reduced side padding on mobile */
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.modal-content {
  background: #fff0f5;
  border-radius: 20px;
  padding: 20px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: #333;
  
  /* Flex margin adjustment for scrolling */
  margin-top: auto; 
  margin-bottom: auto;
  
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-media {
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 12px;
  margin-top: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  background: #000;
}

.modal-content h2 {
    margin-top: 5px; /* Reduced top margin since close btn is absolute */
    margin-bottom: 10px;
    font-family: 'Dancing Script', cursive;
    font-size: 1.8rem;
    color: #ff4d6d;
    line-height: 1.2;
    padding-right: 30px; /* Make space for close button */
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #ff6699;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.close:active {
    transform: scale(0.9);
}

@keyframes pop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* horse animation */
#horse {
  position: fixed;
  top: 20%;
  /* Removed layout properties that are handled by JS transform to avoid conflict */
  width: 100px;
  z-index: 999;
  pointer-events: none;
  will-change: transform; /* Optimized for transform animations */
}

@media (max-width: 768px) {
  #horse {
    width: 60px;
    top: 15%;
  }
}

.heart-drop {
  position: fixed;
  font-size: 1.2em;
  z-index: 998;
  pointer-events: none;
  animation: heart-fall 3s linear forwards;
}

@keyframes heart-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
}



/* Running Elements Animation */
.running-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 990;
  overflow: hidden;
}

.running-horse {
  position: absolute;
  width: 100px;
  top: 27%; /* Adjust vertical position */
  left: -150px;
  animation: runLeftToRight 10s linear infinite;
  will-change: transform;
}

.running-other {
  position: absolute;
  width: 80px;
  bottom: 2%; /* Different height to avoid collision */
  right: -150px;
  animation: runRightToLeft 5s linear infinite;
  will-change: transform;
}

@keyframes runLeftToRight {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(100vw + 300px)); }
}

@keyframes runRightToLeft {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-100vw - 300px)); }
}
</style>
