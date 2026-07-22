<template>
  <div class="upload-zone" :class="{ 'is-dragging': isDragging }"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <!-- Drop area -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,video/*,audio/*,.glb"
      class="file-input"
      @change="onFileSelect"
    />

    <div v-if="!uploading" class="drop-content" @click="fileInput?.click()">
      <div class="drop-icon">{{ isDragging ? '📂' : '☁️' }}</div>
      <p class="drop-title">{{ isDragging ? 'Thả file vào đây' : 'Kéo thả hoặc click để chọn file' }}</p>
      <p class="drop-sub">Hỗ trợ: JPG, PNG, GIF, WebP, MP4, WebM, MP3, WAV, .GLB — Tối đa 50MB/file</p>
    </div>

    <!-- Upload progress -->
    <div v-else class="upload-progress-area">
      <div class="up-icon">⬆️</div>
      <p class="up-title">Đang upload <strong>{{ currentFileName }}</strong>…</p>
      <div class="up-bar-bg">
        <div class="up-bar-fill" :style="{ width: uploadProgress + '%' }"></div>
      </div>
      <p class="up-pct">{{ uploadProgress }}%</p>
    </div>

    <!-- Error -->
    <div v-if="lastError" class="upload-error">
      ❌ {{ lastError }}
    </div>
  </div>

  <!-- Metadata form (hiện khi đã chọn file) -->
  <Transition name="slide-down">
    <div v-if="pendingFiles.length > 0 && !uploading" class="metadata-form">
      <h3 class="form-title">📝 Thông tin ký ức</h3>

      <div v-for="(pf, idx) in pendingFiles" :key="idx" class="pf-item">
        <div class="pf-preview">
          <img v-if="pf.preview" :src="pf.preview" alt="preview" class="pf-img" />
          <span v-else class="pf-no-preview">{{ pf.icon }}</span>
        </div>
        <div class="pf-fields">
          <input v-model="pf.title"    class="field-input" placeholder="Tiêu đề ký ức…" />
          <textarea v-model="pf.message" class="field-textarea" placeholder="Lời nhắn, cảm xúc…" rows="2" />
          <div class="field-row">
            <input v-model="pf.memoryDate" type="datetime-local" class="field-input field-date" />
            <label class="color-label">
              Màu tag:
              <input v-model="pf.colorTag" type="color" class="field-color" />
            </label>
          </div>
        </div>
        <button class="pf-remove" @click="removePending(idx)">✕</button>
      </div>

      <button class="btn-upload-all" :disabled="uploading" @click="uploadAll">
        🚀 Upload {{ pendingFiles.length }} file
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useMemories } from '@/composables/useMemories'

const emit = defineEmits(['uploaded'])

const { uploadMemory, uploadProgress, isLoading } = useMemories()

const fileInput       = ref(null)
const isDragging      = ref(false)
const uploading       = ref(false)
const currentFileName = ref('')
const lastError       = ref('')
const pendingFiles    = reactive([])

const FILE_ICONS = {
  image: '🖼️', video: '🎬', audio: '🎵', model: '🌐'
}

function getMimeCategory(mimeType) {
  if (mimeType.startsWith('image/'))       return 'image'
  if (mimeType.startsWith('video/'))       return 'video'
  if (mimeType.startsWith('audio/'))       return 'audio'
  if (mimeType === 'model/gltf-binary')    return 'model'
  return 'image'
}

function buildPreview(file) {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file)
  }
  return null
}

function addFiles(files) {
  lastError.value = ''
  for (const file of files) {
    if (file.size > 50 * 1024 * 1024) {
      lastError.value = `"${file.name}" quá lớn (>${(file.size/1024/1024).toFixed(1)}MB)`
      continue
    }
    const category = getMimeCategory(file.type)
    pendingFiles.push({
      file,
      title:      '',
      message:    '',
      memoryDate: '',
      colorTag:   '#ff6b9d',
      preview:    buildPreview(file),
      icon:       FILE_ICONS[category]
    })
  }
}

function onFileSelect(e) {
  addFiles(Array.from(e.target.files))
  e.target.value = '' // reset input
}

function onDrop(e) {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

function removePending(idx) {
  const pf = pendingFiles[idx]
  if (pf.preview) URL.revokeObjectURL(pf.preview)
  pendingFiles.splice(idx, 1)
}

async function uploadAll() {
  uploading.value = true
  lastError.value = ''
  const results = []

  for (const pf of [...pendingFiles]) {
    currentFileName.value = pf.file.name
    try {
      const result = await uploadMemory({
        file:        pf.file,
        title:       pf.title,
        message:     pf.message,
        memoryDate:  pf.memoryDate || null,
        colorTag:    pf.colorTag
      })
      if (result?.success) {
        results.push(result.memory)
        // revoke object URL
        if (pf.preview) URL.revokeObjectURL(pf.preview)
      }
    } catch (err) {
      lastError.value = `Lỗi upload "${pf.file.name}": ${err.message}`
    }
  }

  pendingFiles.splice(0) // clear all
  uploading.value = false
  currentFileName.value = ''

  if (results.length > 0) emit('uploaded', results)
}
</script>

<style scoped>
/* ── Upload Zone ─────────────────────────────────────────────────────────── */
.upload-zone {
  position: relative;
  min-height: 160px;
  border: 2px dashed rgba(255, 107, 157, 0.25);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 24px;
  cursor: pointer;
  transition: border-color 0.25s, background 0.25s;
  background: rgba(255, 107, 157, 0.03);
}
.upload-zone:hover,
.upload-zone.is-dragging {
  border-color: rgba(255, 107, 157, 0.6);
  background: rgba(255, 107, 157, 0.07);
}
.file-input {
  display: none;
}
.drop-icon  { font-size: 40px; }
.drop-title { margin: 0; font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 600; }
.drop-sub   { margin: 4px 0 0; font-size: 12px; color: rgba(255,255,255,0.35); text-align: center; }

