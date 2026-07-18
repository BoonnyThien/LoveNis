# 🎄 Quick Reference - Analytics System

## 🚀 TÓM TẮT NHANH

### Database hiện tại:
- **Tên**: `merrychristmas-analytics-db`
- **ID**: `399aa4f5-f9be-4eae-96fa-f48ae16f6324`

### Xem dữ liệu nhanh:
```bash
# Xem visitors
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT * FROM visitor_logs LIMIT 10;"

# Xem stats
curl http://localhost:5173/api/stats
# hoặc
curl https://your-domain.pages.dev/api/stats
```

### Deploy:
```bash
npm run build
wrangler pages deploy dist
```

---

📖 **Xem hướng dẫn đầy đủ tại: [README.md](./README.md)**
