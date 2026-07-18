<template>
  <div style="height: 500px; width: 100%; border: 2px solid cyan;">
    <TresCanvas 
      window-size 
      clear-color="#333" 
      preserve-drawing-buffer 
      ref="canvasRef"
      @created="onCreated"
    >
      <TresPerspectiveCamera :position="[0, 0, 5]" />
      <OrbitControls />
      
      <TresMesh>
        <TresTorusKnotGeometry />
        <TresMeshNormalMaterial />
      </TresMesh>
    </TresCanvas>

    <button class="btn-capture" @click="capture">📸 CHỤP ẢNH</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { OrbitControls } from '@tresjs/cientos'

// Biến lưu ngữ cảnh render (gl context)
let glContext = null

// Hàm này chạy khi Canvas khởi tạo xong
const onCreated = (ctx) => {
  glContext = ctx.renderer
}

const capture = () => {
  if (glContext) {
    // 1. Render lại một frame để đảm bảo buffer có dữ liệu
    glContext.render(glContext.domElement._scene, glContext.domElement._camera)
    
    // 2. Lấy dữ liệu ảnh
    const dataURL = glContext.domElement.toDataURL('image/png')
    
    // 3. Tải về máy
    const link = document.createElement('a')
    link.download = 'my-cake.png'
    link.href = dataURL
    link.click()
    
    console.log('Đã chụp ảnh!')
  } else {
    // Fallback: Đôi khi ctx trả về khác nhau tùy version
    // Cách đơn giản nhất: querySelector
    const canvas = document.querySelector('canvas')
    if(canvas) {
        const link = document.createElement('a')
        link.download = 'my-cake-simple.png'
        link.href = canvas.toDataURL('image/png')
        link.click()
    }
  }
}
</script>

<style scoped>
.btn-capture {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  padding: 10px 20px; font-size: 20px; cursor: pointer;
  background: white; border: none; border-radius: 30px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}
.btn-capture:active { transform: translateX(-50%) scale(0.95); }
</style>