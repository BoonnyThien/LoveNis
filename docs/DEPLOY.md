# Deploy — LoveNis

## Local Dev
```bash
npm run build
npx wrangler pages dev dist
# → http://localhost:8788
```

## Production
```bash
npm run build
npx wrangler pages deploy dist --project-name=merrychristmasnis
```

## Logs & Rollback
```bash
npx wrangler pages deployment tail          # live logs
npx wrangler pages deployment list          # lịch sử
npx wrangler pages deployment rollback <ID> # rollback
```

## Checklist trước deploy
- [ ] R2 bucket `lovenis-media` đã tạo (xem R2_SETUP.md)
- [ ] D1 schema đã chạy (xem D1_SETUP.md)
- [ ] `R2_PUBLIC_URL` đã cập nhật trong wrangler.toml
- [ ] `npm run build` không có lỗi
