<template>
  <div style="height: 500px; width: 100%; border: 2px solid lime;">
    <Suspense>
      <TresCanvas window-size clear-color="#333">
        <TresPerspectiveCamera :position="[0, 2, 6]" />
        <OrbitControls />
        <TresAmbientLight :intensity="1" />

        <Levioso :speed="2" :rotationFactor="0.5" :floatFactor="0.5">
          <TresMesh :position="[0, 0, 0]">
            <TresBoxGeometry />
            <TresMeshNormalMaterial />
            
            <Html transform :position="[0, 0.6, 0]" center>
              <div class="price-tag">
                $15.99
                <button>Buy</button>
              </div>
            </Html>
          </TresMesh>
        </Levioso>

        <Text3D 
          text="DESSERT"
          font="https://raw.githubusercontent.com/Tresjs/assets/main/fonts/FiraCode-Regular.json"
          :size="0.8"
          :height="0.2"
          :position="[-2, -1.5, 0]"
        >
          <TresMeshStandardMaterial color="yellow" />
        </Text3D>

      </TresCanvas>
      <template #fallback>Loading UI...</template>
    </Suspense>
    
    <div style="position: absolute; top: 10px; left: 10px; color: white;">
      File 10: UI (Floating Box, HTML Tag, 3D Text)
    </div>
  </div>
</template>

<script setup>
import { OrbitControls, Levioso, Html, Text3D } from '@tresjs/cientos'
</script>

<style scoped>
.price-tag {
  background: rgba(255, 255, 255, 0.9);
  padding: 5px 10px;
  border-radius: 5px;
  font-family: sans-serif;
  font-weight: bold;
  color: #333;
  font-size: 12px;
  display: flex;
  gap: 5px;
  pointer-events: auto; /* Để click được button */
}
button {
  background: #ff5555;
  border: none;
  color: white;
  border-radius: 3px;
  cursor: pointer;
}
</style>