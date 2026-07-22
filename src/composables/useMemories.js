// src/composables/useMemories.js
// Vue 3 Composable — giao tiếp với API memories + upload R2

import { ref, computed } from 'vue'

const BASE_URL = import.meta.env.DEV ? 'http://localhost:8788' : ''

// ─── State toàn cục (singleton) ───────────────────────────────────────────────
const memories    = ref([])
const isLoading   = ref(false)
const uploadProgress = ref(0)
const error       = ref(null)

// ─── Computed helpers ─────────────────────────────────────────────────────────
const images    = computed(() => memories.value.filter(m => m.type === 'image'))
const videos    = computed(() => memories.value.filter(m => m.type === 'video'))
const audios    = computed(() => memories.value.filter(m => m.type === 'audio'))
const models    = computed(() => memories.value.filter(m => m.type === 'model'))
const favorites = computed(() => memories.value.filter(m => m.is_favorite === 1))

export function useMemories() {

  // ── Lấy danh sách memories ──────────────────────────────────────────────────
  async function fetchMemories({ type = null, favorite = false, limit = 100, offset = 0 } = {}) {
    isLoading.value = true
    error.value     = null
    try {
      const params = new URLSearchParams({ limit, offset })
      if (type)     params.set('type', type)
      if (favorite) params.set('favorite', '1')

      const res  = await fetch(`${BASE_URL}/api/memories?${params}`)
      const data = await res.json()

      if (!data.success) throw new Error(data.error)

      memories.value = data.memories
      return data
    } catch (err) {
      error.value = err.message
      console.error('❌ fetchMemories:', err)
    } finally {
      isLoading.value = false
    }
  }

  // ── Upload file lên R2 ──────────────────────────────────────────────────────
  async function uploadMemory({ file, title = '', message = '', memoryDate = null, colorTag = '#ff6b9d' }) {
    isLoading.value    = true
    uploadProgress.value = 0
    error.value        = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('message', message)
      formData.append('color_tag', colorTag)
      if (memoryDate) formData.append('memory_date', memoryDate)

      // Dùng XMLHttpRequest để có progress tracking
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${BASE_URL}/api/upload`)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            uploadProgress.value = Math.round((e.loaded / e.total) * 100)
          }
        }

        xhr.onload = () => {
          const data = JSON.parse(xhr.responseText)
          if (xhr.status >= 200 && xhr.status < 300) resolve(data)
          else reject(new Error(data.error || `HTTP ${xhr.status}`))
        }

        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })

      if (result.success) {
        memories.value = [result.memory, ...memories.value].sort((a, b) => a.position - b.position)
      }

      return result
    } catch (err) {
      error.value = err.message
      console.error('❌ uploadMemory:', err)
      throw err
    } finally {
      isLoading.value      = false
      uploadProgress.value = 0
    }
  }

  // ── Toggle yêu thích ────────────────────────────────────────────────────────
  async function toggleFavorite(id) {
    const memory = memories.value.find(m => m.id === id)
    if (!memory) return

    const newVal = memory.is_favorite === 1 ? 0 : 1
    try {
      const res = await fetch(`${BASE_URL}/api/memories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_favorite: newVal })
      })
      const data = await res.json()
      if (data.success) {
        memory.is_favorite = newVal
      }
    } catch (err) {
      console.error('❌ toggleFavorite:', err)
    }
  }

  // ── Cập nhật thông tin memory ───────────────────────────────────────────────
  async function updateMemory(id, fields) {
    try {
      const res = await fetch(`${BASE_URL}/api/memories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields })
      })
      const data = await res.json()
      if (data.success) {
        const idx = memories.value.findIndex(m => m.id === id)
        if (idx !== -1) memories.value[idx] = data.memory
      }
      return data
    } catch (err) {
      console.error('❌ updateMemory:', err)
      throw err
    }
  }

  // ── Xóa memory ──────────────────────────────────────────────────────────────
  async function deleteMemory(id) {
    try {
      const res  = await fetch(`${BASE_URL}/api/memories?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        memories.value = memories.value.filter(m => m.id !== id)
      }
      return data
    } catch (err) {
      console.error('❌ deleteMemory:', err)
      throw err
    }
  }

  return {
    // State
    memories,
    isLoading,
    uploadProgress,
    error,

    // Computed
    images,
    videos,
    audios,
    models,
    favorites,

    // Methods
    fetchMemories,
    uploadMemory,
    toggleFavorite,
    updateMemory,
    deleteMemory
  }
}
