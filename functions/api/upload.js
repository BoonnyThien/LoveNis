// functions/api/upload.js
// R2 Upload API — nhận file multipart/form-data, lưu vào R2, ghi metadata vào D1

import { generateId, getMimeCategory, corsHeaders, errorResponse, jsonResponse } from './_helpers.js'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif',
  'video/mp4', 'video/webm', 'video/ogg',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
  'model/gltf-binary'
]

// ─── POST /api/upload ──────────────────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return errorResponse('Content-Type phải là multipart/form-data', 400)
    }

    const formData = await request.formData()

    // ── Lấy file từ form ──
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return errorResponse('Thiếu file upload', 400)
    }

    // ── Validate file size ──
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(`File quá lớn. Tối đa 50MB, file của bạn: ${(file.size / 1024 / 1024).toFixed(1)}MB`, 413)
    }

    // ── Validate MIME type ──
    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_MIME.includes(mimeType)) {
      return errorResponse(`Loại file không được hỗ trợ: ${mimeType}`, 415)
    }

    // ── Lấy metadata từ form ──
    const title     = formData.get('title')     || ''
    const message   = formData.get('message')   || ''
    const memoryDate = formData.get('memory_date') || null
    const colorTag  = formData.get('color_tag')  || '#ff6b9d'
    const mediaType = getMimeCategory(mimeType)  // 'image' | 'video' | 'audio' | 'model'

    // ── Tạo key R2 duy nhất ──
    const fileExt  = file.name.split('.').pop().toLowerCase()
    const uniqueId = generateId()
    const r2Key    = `memories/${mediaType}/${uniqueId}.${fileExt}`

    // ── Upload lên R2 ──
    const arrayBuffer = await file.arrayBuffer()
    await env.MEDIA_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: mimeType,
        cacheControl: 'public, max-age=31536000' // cache 1 năm
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    })

    // ── Build public URL ──
    const R2_PUBLIC_URL = env.R2_PUBLIC_URL || ''
    const mediaUrl = `${R2_PUBLIC_URL}/${r2Key}`

    // ── Lấy vị trí mới nhất trong timeline ──
    const lastPos = await env.LOVENIS_DB.prepare(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM memories'
    ).first()
    const position = lastPos?.next_pos ?? 0

    // ── Ghi metadata vào D1 ──
    const result = await env.LOVENIS_DB.prepare(`
      INSERT INTO memories (
        title, message, type,
        r2_key, media_url,
        file_name, file_size, mime_type,
        memory_date, position, color_tag
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, message, mediaType,
      r2Key, mediaUrl,
      file.name, file.size, mimeType,
      memoryDate, position, colorTag
    ).run()

    const newId = result.meta?.last_row_id

    // ── Trả về kết quả ──
    return jsonResponse({
      success: true,
      memory: {
        id: newId,
        title,
        message,
        type: mediaType,
        r2_key: r2Key,
        media_url: mediaUrl,
        file_name: file.name,
        file_size: file.size,
        mime_type: mimeType,
        memory_date: memoryDate,
        position,
        color_tag: colorTag,
        is_favorite: 0,
        created_at: new Date().toISOString()
      }
    }, 201)

  } catch (err) {
    console.error('❌ Upload error:', err)
    return errorResponse(`Upload thất bại: ${err.message}`, 500)
  }
}

// ─── OPTIONS (CORS preflight) ──────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