/* ── Upload Progress ─────────────────────────────────────────────────────── */
.upload-progress-area { text-align: center; width: 100%; }
.up-icon  { font-size: 32px; margin-bottom: 8px; }
.up-title { margin: 0 0 12px; color: rgba(255,255,255,0.8); font-size: 14px; }
.up-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 6px;
  overflow: hidden;
}
.up-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b9d, #c44dff);
  border-radius: 6px;
  transition: width 0.2s ease;
}
.up-pct {
  margin: 6px 0 0;
  font-size: 13px;
  color: #ff6b9d;
  font-weight: 600;
}

/* ── Error ───────────────────────────────────────────────────────────────── */
.upload-error {
  margin-top: 8px;
  padding: 10px 14px;
  background: rgba(255, 60, 60, 0.12);
  border: 1px solid rgba(255, 60, 60, 0.3);
  border-radius: 10px;
  color: #ff8080;
  font-size: 13px;
}

/* ── Metadata Form ───────────────────────────────────────────────────────── */
.metadata-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-title {
  margin: 0;
  font-size: 16px;
  color: rgba(255,255,255,0.9);
  font-weight: 700;
}
.pf-item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  position: relative;
}
.pf-preview {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: rgba(255,107,157,0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pf-img { width: 100%; height: 100%; object-fit: cover; }
.pf-no-preview { font-size: 28px; }

.pf-fields { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.field-input, .field-textarea {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.field-input:focus, .field-textarea:focus {
  border-color: rgba(255,107,157,0.5);
}
.field-textarea { resize: vertical; min-height: 60px; }

.field-row { display: flex; gap: 10px; align-items: center; }
.field-date { flex: 1; }
.color-label { display: flex; align-items: center; gap: 6px; font-size: 12px; color: rgba(255,255,255,0.5); }
.field-color {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.pf-remove {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,60,60,0.15);
  border: none;
  color: #ff8080;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.pf-remove:hover { background: rgba(255,60,60,0.3); }

.btn-upload-all {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b9d, #c44dff);
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  letter-spacing: 0.3px;
}
.btn-upload-all:hover { opacity: 0.9; transform: translateY(-1px); }
.btn-upload-all:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Transition ──────────────────────────────────────────────────────────── */
.slide-down-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-down-leave-active { transition: all 0.2s ease; }
.slide-down-enter-from { opacity: 0; transform: translateY(-12px); }
.slide-down-leave-to  { opacity: 0; transform: translateY(-8px); }
</style>
