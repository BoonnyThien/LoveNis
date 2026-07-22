<script setup lang="ts">
/* =============================================================================
 * HeartVortexView.vue
 * 
 * View wrapper for the HeartVortexScene.
 * Route: /heart-vortex
 * 
 * This is a thin wrapper that simply mounts the HeartVortexScene component
 * into a full-viewport container. No extra logic needed — all animation
 * and rendering is handled by the scene component itself.
 * ============================================================================= */

import HeartVortexScene from '@/components/scenes/HeartVortexScene.vue'
</script>

<template>
  <div class="heart-vortex-page">
    <HeartVortexScene
      :particle-count="50000"
      :show-controls="true"
      :auto-rotate="true"
      :rotate-speed="0.15"
    />

    <!-- Subtle overlay UI (optional — can be removed) -->
    <div class="scene-overlay">
      <p class="scene-label">💜 Heart Vortex</p>
    </div>
  </div>
</template>

<style scoped>
.heart-vortex-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #030308;
}

.scene-overlay {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  pointer-events: none;
}

.scene-label {
  font-family: 'Quicksand', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.25);
  letter-spacing: 2px;
  text-transform: uppercase;
  text-align: center;
  user-select: none;
}
</style>
