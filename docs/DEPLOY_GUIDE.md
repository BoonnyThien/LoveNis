# Deploy Guide → Đã tách thành các file nhỏ

Xem các file sau:
- [R2_SETUP.md](./R2_SETUP.md) — Tạo R2 bucket + Public Access
- [D1_SETUP.md](./D1_SETUP.md) — Chạy schema + SQL queries
- [DEPLOY.md](./DEPLOY.md)     — Lệnh build & deploy
- [API.md](./API.md)           — API endpoints reference

---

## BƯỚC 1: Tạo R2 Bucket

```bash
# Login Cloudflare (nếu chưa)
npx wrangler login

# Tạo R2 bucket
npx wrangler r2 bucket create lovenis-media

# Kiểm tra đã tạo thành công
npx wrangler r2 bucket list
```

---

## BƯỚC 2: Bật Public Access cho R2 (để serve file qua URL)

1. Vào **Cloudflare Dashboard** → **R2** → **lovenis-media**
2. Chọn tab **Settings**
3. Bật **Public Access** → Copy **Public Bucket URL**
4. Cập nhật `wrangler.toml`:
   ```toml
   [vars]
   R2_PUBLIC_URL = "https://pub-xxxxxxxx.r2.dev"  # ← dán URL vào đây
   ```

---

## BƯỚC 3: Khởi tạo D1 Database (thêm bảng memories mới)

```bash
# Chạy schema mới lên D1 (remote)
npx wrangler d1 execute merrychristmas-analytics-db \
  --remote \
  --file=./db/schema.sql

# Kiểm tra bảng đã được tạo
npx wrangler d1 execute merrychristmas-analytics-db \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## BƯỚC 4: Build & Deploy lên Cloudflare Pages

```bash
# Build Vue app
npm run build

# Deploy lên Cloudflare Pages
npx wrangler pages deploy dist --project-name=merrychristmasnis

# Hoặc nếu lần đầu (tạo project mới)
npx wrangler pages deploy dist
```

---

## BƯỚC 5: Test API endpoints sau khi deploy

```bash
# ① Test upload ảnh
curl -X POST https://merrychristmasnis.pages.dev/api/upload \
  -F "file=@/path/to/your/photo.jpg" \
  -F "title=Ký ức đầu tiên" \
  -F "message=Ngày chúng mình gặp nhau..." \
  -F "color_tag=#ff6b9d"

# ② Lấy danh sách memories
curl https://merrychristmasnis.pages.dev/api/memories

# ③ Lấy chỉ ảnh yêu thích
curl "https://merrychristmasnis.pages.dev/api/memories?type=image&favorite=1"

# ④ Xem dữ liệu D1 trực tiếp
npx wrangler d1 execute merrychristmas-analytics-db \
  --remote \
  --command="SELECT id, title, type, file_size, created_at FROM memories ORDER BY created_at DESC LIMIT 10;"
```

---

## BƯỚC 6: Dev Local (test trước khi deploy)

```bash
# Cài wrangler dev (nếu chưa có)
npm install -D wrangler

# Chạy local với D1 + R2 mock
npx wrangler pages dev dist --compatibility-date=2024-09-23

# App chạy tại: http://localhost:8788
# API available tại: http://localhost:8788/api/*
```

> **Lưu ý Local Dev:**
> - R2 ở local sẽ lưu vào `.wrangler/state/v3/r2/` (không phải cloud thật)
> - D1 ở local dùng SQLite file tại `.wrangler/state/v3/d1/`

---

## Cấu trúc Files Mới

```
LampNis/
├── db/
│   ├── init.sql          # Schema cũ (analytics)
│   └── schema.sql        # Schema mới (memories + analytics)  ← MỚI
├── functions/
│   └── api/
│       ├── _helpers.js         # Shared utilities              ← MỚI
│       ├── upload.js           # POST /api/upload → R2 + D1   ← MỚI
│       ├── memories.js         # GET/PATCH/DELETE /api/memories ← MỚI
│       ├── track-visitor.js    # Analytics (giữ nguyên)
│       ├── track-card-click.js # Analytics (giữ nguyên)
│       └── stats.js            # Analytics (giữ nguyên)
├── src/
│   └── composables/
│       └── useMemories.js      # Vue composable                ← MỚI
└── wrangler.toml               # Đã thêm R2 binding            ← CẬP NHẬT
```

---

## API Reference

| Method   | Endpoint          | Mô tả                          |
|----------|-------------------|--------------------------------|
| `POST`   | `/api/upload`     | Upload file lên R2             |
| `GET`    | `/api/memories`   | Lấy danh sách memories         |
| `GET`    | `/api/memories?id=123` | Lấy 1 memory             |
| `PATCH`  | `/api/memories`   | Cập nhật title/message/favorite |
| `DELETE` | `/api/memories?id=123` | Xóa memory + file R2    |

---

**Step tiếp theo:** Step 2 — Custom Audio Player `<LoveAudioPlayer />` 🎵
