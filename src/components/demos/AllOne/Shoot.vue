<script setup lang="ts">
import { ref, shallowRef, reactive } from 'vue'
import { Vector3 } from 'three'
import { useRenderLoop } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

// --- CẤU HÌNH ---
const SPEED = 0.5         // Tốc độ đạn
const CLEANUP_DIST = 50   // Bay xa 50m thì tự xoá

// --- STATE ---
const cameraRef = shallowRef()
// Dùng reactive mảng chứa dữ liệu thuần (không chứa Mesh 3D để tránh lỗi Proxy)
const projectiles = reactive<{ 
  id: number; 
  position: Vector3; // Vị trí hiện tại
  velocity: Vector3; // Vectơ vận tốc
}[]>([])

// --- HÀM BẮN (SHOOT) ---
const shoot = () => {
  if (!cameraRef.value) return

  // 1. Xác định hướng bắn: Là hướng Camera đang nhìn (Chính giữa màn hình)
  const direction = new Vector3()
  cameraRef.value.getWorldDirection(direction)

  // 2. Điểm xuất phát: Ngay trước mặt camera một chút (để không bị lẹm hình)
  const startPos = cameraRef.value.position.clone().add(direction.clone().multiplyScalar(1.0))

  // 3. Tạo đạn mới
  projectiles.push({
    id: Date.now(),
    position: startPos,
    velocity: direction.multiplyScalar(SPEED)
  })

  // Giới hạn số lượng đạn để không lag (tối đa 20 viên)
  if (projectiles.length > 20) {
    projectiles.shift()
  }
}

// --- GAME LOOP (Xử lý bay) ---
const { onLoop } = useRenderLoop()

onLoop(() => {
  // Duyệt ngược mảng để xoá phần tử an toàn
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    
    // Cập nhật toạ độ (Cộng vận tốc vào vị trí)
    p.position.x += p.velocity.x
    p.position.y += p.velocity.y
    p.position.z += p.velocity.z

    // Kiểm tra nếu bay quá xa thì xoá
    if (p.position.length() > CLEANUP_DIST) {
      projectiles.splice(i, 1)
    }
  }
})
</script>

<template>
  <div class="container" @click="shoot">
    
    <div class="ui-layer">
      <div class="crosshair">+</div>
      <div class="info">Drag to Aim • Tap to Shoot</div>
      <div class="count">Balls: {{ projectiles.length }}</div>
    </div>

    <TresCanvas window-size clear-color="#333">
      
      <TresPerspectiveCamera 
        ref="cameraRef"
        :position="[0, 2, 5]" 
        :fov="75"
      />
      
      <OrbitControls 
        make-default 
        :enable-pan="false"
        :enable-zoom="true"
        :min-distance="2"
        :max-distance="20"
      />

      <TresAmbientLight :intensity="1" />

      <TresGroup>
        <TresMesh 
          v-for="p in projectiles" 
          :key="p.id"
          :position="[p.position.x, p.position.y, p.position.z]"
        >
          <TresSphereGeometry :args="[0.2, 8, 8]" />
          <TresMeshBasicMaterial color="yellow" />
        </TresMesh>
      </TresGroup>

      <TresMesh :position="[0, 0, -10]">
        <TresBoxGeometry :args="[1, 1, 1]" />
        <TresMeshBasicMaterial color="red" />
      </TresMesh>

      <TresGridHelper :args="[20, 20]" />

    </TresCanvas>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: crosshair;
}

.ui-layer {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  pointer-events: none;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
}

.crosshair {
  font-size: 50px;
  color: red;
  font-weight: 100;
  /* Giữ tâm ngắm luôn ở chính giữa màn hình */
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}

.info {
  position: absolute; bottom: 50px;
  color: white; font-family: sans-serif;
}
.count {
  position: absolute; top: 20px; right: 20px;
  color: yellow; font-family: monospace;
}
</style>