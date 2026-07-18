<script setup>
import { ref } from 'vue'

import { useRenderLoop } from '@tresjs/core'
import { 
  TextureLoader,
  AdditiveBlending,
  ClampToEdgeWrapping, 
  LinearFilter
} from 'three'

const props = defineProps({
  position: {
    type: Array,
    default: () => [0, 5, 0]
  },
  rotation: {
    type: Array,
    default: () => [0, 0, 0]
  },
  scale: {
    type: Array,
    default: () => [1, 1, 1]
  }
})

const emit = defineEmits(['moon-click'])

const moonTexture = new TextureLoader().load('/pictures/wepb/moon.webp', (texture) => {
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = texture.magFilter = LinearFilter
  texture.repeat.set(0.6, 0.6)
  texture.offset.set(0.2, 0.2)
  texture.needsUpdate = true
})

const moonRef = ref(null)
const { onLoop } = useRenderLoop()

const handleMoonClick = () => {
  console.log('🌙 Moon clicked - showing instructions')
  emit('moon-click')
}

onLoop(({ delta, elapsed }) => {
  if (moonRef.value) {
    moonRef.value.rotation.y += delta * 0.1
    // Use the prop's Y position as the base for oscillation
    const baseY = props.position ? props.position[1] : 5
    moonRef.value.position.y = baseY + (Math.sin(elapsed * 1.5) * 0.3)
  }
})
</script>

<template>
  <TresGroup 
    ref="moonRef" 
    :position="position"
    :rotation="rotation"
    :scale="scale"
    @click="handleMoonClick"
  >
    <TresMesh>
      <TresSphereGeometry :args="[2, 64, 64]" />
      <TresMeshStandardMaterial 
        color="#fff9d6" 
        :emissive="0xf5f5f5" 
        :emissiveIntensity="0.12"
        :transparent="true" 
        :alphaTest="0.05"
        :map="moonTexture"
      />
    </TresMesh>
    
    <TresMesh>
      <TresSphereGeometry :args="[2.24, 32, 32]" />
      <TresMeshBasicMaterial 
        color="#fff9d6" 
        :transparent="true" 
        :opacity="0.14" 
        :blending="AdditiveBlending" 
      />
    </TresMesh>

    <TresMesh>
      <TresSphereGeometry :args="[3.2, 32, 32]" />
      <TresMeshBasicMaterial 
        color="#fff9d6" 
        :transparent="true" 
        :opacity="0.07" 
        :blending="AdditiveBlending"
      />
    </TresMesh>
  </TresGroup>
</template>