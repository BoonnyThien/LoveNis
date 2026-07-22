# Hướng Dẫn Sử Dụng & Test Thủ Công
**Dự án:** LoveNis Memory Vault (lovenis.pages.dev)

Tài liệu này hướng dẫn chi tiết cách truy cập và kiểm thử các tính năng chính của toàn bộ trang web.

---

## 1. Truy cập & Đăng nhập
**URL Kiểm thử:** [https://lovenis.pages.dev](https://lovenis.pages.dev)

Trang chủ là giao diện "Lamp Login" (Đèn ngủ tương tác 3D). Cách thao tác:
- **Bật đèn:** Nhấp chuột (hoặc chạm trên mobile) và kéo sợi dây công tắc xuống dưới rồi thả ra. Màn hình đăng nhập sẽ hiện ra với hiệu ứng Glassmorphism.
- **Đăng nhập đa quyền (Multi-PIN):**
  Hệ thống sử dụng ô Mật khẩu để điều hướng (ô Tên đăng nhập dùng cho quyền Master đặc biệt). Hãy nhập một trong các mã PIN sau vào ô **Mật khẩu**:
  - `52013` : Truy cập vào **LoveNis Memory Vault** (Kho Ký Ức 3D). *(PIN chính của dự án này)*
  - `1234` : Truy cập thiệp Happy New Year.
  - `HoaDao` : Truy cập hiệu ứng Hoa Đào 3D.
  - `DearSun` : Truy cập Heart of Love.
  - `ILoveYou` : Truy cập Love Animation.

*(Nếu nhập sai, form sẽ rung lắc và có âm thanh báo lỗi cảnh báo).*

---

## 2. Kiểm thử LoveNis Memory Vault (Nhập PIN `52013`)

Sau khi đăng nhập thành công vào Vault, bạn sẽ ở trang quản lý ký ức.

### 2.1. Tính năng Tải lên (Upload)
1. Ở góc trên, bạn sẽ thấy nút "Upload" (hoặc khu vực Drag & Drop).
2. Kéo thả hoặc click để chọn file. Hệ thống hỗ trợ:
   - **Ảnh** (`.png`, `.jpg`, `.webp`)
   - **Video** (`.mp4`, `.webm`)
   - **Âm thanh** (`.mp3`, `.wav`)
   - **3D Models** (`.glb`)
3. Điền thông tin Metadata:
   - Tiêu đề (Title)
   - Lời nhắn (Message)
   - Ngày kỷ niệm (Date)
   - Màu sắc gắn thẻ (Color Tag)
4. Nhấn Upload. Giao diện sẽ hiển thị thanh tiến trình tải lên R2. Sau khi xong, D1 Database sẽ được cập nhật và danh sách sẽ tự reload.

### 2.2. Tính năng Coverflow 3D (Lướt ngang)
- Nút chuyển đổi (Toggle): Chọn **Coverflow**.
- **Thao tác:** 
  - Dùng con lăn chuột (Scroll wheel) để lướt trái/phải.
  - Hoặc click/chạm vào các thẻ (Cards) bên cạnh để di chuyển chúng ra giữa.
  - Click vào mũi tên Trái/Phải trên màn hình.
- **Hiệu ứng mong đợi:** Thẻ ở giữa sẽ to rõ nhất, có bóng đổ (Reflection) mờ ảo phía dưới. Các thẻ phụ sẽ mờ dần và thu nhỏ về hai bên.

### 2.3. Tính năng Timeline 3D (Đường cong xoắn ốc)
- Nút chuyển đổi (Toggle): Chọn **Timeline 3D**.
- **Thao tác:**
  - Cuộn chuột (Scroll) lên/xuống để camera bay dọc theo đường cong Catmull-Rom.
  - Hoặc dùng phím mũi tên Lên/Xuống trên bàn phím.
- **Hiệu ứng mong đợi:** Khung cảnh vũ trụ với các hạt sao rơi (`Star Particles`) và sương mù (`Fog`). Ký ức đang active (nằm trong tầm nhìn camera) sẽ sáng rõ, thông tin hiển thị ở góc trái dưới, và thanh Progress Bar dọc bên phải sẽ chạy.

### 2.4. Nghe Nhạc (Audio Player)
- Đối với các file âm thanh (`.mp3`), một Audio Player tùy chỉnh (`LoveAudioPlayer`) sẽ xuất hiện.
- Nhấn Play/Pause. Vòng tròn đĩa nhạc sẽ xoay. Có thể kéo thanh thời gian (Seek bar) hoặc nhấn nút tua tới/lui 10 giây.

### 2.5. Xem Mô hình 3D (GLB Viewer)
- Đối với các file 3D (`.glb`), hệ thống sẽ tải thông qua bộ giải mã DRACO.
- Khi đang load sẽ có vòng tròn tiến trình hiển thị %.
- **Thao tác:**
  - Click & Kéo (Drag) để xoay mô hình 3D các hướng.
  - Cuộn chuột (Scroll) để phóng to / thu nhỏ.
  - Nếu mô hình có chuyển động (Animations), sẽ có các nút chọn Animation hiển thị bên dưới.

---

## 3. Kiểm thử trên Mobile
Hãy mở web trên điện thoại (hoặc dùng DevTools của Chrome bật chế độ Mobile) để test:
- **Trang Login:** Khung đăng nhập thu gọn, nền trắng viền vàng hiện rõ trên nền đèn.
- **Vuốt chạm:** Các tính năng lướt Coverflow phải nhạy với thao tác vuốt tay (Swipe).
- **Responsive:** Thanh điều hướng và nút Upload ở Vault sẽ tự động xếp chồng (Stack) cho vừa màn hình.

---
*(End of Guide)*
