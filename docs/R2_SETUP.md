# R2 Bucket Setup

## 1. Tạo bucket
```bash
npx wrangler r2 bucket create lovenis-media
npx wrangler r2 bucket list   # verify
```

## 2. Bật Public Access
Dashboard → R2 → `lovenis-media` → Settings → **Enable Public Access**
Copy Public URL → dán vào `wrangler.toml`:
```toml
[vars]
R2_PUBLIC_URL = "https://pub-xxxxxxxx.r2.dev"
```

## 3. CORS Policy (Dashboard → R2 → Settings → CORS)
```json
[{ "AllowedOrigins": ["*"], "AllowedMethods": ["GET"], "MaxAgeSeconds": 86400 }]
```

## 4. Test upload
```bash
curl -X POST http://localhost:8788/api/upload \
  -F "file=@photo.jpg" -F "title=Test"
```
