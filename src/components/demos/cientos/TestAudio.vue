<template>
  <div style="height: 500px; width: 100%; border: 2px solid green; position: relative;">
  
    <!-- Background Audio Element -->
    <audio ref="bgAudio" loop src="/sounds/winter-storm.mp3"></audio>
    
    <!-- Sound Toggle Button -->
    <button v-if="started" class="sound-toggle" @click.stop="toggleSound">
      {{ isMuted ? '🔇 Tắt nhạc' : '🔊 Nhạc nền' }}
    </button>

    <Suspense>
      <TresCanvas v-if="started" window-size clear-color="#222">
        <TresPerspectiveCamera :position="[0, 5, 10]" />
        <OrbitControls />
        <TresAmbientLight :intensity="1" />
        <TresGridHelper />

        <TresMesh :position="[0, 1, 0]">
          <TresBoxGeometry />
          <TresMeshStandardMaterial color="red" />
          
          <Html :position="[-10, 1, 0]" transform center>
            <div class="chk-tag" @click.stop="playSurprise">
              🎁 Click Me!
            </div>
          </Html>
        </TresMesh>
      </TresCanvas>
      <template #fallback>
        <div style="color: white; padding: 20px;">Dang tai Audio...</div>
      </template>
    </Suspense>

    <div v-if="started" style="position: absolute; top: 10px; left: 10px; color: white; pointer-events: none;">
      File 23 Fix:<br>
      Click vào tag "Click Me!" để nghe tiếng Surprise
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { OrbitControls, Html } from '@tresjs/cientos'

const started = ref(true)
const bgAudio = ref(null)
const isMuted = ref(false)

onMounted(() => {
  if (bgAudio.value) {
    bgAudio.value.volume = 0.5
    // Attempt autoplay
    bgAudio.value.play().catch(() => {
       console.log("Autoplay blocked, user interaction needed.")
       isMuted.value = true // Indicate muted state initially if blocked
    })
  }
})

const toggleSound = () => {
  if (!bgAudio.value) return
  isMuted.value = !isMuted.value
  if (isMuted.value) {
    bgAudio.value.pause()
  } else {
    bgAudio.value.play()
  }
}

const playSurprise = () => {
  const audio = new Audio('/sounds/surprise.mp3')
  audio.volume = 1.0
  audio.play().catch(e => console.error("Click sound failed:", e))
}
</script>

<style scoped>
.sound-toggle {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid white;
  color: white;
  padding: 5px 10px;
  cursor: pointer;
  border-radius: 5px;
}

.sound-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.chk-tag {
  background: white;
  color: black;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  transition: transform 0.2s;
}

.chk-tag:active {
  transform: scale(0.95);
  background: #eee;
}
</style>