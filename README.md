# 🎄 LampNis Project

> Dự án tổng hợp các hiệu ứng 3D, UI tương tác và hoạt hình tĩnh.

## 💻 Công Nghệ Sử Dụng

- **Core**: Vue 3 (Composition API), Vite, TypeScript.
- **Styling & UI**: CSS thuần, phong cách Glassmorphism, Responsive Design.
- **Backend & Tracking**: Cloudflare D1 Database (Serverless SQL, bảo mật quyền riêng tư không dùng cookie).
- **Deployment**: Cloudflare Pages / Cloudflare Workers.
- **Tương tác**: Mô phỏng vật lý (Spring Physics) cho hệ thống công tắc kéo dây cơ học.

## 📂 Các Dự Án & View Đang Có

Hệ thống bao gồm các màn hình chính sau:

1. **LoginView**: Giao diện tương tác đăng nhập chính. Sử dụng hệ thống mật khẩu theo Trend mã PIN 5 số mạng Trung Quốc (vd: 52014, 13149...).
2. **HappyNewYearView**: Màn hình chúc mừng năm mới.
3. **OpenGiftView**: Màn hình hiệu ứng mở quà.
4. **HeartVortexView**: Hiệu ứng vòng xoáy trái tim 3D.
5. **WorldView**: Màn hình giao diện thế giới.
6. **BlossomView (Hoa Đào 3D)**: Wrapper hiển thị dự án hoa đào.
7. **HeartOfLoveView (Dear Sun)**: Wrapper hiển thị hiệu ứng trái tim.
8. **LoveAnimationView**: Wrapper hiển thị hoạt hình tình yêu.
9. **MemoryVaultView**: Không truy cập được (tạm khóa).

*(Lưu ý: `TwelveView` đã được gỡ bỏ khỏi dự án).*
