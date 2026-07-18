<script setup lang="ts">
import { onMounted } from 'vue'

// Create snowflakes
onMounted(() => {
  const snowContainer = document.querySelector('.snow-container')
  if (snowContainer) {
    for (let i = 0; i < 50; i++) {
      const snowflake = document.createElement('div')
      snowflake.className = 'snowflake'
      snowflake.innerHTML = '❄'
      snowflake.style.left = Math.random() * 100 + '%'
      snowflake.style.animationDelay = Math.random() * 5 + 's'
      snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's'
      snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px'
      snowContainer.appendChild(snowflake)
    }
  }
})
</script>

<template>
  <div class="loading-overlay">
    <!-- Snow effect -->
    <div class="snow-container"></div>
    
    <!-- Christmas lights -->
    <div class="lights-container">
      <div class="light red"></div>
      <div class="light green"></div>
      <div class="light yellow"></div>
      <div class="light blue"></div>
      <div class="light red"></div>
      <div class="light green"></div>
      <div class="light yellow"></div>
      <div class="light blue"></div>
    </div>

    <!-- Main content -->
    <div class="content">
      <!-- Christmas Tree -->
      <div class="christmas-tree">
        <div class="tree-top">⭐</div>
        <div class="tree-layer layer-1">🎄</div>
        <div class="tree-layer layer-2">🎄</div>
        <div class="tree-layer layer-3">🎄</div>
        <div class="tree-trunk"></div>
      </div>

      <!-- Merry Christmas Text -->
      <h1 class="merry-christmas">
        <span class="word word-1">Merry</span>
        <span class="word word-2">Christmas</span>
      </h1>

      <!-- Jingle Bells -->
      <div class="bells-container">
        <div class="bell bell-1">🔔</div>
        <div class="bell bell-2">🔔</div>
        <div class="bell bell-3">🔔</div>
      </div>

      <!-- Loading text -->
      <div class="loading-text">
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
        Ní đợi chút xíu nhó
        <span class="dot">.</span>
        <span class="dot">.</span>
        <span class="dot">.</span>
      </div>
    </div>

    <!-- Decorative elements -->
    <div class="gifts">
      <div class="gift gift-1">🎁</div>
      <div class="gift gift-2">🎁</div>
      <div class="gift gift-3">🎁</div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Mountains+of+Christmas:wght@700&family=Poppins:wght@600&display=swap');

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  overflow: hidden;
}

/* Snow effect */
.snow-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.snowflake {
  position: absolute;
  top: -20px;
  color: white;
  opacity: 0.8;
  animation: fall linear infinite;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
}

@keyframes fall {
  to {
    transform: translateY(100vh) rotate(360deg);
  }
}

/* Christmas lights */
.lights-container {
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  padding: 0 10%;
  z-index: 2;
}

.light {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  animation: blink 1.5s infinite;
  box-shadow: 0 0 20px currentColor;
}

.light.red {
  background: #ff0000;
  color: #ff0000;
  animation-delay: 0s;
}

.light.green {
  background: #00ff00;
  color: #00ff00;
  animation-delay: 0.3s;
}

.light.yellow {
  background: #ffff00;
  color: #ffff00;
  animation-delay: 0.6s;
}

.light.blue {
  background: #0099ff;
  color: #0099ff;
  animation-delay: 0.9s;
}

@keyframes blink {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.8); }
}

/* Main content */
.content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

/* Christmas Tree */
.christmas-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: sway 2s ease-in-out infinite;
}

.tree-top {
  font-size: 40px;
  animation: sparkle 1s ease-in-out infinite;
  filter: drop-shadow(0 0 10px gold);
}

.tree-layer {
  font-size: 60px;
  line-height: 0.6;
  animation: pulse 2s ease-in-out infinite;
  filter: drop-shadow(0 0 5px #00ff00);
}

.layer-1 {
  animation-delay: 0s;
}

.layer-2 {
  font-size: 100px;
  animation-delay: 0.3s;
}

.layer-3 {
  font-size: 130px;
  animation-delay: 0.6s;
}

.tree-trunk {
  width: 20px;
  height: 30px;
  background: #8B4513;
  border-radius: 5px;
  margin-top: -10px;
}

@keyframes sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes sparkle {
  0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
  50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* Merry Christmas Text */
.merry-christmas {
  font-family: 'Mountains of Christmas', cursive;
  font-size: 4rem;
  margin: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.word {
  display: inline-block;
  background: linear-gradient(45deg, #ff0000, #00ff00, #ffff00, #ff0000);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 3s ease infinite, float 3s ease-in-out infinite;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
}

.word-1 {
  animation-delay: 0s;
}

.word-2 {
  animation-delay: 0.5s;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Jingle Bells */
.bells-container {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.bell {
  font-size: 40px;
  animation: jingle 0.8s ease-in-out infinite;
  filter: drop-shadow(0 0 10px gold);
}

.bell-1 {
  animation-delay: 0s;
}

.bell-2 {
  font-size: 50px;
  animation-delay: 0.2s;
}

.bell-3 {
  animation-delay: 0.4s;
}

@keyframes jingle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}

/* Loading text */
.loading-text {
  font-family: 'Poppins', sans-serif;
  color: white;
  font-size: 1.2rem;
  font-weight: 600;
  letter-spacing: 2px;
  margin-top: 30px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.dot {
  animation: blink-dot 1.4s infinite;
  font-size: 1.5rem;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
.dot:nth-child(4) { animation-delay: 0.6s; }
.dot:nth-child(5) { animation-delay: 0.8s; }
.dot:nth-child(6) { animation-delay: 1s; }

@keyframes blink-dot {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* Decorative gifts */
.gifts {
  position: absolute;
  bottom: 50px;
  display: flex;
  gap: 100px;
  z-index: 2;
}

.gift {
  font-size: 50px;
  animation: bounce 2s ease-in-out infinite;
  filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.3));
}

.gift-1 {
  animation-delay: 0s;
}

.gift-2 {
  animation-delay: 0.3s;
}

.gift-3 {
  animation-delay: 0.6s;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-20px) scale(1.1); }
}

/* Responsive design */
@media (max-width: 768px) {
  .merry-christmas {
    font-size: 2.5rem;
  }
  
  .tree-layer {
    font-size: 40px;
  }
  
  .layer-2 {
    font-size: 60px;
  }
  
  .layer-3 {
    font-size: 80px;
  }
  
  .bell {
    font-size: 30px;
  }
  
  .gift {
    font-size: 35px;
  }
  
  .gifts {
    gap: 50px;
  }
}
</style>
