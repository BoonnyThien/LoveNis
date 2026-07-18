# 📚 TÀI LIỆU HƯỚNG DẪN - TỔNG QUAN

## 📁 CÁC FILE HƯỚNG DẪN

| File | Mục đích | Khi nào dùng |
|------|----------|--------------|
| **README.md** | Hướng dẫn đầy đủ về Analytics System | Đọc để hiểu toàn bộ hệ thống, xem SQL queries, troubleshooting |
| **QUICK_START.md** | Tham khảo nhanh các lệnh thường dùng | Cần chạy lệnh nhanh mà không muốn đọc nhiều |
| **FILE_GUIDE.md** | File này - Giải thích các tài liệu | Muốn biết nên đọc file nào |

---

## 🎯 HƯỚNG DẪN SỬ DỤNG

### 🆕 Người mới bắt đầu:
1. Đọc **README.md** → Phần "TỔNG QUAN" và "CẤU HÌNH HIỆN TẠI"
2. Xem **QUICK_START.md** để biết các lệnh cơ bản

### 👨‍💻 Đang phát triển:
1. **README.md** → Phần "TÍCH HỢP VÀO CODE"
2. **QUICK_START.md** → Copy/paste lệnh nhanh

### 📊 Muốn xem dữ liệu:
1. **README.md** → Phần "XEM DỮ LIỆU" và "SQL QUERIES HỮU ÍCH"
2. **QUICK_START.md** → Lệnh xem stats nhanh

### 🐛 Gặp lỗi:
1. **README.md** → Phần "TROUBLESHOOTING"
2. Kiểm tra browser console và Cloudflare logs

---

## 📂 CẤU TRÚC CODE

### Backend (Cloudflare Functions):
```
functions/api/
├── track-visitor.js       # Thu thập thông tin người dùng
├── track-card-click.js    # Theo dõi clicks trên cards
└── stats.js               # API xem thống kê
```

### Frontend (Vue):
```
src/
├── utils/
│   └── analytics.ts       # Utility functions cho tracking
└── App.vue                # Tự động track visitors
```

### Database:
```
db/
└── init.sql               # Schema cho D1 database
```

### Config:
```
wrangler.toml              # Cloudflare D1 configuration
```

---

## 🔑 THÔNG TIN QUAN TRỌNG

### Database hiện tại:
```toml
database_name = "merrychristmas-analytics-db"
database_id = "399aa4f5-f9be-4eae-96fa-f48ae16f6324"
```

### API Endpoints:
- `/api/track-visitor` - POST - Thu thập thông tin visitor
- `/api/track-card-click` - POST - Track card clicks
- `/api/stats` - GET - Xem thống kê realtime

### Bảng trong Database:
- `visitor_logs` - Thông tin người dùng
- `card_clicks` - Lịch sử clicks

---

## ❓ CÂU HỎI THƯỜNG GẶP

### Q: Tôi muốn xem có bao nhiêu người truy cập?
**A:** Xem **README.md** → Phần "XEM DỮ LIỆU" → Option 1 (API Stats)

### Q: Làm sao để track thêm events?
**A:** Xem **README.md** → Phần "TÍCH HỢP VÀO CODE" → Tracking Custom Events

### Q: Database không hoạt động?
**A:** Xem **README.md** → Phần "TROUBLESHOOTING"

### Q: Muốn deploy lên production?
**A:** Xem **QUICK_START.md** → Phần "Deploy"

---

## 📖 ĐỌC TIẾP

- **Chi tiết đầy đủ**: [README.md](./README.md)
- **Lệnh nhanh**: [QUICK_START.md](./QUICK_START.md)

---

**Cập nhật**: 2025-12-23  
**Database**: merrychristmas-analytics-db
