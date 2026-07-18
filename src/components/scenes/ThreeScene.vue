<template>
  <TresCanvas 
    shadows 
    window-size 
    :clear-color="backgroundColor" 
    alpha 
    :dpr="[1, 2]"
    :power-preference="'high-performance'"
    ref="canvasRef"
  >
    <!-- Context provider để các composables hoạt động -->
    <TresProvider>
      <TresPerspectiveCamera 
        ref="cameraRef"
        :position="cameraPosition"
        :fov="45"
        :near="0.1"
        :far="1000"
        :look-at="[0, 0, 0]"
      />

      <TresGroup>
        <!-- Ánh sáng mặc định -->
        <TresAmbientLight :intensity="0.5" />
        <TresDirectionalLight
          :position="[5, 10, 5]"
          :intensity="1"
          cast-shadow
        />
        
        <!-- Orbit Controls -->
        <OrbitControls 
          v-if="showControls && ready" 
          ref="controlsRef" 
          :enable-damping="true" 
          :damping-factor="0.05" 
        />
        
        <!-- Nội dung 3D -->
        <slot></slot>
      </TresGroup>
    </TresProvider>
    
    <!-- EffectComposer cho post-processing -->
    <slot name="effects"></slot>
  </TresCanvas>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { TresCanvas } from '@tresjs/core'
import { OrbitControls } from '@tresjs/cientos'

const props = defineProps({
  backgroundColor: {
    type: String,
    default: '#000000'
  },
  cameraPosition: {
    type: Array,
    default: () => [0, 5, 15]
  },
  showControls: {
    type: Boolean,
    default: true
  }
})

const canvasRef = ref(null)
const cameraRef = ref(null)
const controlsRef = ref(null)
const ready = ref(false)

onMounted(() => {
  ready.value = true
})

defineExpose({
  canvas: canvasRef,
  camera: cameraRef,
  controls: controlsRef,
  ready
})
</script>