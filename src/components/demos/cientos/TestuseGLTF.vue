<template>
  <div style="height: 500px; width: 100%; border: 2px solid teal;">
    <Suspense>
      <TresCanvas window-size clear-color="#222">
        <TresPerspectiveCamera :position="[0, 2, 5]" />
        <OrbitControls />
        
        <TresAmbientLight :intensity="1" />
        <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" />
        
        <BellContainer />

      </TresCanvas>

      <template #fallback>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white;">
          ⏳ Đang giải nén Draco & Load Model...
        </div>
      </template>
    </Suspense>

    <div style="position: absolute; top: 10px; left: 10px; color: white; background: rgba(0,0,0,0.7); padding: 5px;">
      File 39: Test Draco Loader (Bell.glb)
    </div>
  </div>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import { OrbitControls, useGLTF } from '@tresjs/cientos'

// Tạo component con ngay tại đây để dùng async/await
const BellContainer = defineComponent({
  async setup() {
    try {
      // --- CODE CỦA BẠN ---
      // Tự động giải nén Draco, tự động cache
      const { scene: bellModel } = await useGLTF('/models/bell.glb', { draco: true })
      
      console.log('✅ Đã load file bell.glb thành công!')
      return () => h('primitive', { object: bellModel })

    } catch (error) {
      // --- BACKUP: NẾU KHÔNG CÓ FILE TRÊN MÁY BẠN ---
      console.warn('⚠️ Không tìm thấy /models/bell.glb, đang load model mẫu online...')
      
      // Load cái BoomBox (Cũng dùng Draco) để test tính năng
      const { scene } = await useGLTF('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb', { draco: true })
      
      // Chỉnh lại scale cho BoomBox vì nó hơi to
      scene.scale.set(50, 50, 50) 
      
      return () => h('primitive', { object: scene })
    }
  }
})
</script>