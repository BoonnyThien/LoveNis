<template>
  <div style="height: 500px; width: 100%; border: 2px solid gold;">
    <Suspense>
      <TresCanvas window-size clear-color="#000">
        <TresPerspectiveCamera :position="[2, 2, 6]" :look-at="[0, 0, 0]" />
        <OrbitControls />
        
        <TresAmbientLight :intensity="0.5" />
        <TresDirectionalLight :position="[5, 5, 5]" :intensity="2" />

        <TresMesh :position="[-1, 0, 2]">
          <TresSphereGeometry :args="[0.5]" />
          <TresMeshStandardMaterial color="red" :emissive="'red'" :emissiveIntensity="2" />
        </TresMesh>
        
        <TresMesh :position="[0, 0, 0]">
          <TresSphereGeometry :args="[0.7]" />
          <TresMeshStandardMaterial color="green" :emissive="'green'" :emissiveIntensity="1" />
        </TresMesh>

        <TresMesh :position="[1, 0, -3]">
          <TresSphereGeometry :args="[0.5]" />
          <TresMeshStandardMaterial color="blue" :emissive="'blue'" :emissiveIntensity="2" />
        </TresMesh>

        <EffectComposer>
          
          <Bloom 
            v-if="settings.bloom" 
            :luminance-threshold="0.5" 
            :intensity="settings.bloomStrength" 
          />
          
          <Noise 
            v-if="settings.noise" 
            :opacity="0.2" 
          />

          <Vignette 
            v-if="settings.vignette" 
            :darkness="0.6" 
            :offset="0.3" 
          />

          <DepthOfField 
            v-if="settings.dof"
            :focus-distance="0.0" 
            :focal-length="0.05" 
            :bokeh-scale="5" 
          />

        </EffectComposer>

      </TresCanvas>
    </Suspense>

    <div class="controls">
      <h3>🎨 CINEMATIC FX</h3>
      <label><input type="checkbox" v-model="settings.bloom"> Bloom (Phát sáng)</label>
      <label><input type="checkbox" v-model="settings.vignette"> Vignette (Tối góc)</label>
      <label><input type="checkbox" v-model="settings.noise"> Noise (Hạt nhiễu)</label>
      <label><input type="checkbox" v-model="settings.dof"> DepthOfField (Xóa phông)</label>
      <hr>
      <label>Độ mạnh Bloom: <input type="range" v-model.number="settings.bloomStrength" min="0" max="3" step="0.1"></label>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { OrbitControls } from '@tresjs/cientos'
// Import từ @tresjs/post-processing
import { 
  EffectComposer, 
  Bloom, 
  Noise, 
  Vignette, 
  DepthOfField 
} from '@tresjs/post-processing'

const settings = reactive({
  bloom: true,
  bloomStrength: 1.5,
  vignette: false,
  noise: false,
  dof: false
})
</script>

<style scoped>
.controls {
  position: absolute; top: 10px; left: 200px;
  background: rgba(0,0,0,0.8); color: white;
  padding: 10px; border-radius: 8px;
  display: flex; flex-direction: column; gap: 5px;
}
</style>