# 📖 HƯỚNG DẪN CHỈNH SỬA DỰ ÁN — LampNis

> Tài liệu này giúp bạn tự chỉnh sửa dự án mà không cần hỏi lại nhiều lần.  
> Đọc đúng mục bạn cần → chỉnh sửa → xong!

---

## 📋 MỤC LỤC

1. [Cấu trúc dự án tổng quan](#1-cấu-trúc-dự-án-tổng-quan)
2. [Mục Login — Mã PIN & Màu đèn](#2-mục-login--mã-pin--màu-đèn)
3. [Thêm Dự Án Mới](#3-thêm-dự-án-mới)
4. [Tạo một View mới từ đầu](#4-tạo-một-view-mới-từ-đầu)
5. [Đăng ký Route mới](#5-đăng-ký-route-mới)
6. [Thay đổi màu sắc & theme](#6-thay-đổi-màu-sắc--theme)
7. [Chỉnh sửa nội dung văn bản](#7-chỉnh-sửa-nội-dung-văn-bản)
8. [Chạy & Deploy dự án](#8-chạy--deploy-dự-án)
9. [Troubleshooting nhanh](#9-troubleshooting-nhanh)

---

## 1. Cấu trúc dự án tổng quan

```
LampNis/
├── src/
│   ├── views/               ← Các màn hình chính (mỗi file = 1 trang)
│   │   ├── LoginView.vue       ← Trang Login với đèn kéo dây
│   │   ├── HappyNewYearView.vue
│   │   ├── OpenGiftView.vue
│   │   ├── WorldView.vue
│   │   ├── SnowballView.vue
│   │   ├── SnowballGameView.vue
│   │   ├── GiftFallView.vue
│   │   ├── HeartVortexView.vue
│   │   └── HightLineText.vue
│   ├── router/
│   │   └── index.js         ← Đăng ký đường dẫn URL (routes)
│   ├── components/          ← Component dùng chung
│   ├── styles/              ← CSS dùng chung
│   ├── composables/         ← Logic dùng chung (Vue composables)
│   └── main.js              ← Điểm khởi động ứng dụng
├── docs/                    ← Tài liệu hướng dẫn (thư mục này)
├── functions/               ← Cloudflare Functions (API backend)
├── index.html               ← HTML entry point chính
├── vite.config.js           ← Cấu hình Vite build tool
└── package.json             ← Các gói npm
```

> **Quy tắc vàng**: Mỗi khi thêm trang mới, bạn cần làm **2 việc**:
> 1. Tạo file `.vue` trong `src/views/`
> 2. Đăng ký route trong `src/router/index.js`

---

## 2. Mục Login — Mã PIN & Màu đèn

> **File cần chỉnh**: `src/views/LoginView.vue`

### 2.1 — Thay đổi Mã PIN

Mở `src/views/LoginView.vue`, tìm đoạn **`AUTH_CONFIG`** (dòng ~22–29):

```javascript
const AUTH_CONFIG = {
  masterCode: '52014',    // ← Mã PIN ô trên (Master — ưu tiên cao nhất)
  accessCode: '13149',      // ← Mã PIN ô dưới (Access — dự phòng)
  redirects: {
    master: '/heart-vortex',    // ← Trang khi dùng Master PIN
    access: '/happy-new-year'   // ← Trang khi dùng Access PIN
  }
}
```

| Muốn thay | Chỉnh chỗ nào |
|-----------|---------------|
| Mã PIN ô trên | `masterCode: '52014'` → đổi `'52014'` |
| Mã PIN ô dưới | `accessCode: '13149'` → đổi `'13149'` |
| Trang sau Master | `master: '/heart-vortex'` → đổi route |
| Trang sau Access | `access: '/happy-new-year'` → đổi route |

---

### 2.2 — Màu đèn theo từng mã PIN

Màu đèn thay đổi qua CSS class. Tìm trong `<style scoped>` của `LoginView.vue`:

```css
/* Màu đèn mặc định khi bật */
.light-on .lamp-shade {
  fill: #fff1b8;   /* Vàng ấm */
}

/* Màu đèn khi MASTER PIN */
.master-mode.light-on .lamp-shade {
  fill: #00d4ff;   /* ← Đổi màu này */
  filter: drop-shadow(0 0 30px #00d4ff);
}

/* Màu đèn khi ACCESS PIN */
.access-mode.light-on .lamp-shade {
  fill: #42b883;   /* ← Đổi màu này */
  filter: drop-shadow(0 0 25px #42b883);
}
```

**Bảng màu đèn gợi ý:**

| Tên màu | Hex | Phù hợp |
|---------|-----|---------|
| Vàng ấm (mặc định) | `#fff1b8` | Bình thường |
| Cyan điện | `#00d4ff` | Master mode |
| Xanh mint | `#42b883` | Access mode |
| Hồng rose | `#ff6b9d` | Romantic |
| Tím lavender | `#c084fc` | Dreamy |
| Cam san hô | `#ff6b35` | Warm |
| Đỏ đam mê | `#ff2d55` | Bold |

---

### 2.3 — Thêm PIN thứ 3 (tùy chọn)

**Bước 1**: Thêm vào `AUTH_CONFIG`:
```javascript
const AUTH_CONFIG = {
  masterCode: '52014',
  accessCode: '13149',
  vipCode: 'MySecret',        // ← PIN thứ 3
  redirects: {
    master: '/heart-vortex',
    access: '/happy-new-year',
    vip: '/world'              // ← Route cho PIN thứ 3
  }
}
```

**Bước 2**: Thêm vào hàm `handleSubmit()` (sau RULE 2, trước RULE 3):
```javascript
// RULE 2.5: VIP code
if (accessValue === AUTH_CONFIG.vipCode) {
  authLevel.value = 'vip'
  successMode.value = true
  isLoading.value = false
  vy = -35
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(updateSpring)
  }
  setTimeout(() => {
    router.push(AUTH_CONFIG.redirects.vip)
  }, 1500)
  return
}
```

**Bước 3**: Thêm class vào `:class` binding (dòng ~285):
```html
:class="{ ..., 'vip-mode': authLevel === 'vip' }"
```

**Bước 4**: Thêm CSS màu đèn:
```css
.vip-mode.light-on .lamp-shade {
  fill: #c084fc;  /* Tím */
  filter: drop-shadow(0 0 28px #c084fc);
}
```

---

### 2.4 — Thay đổi thông báo chào mừng

Tìm trong template (dòng ~484):
```html
<h3>{{ authLevel === 'master' ? '✨ Master Access ✨' : 'Thành Công!' }}</h3>
<p>{{ authLevel === 'master' ? 'Chào mừng trở lại, chủ nhân! 👑' : 'Chào mừng Ní đã đăng nhập! 🎉' }}</p>
```
Đổi text trong dấu nháy `'...'` tùy ý.

---

### 2.5 — Thay đổi gợi ý kéo dây

Tìm dòng trong template:
```html
<div class="lamp-hint">Kéo dây công tắc để bật đèn! 💡</div>
```
Thay đổi text và emoji tùy ý.

---

## 3. Thêm Dự Án Mới

Để thêm một dự án/trang mới vào hệ thống, làm theo 3 bước:

### Bước 1 — Tạo file View mới

Tạo file `src/views/TenDuAnMoi.vue` (đặt tên theo PascalCase):

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Ví dụ: quay về login
function goBack() {
  router.push('/login')
}

onMounted(() => {
  // Code chạy khi trang load
})

onUnmounted(() => {
  // Dọn dẹp khi rời trang
})
</script>

<template>
  <div class="project-page">
    <h1>Tiêu đề Dự Án</h1>
    <p>Nội dung dự án ở đây</p>
    <button @click="goBack">Quay lại</button>
  </div>
</template>

<style scoped>
.project-page {
  width: 100vw;
  min-height: 100vh;
  background: #070709;
  color: #f1f5f9;
  font-family: 'Quicksand', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}
</style>
```

### Bước 2 — Đăng ký Route

Mở `src/router/index.js`, thêm:

```javascript
// Thêm import ở đầu file
import TenDuAnMoi from '../views/TenDuAnMoi.vue'

// Thêm vào mảng routes
{ path: '/ten-du-an', name: 'ten-du-an', component: TenDuAnMoi }
```

### Bước 3 — Thêm PIN truy cập (tùy chọn)

Nếu muốn một PIN riêng dẫn đến dự án này, xem mục **2.3** để thêm PIN thứ 3.

---

## 4. Tạo một View mới từ đầu

Template đầy đủ cho View mới:

```vue
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

// ====== ROUTER ======
const router = useRouter()

// ====== STATE ======
const isVisible = ref(false)
const count = ref(0)

// ====== COMPUTED ======
const doubleCount = computed(() => count.value * 2)

// ====== METHODS ======
function doSomething() {
  count.value++
}

function navigate(path: string) {
  router.push(path)
}

// ====== LIFECYCLE ======
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true
  }, 100)
})

onUnmounted(() => {
  // Hủy các interval, animation frame, event listeners...
})
</script>

<template>
  <div class="view-wrapper" :class="{ 'visible': isVisible }">
    
    <!-- Header -->
    <header class="page-header">
      <h1>Tên Trang</h1>
    </header>

    <!-- Content -->
    <main class="page-content">
      <p>Nội dung: {{ count }}</p>
      <button @click="doSomething">Tăng</button>
    </main>

    <!-- Navigation -->
    <button class="back-btn" @click="navigate('/login')">
      ← Quay lại
    </button>

  </div>
</template>

<style scoped>
/* ====== LAYOUT ====== */
.view-wrapper {
  width: 100vw;
  min-height: 100vh;
  background: #070709;
  color: #f1f5f9;
  font-family: 'Quicksand', sans-serif;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.view-wrapper.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ====== HEADER ====== */
.page-header {
  padding: 40px;
  text-align: center;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff1b8, #ff9f1c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* ====== CONTENT ====== */
.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 24px;
}

/* ====== BACK BUTTON ====== */
.back-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 10px 16px;
  color: #f1f5f9;
  font-family: 'Quicksand', sans-serif;
  cursor: pointer;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 159, 28, 0.15);
  border-color: rgba(255, 159, 28, 0.3);
}
</style>
```

---

## 5. Đăng ký Route mới

> **File**: `src/router/index.js`

**Cấu trúc đầy đủ hiện tại:**

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import HappyNewYearView from '../views/HappyNewYearView.vue'
import WorldView from '../views/WorldView.vue'
import OpenGiftView from '../views/OpenGiftView.vue'
import HeartVortexView from '../views/HeartVortexView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login',         name: 'login',         component: LoginView },
    { path: '/happy-new-year',name: 'happy-new-year',component: HappyNewYearView },
    { path: '/world',         name: 'world',         component: WorldView },
    { path: '/open-gift',     name: 'open-gift',     component: OpenGiftView },
    { path: '/heart-vortex',  name: 'heart-vortex',  component: HeartVortexView },
    // Thêm routes mới bên dưới đây:
  ]
})

export default router
```

**Để thêm trang mới:**

```javascript
// 1. Thêm import ở đầu file:
import TenDuAnMoi from '../views/TenDuAnMoi.vue'

// 2. Thêm vào routes[]:
{ path: '/ten-du-an', name: 'ten-du-an', component: TenDuAnMoi }
```

**Điều hướng trong code Vue:**

```javascript
import { useRouter } from 'vue-router'
const router = useRouter()

router.push('/ten-du-an')           // Bằng path
router.push({ name: 'ten-du-an' }) // Bằng name
router.back()                       // Quay lại trang trước
```

**Danh sách routes hiện có:**

| URL | Tên | View File |
|-----|-----|-----------|
| `/login` | `login` | `LoginView.vue` |
| `/happy-new-year` | `happy-new-year` | `HappyNewYearView.vue` |
| `/world` | `world` | `WorldView.vue` |
| `/open-gift` | `open-gift` | `OpenGiftView.vue` |
| `/heart-vortex` | `heart-vortex` | `HeartVortexView.vue` |

---

## 6. Thay đổi màu sắc & theme

### 6.1 — CSS Variables (cách nhanh nhất)

Mỗi View có CSS Variables riêng. Tìm `:root` hoặc class wrapper đầu `<style scoped>`:

```css
.login-page-body {
  --bg-dark: #070709;              /* Màu nền tối */
  --bg-dark-illuminated: #0f0f13;  /* Màu nền khi đèn bật */
  --lamp-off: #32323a;             /* Màu chụp đèn TẮT */
  --lamp-on: #fff1b8;              /* Màu chụp đèn BẬT */
  --accent-color: #ff9f1c;         /* Màu cam chủ đạo */
  --text-muted: #64748b;           /* Chữ mờ */
  --text-light: #f1f5f9;           /* Chữ sáng */
  --transition-slow: 0.65s cubic-bezier(0.25, 1, 0.25, 1);
  --transition-medium: 0.3s ease;
}
```

### 6.2 — Màu accent toàn trang

```css
--accent-color: #ff9f1c;  /* Đổi 1 dòng này → tất cả nút/focus thay theo */
```

### 6.3 — Gradient tiêu đề

```css
background: linear-gradient(135deg, #fff1b8, #ff9f1c);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
/* Đổi 2 màu trong gradient để thay màu chữ tiêu đề */
```

### 6.4 — Tốc độ animation

```css
--transition-slow: 0.65s ...;   /* Giảm xuống 0.3s cho nhanh hơn */
--transition-medium: 0.3s ease; /* Giảm xuống 0.15s cho nhanh hơn */
```

---

## 7. Chỉnh sửa nội dung văn bản

### Text thường

```html
<h2 class="form-title">Đăng Nhập</h2>      ← Tiêu đề form
<div class="lamp-hint">Kéo dây...</div>      ← Gợi ý bật đèn
<p>Chào mừng Ní đã đăng nhập! 🎉</p>       ← Thông báo thành công
```

### Placeholder ô nhập

```html
<input placeholder="Tên đăng nhập" ...>
<input placeholder="Mật khẩu" ...>
```

### Text động (dùng biến Vue)

```html
<span>{{ tenBien }}</span>
<!-- Dùng ternary để hiện text khác nhau -->
<span>{{ isAdmin ? 'Quản trị viên' : 'Người dùng' }}</span>
```

---

## 8. Chạy & Deploy dự án

### Chạy local

```bash
# Vào thư mục dự án rồi chạy
npm run dev
# Mở: http://localhost:5173
```

### Build production

```bash
npm run build
# Output: thư mục dist/
```

### Deploy Cloudflare Pages

```bash
npm run build
wrangler pages deploy dist
```

### Xem logs

[dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Project → Functions → Logs

---

## 9. Troubleshooting nhanh

### ❌ Trang trắng sau khi thêm route

→ Kiểm tra import trong `router/index.js`  
→ Kiểm tra tên file `.vue` viết đúng chưa (phân biệt Hoa/thường)

### ❌ Màu đèn không đổi theo PIN

→ Kiểm tra `:class` binding trong `LoginView.vue` dòng ~285:
```html
:class="{ 'master-mode': authLevel === 'master', 'access-mode': authLevel === 'access' }"
```

### ❌ Đăng nhập không chuyển trang

→ Kiểm tra `AUTH_CONFIG` — mã PIN và route đúng chưa  
→ Kiểm tra route đích đã đăng ký trong `router/index.js` chưa

### ❌ CSS không áp dụng

→ `<style scoped>` chỉ áp dụng cho component đó  
→ Dùng `<style>` (không scoped) cho CSS toàn cục

### ❌ Animation giật lag

→ Tăng `damping` gần 1 hơn (ví dụ `0.85`) trong `LoginView.vue`  
→ Kiểm tra có `cancelAnimationFrame` trong `onUnmounted` chưa

---

## 🎨 Bảng màu tham chiếu nhanh

| Dùng cho | Hex | Preview |
|----------|-----|---------|
| Nền tối | `#070709` | Gần đen |
| Nền khi đèn bật | `#0f0f13` | Đen xám |
| Đèn tắt | `#32323a` | Xám tối |
| Đèn bật (vàng ấm) | `#fff1b8` | Vàng nhạt |
| Accent / Nút | `#ff9f1c` | Cam vàng |
| Accent hover | `#f77f00` | Cam đậm |
| Text sáng | `#f1f5f9` | Trắng xám |
| Text mờ | `#64748b` | Xám trung |
| Master mode | `#00d4ff` | Cyan điện |
| Access mode | `#42b883` | Xanh Vue |
| Error | `#ff2d55` | Đỏ tươi |
| Success | `#42b883` | Xanh lá |

---

## 📁 Bảng file quan trọng

| File | Dùng để |
|------|---------|
| `src/views/LoginView.vue` | Mã PIN, màu đèn, form login |
| `src/router/index.js` | Đăng ký routes mới |
| `src/views/OpenGiftView.vue` | Màn hình chọn dự án |
| `src/views/HappyNewYearView.vue` | Trang Happy New Year |
| `src/views/HeartVortexView.vue` | Trang Heart Vortex |
| `src/views/WorldView.vue` | Trang World |
| `vite.config.js` | Cấu hình build |
| `wrangler.toml` | Cấu hình Cloudflare |

---

*Cập nhật: 2026-07-22 | Dự án: LampNis*

---

## 🆕 3 DỰ ÁN MỚI ĐÃ ĐƯỢC TÍCH HỢP

> Ngày thêm: 2026-07-22

### Danh sách 3 dự án mới

| Dự án | Route | Mã PIN | Màu đèn | Nguồn gốc |
|-------|-------|--------|---------|-----------|
| 🌸 **Hoa đào 3D** | `/blossom` | `33445` | Hồng phấn `#ffaacc` | `temp/Blossom-Animation-2026/` |
| ❤️ **Dear Sun** | `/heartoflove` | `52406` | Đỏ hồng `#ff6b9d` | `temp/heart_of_love_tcw/` |
| 💜 **Love Animation** | `/loveanimation` | `53014` | Tím lavender `#c084fc` | `temp/love responsive animation code/` |
| 🔥 **Particle Heart** | `/particleheart` | `52099` | Đỏ cam `#ff1744` | `Vue 3 + Three.js` |

---

### File đã tạo mới

```
src/views/
├── BlossomView.vue       ← Wrapper iframe cho Hoa đào 3D
├── HeartOfLoveView.vue   ← Wrapper iframe cho Dear Sun
└── LoveAnimationView.vue ← Wrapper iframe cho Love Animation

public/projects/
├── blossom/              ← Static files Blossom Animation
├── heart-of-love/        ← Static files Dear Sun
└── love-animation/       ← Static files Love Animation (đã đổi tên file)
```

---

### Bảng PIN đầy đủ hiện tại

| Ô nhập | Mã PIN | Ý nghĩa (Trend mạng TQ) | Màu đèn | Chuyển đến |
|--------|--------|-------------------------|---------|-----------|
| Ô trên (Master) | `52014` | 我爱你一世 - Anh yêu em một đời | Cyan `#00d4ff` | `/heart-vortex` |
| Ô dưới | `13149` | 一生一世久 - Một đời một kiếp dài lâu | Vàng ấm `#fff1b8` | `/happynewyear` |
| Ô dưới | `33445` | 生生世世我 - Đời đời kiếp kiếp có anh | Hồng `#ffaacc` | `/blossom` |
| Ô dưới | `52406` | 我爱死你了 - Anh yêu em chết mất | Đỏ hồng `#ff6b9d` | `/heartoflove` |
| Ô dưới | `53014` | 我想你一世 - Anh nhớ em một đời | Tím `#c084fc` | `/loveanimation` |
| Ô dưới | `52099` | 我爱你久久 - Anh yêu em mãi mãi | Đỏ cam `#ff1744` | `/particleheart` |
| *(MemoryVault)* | `52013` | 我爱你一生 - Anh yêu em một kiếp | (Không bật) | *(Tạm khóa)* |

> **Lưu ý:** Ô trên được kiểm tra trước. Nếu ô trên đúng → vào ngay, bỏ qua ô dưới. Nếu ô trên sai/để trống → kiểm tra ô dưới theo thứ tự. Các ô PIN hiện chỉ chấp nhận nhập bằng số (`type="password"` kèm `inputmode="numeric"`).

---

### Cách thay đổi màu đèn 3 dự án mới

Mở `src/views/LoginView.vue`, cuộn xuống cuối file (phần `/* MÀU ĐÈN CHO TỪNG MÃ PIN */`):

```css
/* 🌸 Đổi màu Hoa đào */
.blossom-mode.light-on .lamp-shade {
  fill: #ffaacc;   /* ← Đổi màu này */
}

/* ❤️ Đổi màu Dear Sun */
.heart-mode.light-on .lamp-shade {
  fill: #ff6b9d;   /* ← Đổi màu này */
}

/* 💜 Đổi màu Love Animation */
.love-mode.light-on .lamp-shade {
  fill: #c084fc;   /* ← Đổi màu này */
}
```

---

### Cách đổi PIN 3 dự án mới

Mở `src/views/LoginView.vue`, tìm `AUTH_CONFIG` (dòng ~22):

```javascript
const AUTH_CONFIG = {
  masterCode: '52014',
  accessCode: '13149',
  blossomCode: '33445',   // ← Đổi PIN Hoa đào
  heartCode: '52406',    // ← Đổi PIN Dear Sun
  loveCode: '53014',    // ← Đổi PIN Love Animation
  particleCode: '52099', // ← Đổi PIN Particle Heart
  redirects: { ... }
}
```

### Cách đổi màu đèn Particle Heart

Mở `src/views/LoginView.vue`, tìm:

```css
/* 🔥 PARTICLE MODE — Particle Heart (đỏ cam rực rỡ) */
.particle-mode.light-on .lamp-shade {
  fill: #ff1744;   /* ← Đổi màu này */
}
```
