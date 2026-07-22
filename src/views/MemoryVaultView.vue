<template>
  <div class="vault-page">
    <header class="vault-header">
      <div class="header-content">
        <h1>LoveNis Memory Vault 💖</h1>
        <div class="view-toggles">
          <button :class="{ active: viewMode === 'coverflow' }" @click="viewMode = 'coverflow'">Coverflow</button>
          <button :class="{ active: viewMode === 'timeline' }" @click="viewMode = 'timeline'">Timeline 3D</button>
        </div>
      </div>
      <div class="upload-section">
        <MemoryUploader @uploaded="onUploaded" />
      </div>
    </header>

    <main class="vault-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải ký ức...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="memories.length === 0" class="empty-state">
        <p>Chưa có ký ức nào. Hãy tải lên ảnh/video/nhạc đầu tiên của bạn!</p>
      </div>

      <!-- Views -->
      <template v-else>
        <CoverflowView v-if="viewMode === 'coverflow'" :memories="memories" />
        <TimelineView v-else-if="viewMode === 'timeline'" :memories="memories" />
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMemories } from '@/composables/useMemories'
import MemoryUploader from '@/components/MemoryUploader.vue'
import CoverflowView from '@/components/memory/CoverflowView.vue'
import TimelineView from '@/components/memory/TimelineView.vue'

const viewMode = ref('coverflow')
const { memories, isLoading, fetchMemories } = useMemories()

onMounted(() => {
  fetchMemories()
})

function onUploaded() {
  fetchMemories()
}
</script>

<style scoped>
.vault-page {
  min-height: 100vh;
  background: var(--bg-dark, #070709);
  color: #fff;
  display: flex;
  flex-direction: column;
}

.vault-header {
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  z-index: 10;
}

.header-content h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
  background: linear-gradient(90deg, #ff6b9d, #ff9f1c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.view-toggles {
  display: flex;
  gap: 10px;
}

.view-toggles button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.view-toggles button.active {
  background: rgba(255, 107, 157, 0.2);
  border-color: #ff6b9d;
  color: #ff6b9d;
}

.view-toggles button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.15);
}

.vault-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-state, .empty-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 107, 157, 0.3);
  border-top-color: #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .vault-header {
    flex-direction: column;
    padding: 15px;
    align-items: stretch;
  }
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-content h1 {
    font-size: 20px;
    margin: 0;
  }
  .upload-section {
    width: 100%;
  }
}
</style>
