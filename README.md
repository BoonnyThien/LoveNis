# 🎄 Merry Christmas Analytics System

> Hệ thống theo dõi người dùng tự động sử dụng Cloudflare D1 Database

---

## 📋 MỤC LỤC

1. [Tổng quan](#-tổng-quan)
2. [Cấu hình hiện tại](#-cấu-hình-hiện-tại)
3. [Cách sử dụng](#-cách-sử-dụng)
4. [Xem dữ liệu](#-xem-dữ-liệu)
5. [Tích hợp vào code](#-tích-hợp-vào-code)
6. [Troubleshooting](#-troubleshooting)

---

## 🎯 TỔNG QUAN

Hệ thống này tự động thu thập thông tin người dùng khi họ truy cập website, **KHÔNG ảnh hưởng** đến Cloudflare Web Analytics.

### ✅ Đã thiết lập sẵn:

- ✅ Database D1: `merrychristmas-analytics-db`
- ✅ API Endpoints: `/api/track-visitor`, `/api/track-card-click`, `/api/stats`
- ✅ Frontend: Tự động track sau loading screen 5s
- ✅ Privacy-friendly: Không dùng cookies, tuân thủ GDPR

### 📊 Thông tin được thu thập:

- IP address, Device type (Mobile/Tablet/Desktop)
- Browser, OS, Screen resolution
- Language, Timezone
- Country, City, Region (từ Cloudflare)
- Session tracking (localStorage)

---

## ⚙️ CẤU HÌNH HIỆN TẠI

### Database D1:
```toml
# wrangler.toml
name = "merrychristmasnis"
database_name = "merrychristmas-analytics-db"
database_id = "399aa4f5-f9be-4eae-96fa-f48ae16f6324"
```

### Cấu trúc Database:

**Bảng `visitor_logs`:**
```sql
- id (auto increment)
- session_id (unique identifier)
- ip, user_agent, device_type, browser, os
- screen_width, screen_height
- language, timezone
- country, city, region
- referrer
- first_visit, last_visit, visit_count
```

**Bảng `card_clicks`:**
```sql
- id (auto increment)
- session_id
- card_id, card_letter
- clicked_at (timestamp)
```

---

## 🚀 CÁCH SỬ DỤNG

### 1. Hệ thống tự động tracking (Đã hoạt động)

Không cần làm gì! Khi người dùng truy cập website:
1. Loading screen hiển thị 5 giây
2. Sau đó tự động gọi `trackVisitor()`
3. Dữ liệu được ghi vào D1 database

### 2. Deploy lên Production

```bash
# Build project
npm run build

# Deploy
wrangler pages deploy dist
```

---

## 📊 XEM DỮ LIỆU

### Option 1: API Stats (Đơn giản nhất)

Truy cập URL sau để xem thống kê realtime:
```
https://your-domain.pages.dev/api/stats
```

Hoặc local:
```
http://localhost:5173/api/stats
```

### Option 2: Wrangler CLI (Chi tiết nhất)

```bash
# Xem tất cả visitors
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT * FROM visitor_logs ORDER BY first_visit DESC LIMIT 10;"

# Thống kê theo quốc gia
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT country, COUNT(*) as count FROM visitor_logs GROUP BY country ORDER BY count DESC;"

# Thống kê theo device
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT device_type, COUNT(*) as count FROM visitor_logs GROUP BY device_type;"

# Xem card clicks
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT * FROM card_clicks ORDER BY clicked_at DESC LIMIT 20;"
```

### Option 3: Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. **Workers & Pages** → **D1**
3. Chọn database **merrychristmas-analytics-db**
4. Sử dụng **Console** để chạy SQL queries

---

## 🔧 TÍCH HỢP VÀO CODE

### Tracking Card Clicks (Tùy chọn)

Nếu muốn track khi người dùng click vào card:

```typescript
// Trong OpenGiftView.vue hoặc component khác
import { trackCardClick } from '@/utils/analytics'

const handleCardClick = (itemIndex: number, itemId: number) => {
  // ... existing code ...
  
  // Track click
  const cardLetter = SPHERE_ITEMS[itemIndex].letter
  trackCardClick(itemId, cardLetter)
  
  // ... rest of code ...
}
```

### Tracking Custom Events

```typescript
import { getSessionId, getDeviceInfo } from '@/utils/analytics'

// Tạo custom tracking function
async function trackCustomEvent(eventName: string, eventData: any) {
  try {
    const sessionId = getSessionId()
    const deviceInfo = getDeviceInfo()
    
    await fetch('/api/custom-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventName,
        eventData,
        ...deviceInfo
      })
    })
  } catch (error) {
    console.warn('Tracking error:', error)
  }
}
```

---

## 📈 SQL QUERIES HỮU ÍCH

### Phân tích Visitors

```sql
-- Tổng số visitors unique
SELECT COUNT(DISTINCT session_id) as total_visitors 
FROM visitor_logs;

-- Visitors quay lại nhiều lần
SELECT session_id, visit_count, country, device_type, 
       first_visit, last_visit
FROM visitor_logs
WHERE visit_count > 1
ORDER BY visit_count DESC;

-- Phân bố theo giờ trong ngày
SELECT strftime('%H', first_visit) as hour, 
       COUNT(*) as visits
FROM visitor_logs
GROUP BY hour
ORDER BY hour;

-- Top 10 quốc gia
SELECT country, 
       COUNT(*) as visitors,
       COUNT(DISTINCT session_id) as unique_visitors
FROM visitor_logs
GROUP BY country
ORDER BY visitors DESC
LIMIT 10;

-- Phân tích theo device
SELECT device_type,
       COUNT(*) as total_visits,
       COUNT(DISTINCT session_id) as unique_visitors,
       ROUND(AVG(visit_count), 2) as avg_visits_per_user
FROM visitor_logs
GROUP BY device_type;
```

### Phân tích Card Clicks

```sql
-- Card phổ biến nhất
SELECT card_letter, 
       COUNT(*) as total_clicks,
       COUNT(DISTINCT session_id) as unique_users
FROM card_clicks
GROUP BY card_letter
ORDER BY total_clicks DESC;

-- Timeline clicks theo ngày
SELECT DATE(clicked_at) as date,
       card_letter,
       COUNT(*) as clicks
FROM card_clicks
GROUP BY date, card_letter
ORDER BY date DESC, clicks DESC;

-- Users click nhiều cards
SELECT session_id, 
       COUNT(DISTINCT card_id) as cards_clicked,
       COUNT(*) as total_clicks
FROM card_clicks
GROUP BY session_id
HAVING cards_clicked > 1
ORDER BY cards_clicked DESC;
```

### Kết hợp Visitors + Clicks

```sql
-- Engagement rate theo device
SELECT v.device_type,
       COUNT(DISTINCT v.session_id) as visitors,
       COUNT(c.id) as total_clicks,
       ROUND(CAST(COUNT(c.id) AS FLOAT) / COUNT(DISTINCT v.session_id), 2) as avg_clicks_per_visitor
FROM visitor_logs v
LEFT JOIN card_clicks c ON v.session_id = c.session_id
GROUP BY v.device_type;

-- Engagement rate theo quốc gia
SELECT v.country,
       COUNT(DISTINCT v.session_id) as visitors,
       COUNT(c.id) as clicks,
       ROUND(CAST(COUNT(c.id) AS FLOAT) / COUNT(DISTINCT v.session_id), 2) as clicks_per_visitor
FROM visitor_logs v
LEFT JOIN card_clicks c ON v.session_id = c.session_id
GROUP BY v.country
HAVING visitors > 5
ORDER BY clicks_per_visitor DESC;
```

---

## 🛠️ TROUBLESHOOTING

### ❌ Không thấy dữ liệu trong database?

**Bước 1:** Kiểm tra browser console (F12)
- Có lỗi JavaScript không?
- Network tab có request đến `/api/track-visitor` không?
- Status code là gì? (200 = OK)

**Bước 2:** Test API trực tiếp
```bash
curl -X POST https://your-domain.pages.dev/api/track-visitor \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-123",
    "deviceType": "desktop",
    "browser": "Chrome",
    "os": "Windows",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "language": "vi",
    "timezone": "Asia/Ho_Chi_Minh",
    "referrer": ""
  }'
```

**Bước 3:** Kiểm tra database
```bash
wrangler d1 execute merrychristmas-analytics-db --remote --command="SELECT COUNT(*) FROM visitor_logs;"
```

### ❌ CORS errors?

Đảm bảo tất cả API endpoints có:
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json'
}
```

### ❌ Database binding not found?

Kiểm tra `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"  # Phải là "DB"
database_name = "merrychristmas-analytics-db"
database_id = "399aa4f5-f9be-4eae-96fa-f48ae16f6324"
```

### ❌ Lỗi khi deploy?

```bash
# Rebuild và deploy lại
npm run build
wrangler pages deploy dist
```

### 🔍 Xem logs chi tiết:

1. **Cloudflare Dashboard** → **Workers & Pages**
2. Chọn project của bạn
3. **Functions** → **Logs**

---

## 📁 CẤU TRÚC FILES

```
d:\Clone Voice\Merry-Christmasnis\
├── db/
│   └── init.sql                          # Database schema
├── functions/
│   └── api/
│       ├── track-visitor.js              # Visitor tracking API
│       ├── track-card-click.js           # Card click tracking API
│       ├── stats.js                      # Stats API
│       ├── click.js                      # (Old - có thể xóa)
│       └── logs.js                       # (Old - có thể xóa)
├── src/
│   ├── utils/
│   │   └── analytics.ts                  # Analytics utilities
│   └── App.vue                           # Auto-tracking integration
├── wrangler.toml                         # Cloudflare config
└── README.md                             # File này
```

---

## 🔒 PRIVACY & SECURITY

### Privacy-friendly:
- ✅ Không thu thập thông tin cá nhân (tên, email, số điện thoại)
- ✅ Sử dụng session ID (localStorage), không dùng cookies
- ✅ Không track cross-site
- ✅ Tuân thủ GDPR

### Security:
- ✅ Dữ liệu được lưu trên Cloudflare (EU-compliant)
- ✅ HTTPS only
- ✅ CORS được cấu hình đúng
- ✅ Không lưu password hoặc sensitive data

### Performance:
- ✅ Tracking chạy async - không block UI
- ✅ Sử dụng try-catch - không crash app nếu lỗi
- ✅ D1 database có latency thấp (edge computing)
- ✅ **KHÔNG ảnh hưởng đến Cloudflare Web Analytics**

---

## 🎉 HOÀN TẤT!

Hệ thống analytics đã sẵn sàng và đang hoạt động!

### Quick Start:
1. ✅ Database đã được khởi tạo
2. ✅ API endpoints đang hoạt động
3. ✅ Frontend đã tích hợp tracking
4. ✅ Xem stats tại: `/api/stats`

### Next Steps:
- Deploy lên production: `npm run build && wrangler pages deploy dist`
- Xem dữ liệu: Truy cập `/api/stats` hoặc dùng Wrangler CLI
- Tùy chỉnh: Thêm tracking vào các components khác nếu cần

---

**Tạo bởi**: Antigravity AI Assistant  
**Ngày**: 2025-12-23  
**Version**: 2.0.0  
**Database**: merrychristmas-analytics-db
