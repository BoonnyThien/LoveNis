<script setup lang="ts">
import { onMounted } from 'vue'
import { setupAnalyticsListeners, trackVisitor } from '@/utils/analytics'

onMounted(() => {
  trackVisitor() // Track entry
  setupAnalyticsListeners() // Setup exit tracking
})
</script>

<template>
  <router-view />
</template>

<style>
/* Global resets if needed here, but mostly handled in view */
body {
  margin: 0;
  padding: 0;
}
</style>