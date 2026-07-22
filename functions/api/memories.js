// functions/api/memories.js
// CRUD API cho memories: GET (list/detail), PATCH (update), DELETE

import { corsHeaders, errorResponse, jsonResponse } from './_helpers.js'

// ─── GET /api/memories ─────────────────────────────────────────────────────────
// Query params:
//   ?type=image|video|audio|model  → lọc theo loại
//   ?favorite=1                    → chỉ lấy yêu thích
//   ?id=123                        → lấy 1 memory cụ thể
//   ?limit=50&offset=0             → phân trang
export async function onRequestGet(context) {
  const { request, env } = context
  const url = new URL(request.url)

  const id       = url.searchParams.get('id')
  const type     = url.searchParams.get('type')
  const favorite = url.searchParams.get('favorite')
  const limit    = Math.min(parseInt(url.searchParams.get('limit')  || '100'), 200)
  const offset   = parseInt(url.searchParams.get('offset') || '0')

  try {
    // ── Chi tiết 1 memory ──
    if (id) {
      const memory = await env.LOVENIS_DB.prepare(
        'SELECT * FROM memories WHERE id = ? AND is_hidden = 0'
      ).bind(id).first()

      if (!memory) return errorResponse('Không tìm thấy memory', 404)
      return jsonResponse({ success: true, memory })
    }

    // ── Danh sách memories ──
    let query  = 'SELECT * FROM memories WHERE is_hidden = 0'
    const binds = []

    if (type)     { query += ' AND type = ?';       binds.push(type) }
    if (favorite) { query += ' AND is_favorite = 1' }

    query += ' ORDER BY position ASC, memory_date DESC, created_at DESC'
    query += ' LIMIT ? OFFSET ?'
    binds.push(limit, offset)

    const rows = await env.LOVENIS_DB.prepare(query).bind(...binds).all()

    // ── Tổng số để phân trang ──
    let countQuery = 'SELECT COUNT(*) as total FROM memories WHERE is_hidden = 0'
    const countBinds = []
    if (type)     { countQuery += ' AND type = ?'; countBinds.push(type) }
    if (favorite) { countQuery += ' AND is_favorite = 1' }
    const totalRow = await env.LOVENIS_DB.prepare(countQuery).bind(...countBinds).first()

    return jsonResponse({
      success: true,
      memories: rows?.results || [],
      pagination: {
        total: totalRow?.total || 0,
        limit,
        offset,
        has_more: (offset + limit) < (totalRow?.total || 0)
      }
    })

  } catch (err) {
    console.error('❌ GET memories error:', err)
    return errorResponse(`Lấy memories thất bại: ${err.message}`, 500)
  }
}

// ─── PATCH /api/memories ───────────────────────────────────────────────────────
// Body: { id, title?, message?, memory_date?, color_tag?, is_favorite?, position? }
export async function onRequestPatch(context) {
  const { request, env } = context

  try {
    const body = await request.json()
    const { id, ...fields } = body

    if (!id) return errorResponse('Thiếu id', 400)

    const ALLOWED_FIELDS = ['title', 'message', 'memory_date', 'color_tag', 'is_favorite', 'position', 'thumbnail_url']
    const updates = []
    const binds   = []

    for (const [key, val] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.includes(key)) {
        updates.push(`${key} = ?`)
        binds.push(val)
      }
    }

    if (updates.length === 0) return errorResponse('Không có trường nào để cập nhật', 400)

    binds.push(id)
    await env.LOVENIS_DB.prepare(
      `UPDATE memories SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run()

    const updated = await env.LOVENIS_DB.prepare(
      'SELECT * FROM memories WHERE id = ?'
    ).bind(id).first()

    return jsonResponse({ success: true, memory: updated })

  } catch (err) {
    console.error('❌ PATCH memory error:', err)
    return errorResponse(`Cập nhật thất bại: ${err.message}`, 500)
  }
}

// ─── DELETE /api/memories ──────────────────────────────────────────────────────
// Query param: ?id=123
// Xóa cả file trên R2 và record trong D1
export async function onRequestDelete(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const id  = url.searchParams.get('id')

  if (!id) return errorResponse('Thiếu id', 400)

  try {
    // ── Tìm memory để lấy r2_key ──
    const memory = await env.LOVENIS_DB.prepare(
      'SELECT r2_key FROM memories WHERE id = ?'
    ).bind(id).first()

    if (!memory) return errorResponse('Không tìm thấy memory', 404)

    // ── Xóa file trên R2 ──
    try {
      await env.MEDIA_BUCKET.delete(memory.r2_key)
    } catch (r2Err) {
      console.warn('⚠️ R2 delete warning (file có thể đã bị xóa):', r2Err.message)
    }

    // ── Xóa record trong D1 ──
    await env.LOVENIS_DB.prepare('DELETE FROM memories WHERE id = ?').bind(id).run()

    return jsonResponse({ success: true, message: `Đã xóa memory #${id}` })

  } catch (err) {
    console.error('❌ DELETE memory error:', err)
    return errorResponse(`Xóa thất bại: ${err.message}`, 500)
  }
}

// ─── OPTIONS (CORS preflight) ──────────────────────────────────────────────────
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(),
      'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
