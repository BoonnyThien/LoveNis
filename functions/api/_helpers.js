// functions/api/_helpers.js
// Shared utilities cho tất cả API functions

// ─── CORS Headers ─────────────────────────────────────────────────────────────
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
}

// ─── JSON Response ─────────────────────────────────────────────────────────────
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  })
}

// ─── Error Response ───────────────────────────────────────────────────────────
export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  })
}

// ─── Generate unique ID (không cần crypto.randomUUID để tránh lỗi edge) ────────
export function generateId() {
  const timestamp = Date.now().toString(36)
  const random    = Math.random().toString(36).substring(2, 10)
  return `${timestamp}-${random}`
}

// ─── Phân loại MIME type → media type ─────────────────────────────────────────
export function getMimeCategory(mimeType) {
  if (mimeType.startsWith('image/'))                    return 'image'
  if (mimeType.startsWith('video/'))                    return 'video'
  if (mimeType.startsWith('audio/'))                    return 'audio'
  if (mimeType === 'model/gltf-binary')                 return 'model'
  return 'image' // fallback
}

// ─── Format bytes → human readable ────────────────────────────────────────────
export function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
