# API Reference — LoveNis

## Upload
`POST /api/upload` — multipart/form-data
| Field | Type | Required |
|-------|------|----------|
| file | File | ✅ |
| title | string | ❌ |
| message | string | ❌ |
| memory_date | datetime | ❌ |
| color_tag | hex color | ❌ |

**Response:** `{ success, memory: { id, type, media_url, r2_key, ... } }`

## Memories CRUD
| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/memories` | Danh sách (có filter) |
| GET | `/api/memories?id=123` | Chi tiết 1 memory |
| PATCH | `/api/memories` | Cập nhật (body: `{id, ...fields}`) |
| DELETE | `/api/memories?id=123` | Xóa memory + file R2 |

**GET Query params:** `?type=image|video|audio|model`, `?favorite=1`, `?limit=50`, `?offset=0`

## Analytics (cũ)
| Method | URL |
|--------|-----|
| POST | `/api/track-visitor` |
| POST | `/api/track-card-click` |
| GET | `/api/stats` |
