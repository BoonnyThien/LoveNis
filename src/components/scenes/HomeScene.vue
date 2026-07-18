<script setup lang="ts">
import { ref, shallowRef, watchEffect, onMounted } from 'vue'
import { useRenderLoop } from '@tresjs/core'
import { Stars, OrbitControls } from '@tresjs/cientos'
import { useHeartShape } from '@/composables/useHeartShape'
import { useAnimationLogic } from '@/composables/useAnimationLogic'
import { SPHERE_ITEMS } from '@/composables/useConfiguration'
import gsap from 'gsap'
import { DoubleSide } from 'three'

const props = defineProps({
  position: {
    type: Array,
    default: () => [0, 0, 0]
  }
})

const emit = defineEmits(['requestEnter'])

const { heartShape, heartExtrudeSettings } = useHeartShape()

// Spheres Setup
const groupRefs = ref([])
const formationWrapperRef = shallowRef(null)
const isDancing = ref(false)
const currentFormation = ref('circle')
const heartRef = shallowRef(null)

// Initialize animation logic
const { applyBaseFormation } = useAnimationLogic(currentFormation, isDancing, groupRefs, formationWrapperRef)

watchEffect(() => {
   // Ensure we have refs before applying formation
   if (groupRefs.value.length === SPHERE_ITEMS.length && formationWrapperRef.value) {
      applyBaseFormation('circle')
   }
})

// Heart Pulse Animation
const { onLoop } = useRenderLoop()
onLoop(({ elapsed }) => {
  if (heartRef.value) {
    const scale = 1 + Math.sin(elapsed * 2) * 0.05
    heartRef.value.scale.set(scale, scale, scale)
    heartRef.value.rotation.y = Math.sin(elapsed * 0.5) * 0.1
  }
  
  // Rotate formation slowly
  if (formationWrapperRef.value) {
    formationWrapperRef.value.rotation.y += 0.002
  }
})

const onTriggerClick = () => {
  console.log("Trigger clicked")
  emit('requestEnter')
}

// Hover effect for invisible mesh
const isHovered = ref(false)
</script>

<template>
  <TresGroup :position="props.position">
    <!-- Heart Centerpiece -->
    <TresGroup :position="[0, 1, 0]">
        <TresMesh ref="heartRef" :rotation="[Math.PI, 0, 0]" :position="[-0, 1, 0]" @click="onTriggerClick">
            <TresExtrudeGeometry :args="[heartShape, heartExtrudeSettings]" />
            <TresMeshStandardMaterial color="#ff0066" :roughness="0.3" :metalness="0.5" />
        </TresMesh>
    </TresGroup>

    <!-- Invisible Trigger Area (Larger box around heart) -->
    <TresMesh 
        :position="[0, 1, 0]" 
        :visible="false"
        @click="onTriggerClick"
        @pointer-enter="isHovered = true"
        @pointer-leave="isHovered = false"
    >
        <TresBoxGeometry :args="[6, 6, 6]" />
        <TresMeshBasicMaterial color="white" :transparent="true" :opacity="0.1" />
    </TresMesh>

    <!-- Surrounding Spheres -->
    <TresGroup ref="formationWrapperRef">
       <TresGroup 
          v-for="(item, index) in SPHERE_ITEMS" 
          :key="item.id"
          :ref="el => { if(el) groupRefs[index] = el }"
       >
          <TresMesh>
             <TresSphereGeometry :args="[0.5, 32, 32]" />
             <TresMeshStandardMaterial :color="item.color" :roughness="0.2" :metalness="0.8" />
          </TresMesh>
          <!-- Optional: Labels or Icons could go here -->
       </TresGroup>
    </TresGroup>

    <!-- Floor/Environment for World 1 -->
    <TresMesh :rotation="[-Math.PI / 2, 0, 0]" :position="[0, -2, 0]">
      <TresPlaneGeometry :args="[50, 50]" />
      <TresMeshStandardMaterial color="#0a0a0a" :roughness="0.5" :metalness="0.5" />
    </TresMesh>
    
    <TresGridHelper :args="[50, 50]" :position="[0, -1.99, 0]" />

    <TresAmbientLight :intensity="1" />
    <TresPointLight :position="[10, 10, 10]" :intensity="2" />
  </TresGroup>
</template>
