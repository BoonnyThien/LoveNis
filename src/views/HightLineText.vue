<script setup lang="ts">
import { shallowRef, onMounted } from 'vue' // Dùng shallowRef thay vì ref
import { OrbitControls } from '@tresjs/cientos'
import * as THREE from 'three'

// Import Addons (Dùng đường dẫn này cho Vite/TresJS chuẩn nhất)
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

// QUAN TRỌNG: Dùng shallowRef cho các object Three.js
// Nếu dùng ref(), Vue sẽ làm hỏng cấu trúc dữ liệu của Geometry gây lỗi "Spread syntax"
const particlesGeometry = shallowRef(null)

onMounted(() => {
  const loader = new FontLoader()
  
  // Load font
  loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    
    // 1. Tạo khuôn chữ (Geometry gốc)
    const textGeo = new TextGeometry('LOVE', {
      font: font,
      size: 1,
      depth: 0.2, // Độ dày chữ
      curveSegments: 10,
    })
    
    // 2. Tạo Mesh ảo (Cần cái này để tính toán bề mặt)
    // MeshBasicMaterial giúp sampler biết đâu là bề mặt
    const textMesh = new THREE.Mesh(textGeo, new THREE.MeshBasicMaterial())
    
    // 3. Khởi tạo Sampler (Công cụ rải hạt)
    const sampler = new MeshSurfaceSampler(textMesh).build()
    
    // 4. Tạo dữ liệu hạt
    const count = 3000 // Số lượng hạt sao (Tăng lên nếu muốn chữ đặc hơn)
    const positions = new Float32Array(count * 3) // Mảng chứa tọa độ (x, y, z)
    const tempPosition = new THREE.Vector3() // Biến tạm
    
    for (let i = 0; i < count; i++) {
      // Lấy ngẫu nhiên 1 điểm TRÊN BỀ MẶT chữ và lưu vào tempPosition
      sampler.sample(tempPosition)
      
      positions[i * 3] = tempPosition.x
      positions[i * 3 + 1] = tempPosition.y
      positions[i * 3 + 2] = tempPosition.z
    }
    
    // 5. Đóng gói vào Geometry để render
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // Căn giữa geometry mới tạo
    geometry.computeBoundingBox()
    geometry.center()
    
    // Gán vào biến reactive (shallowRef giúp không bị lỗi Vue)
    particlesGeometry.value = geometry
  })
})
</script>

<template>
  <TresCanvas clear-color="#050505" window-size>
    <TresPerspectiveCamera :position="[0, 0, 5]" :look-at="[0,0,0]" />
    <OrbitControls />

    <TresPoints v-if="particlesGeometry"
        :geometry="particlesGeometry"
    >
      
      <TresPointsMaterial 
        :size="0.04" 
        color="#00ffff" 
        :sizeAttenuation="true"
        :transparent="true"
        :opacity="0.9"
        :blending="THREE.AdditiveBlending"
      />
    </TresPoints>
    
  </TresCanvas>
</template>