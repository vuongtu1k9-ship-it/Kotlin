# Hướng dẫn Tối ưu Hiệu năng, SEO và Accessibility (Xiangqi Web)

Tài liệu này ghi chép lại các quy tắc và tiêu chuẩn kỹ thuật đã được áp dụng để đạt điểm số Lighthouse 90+ và đảm bảo trải nghiệm người chơi mượt mà.

## 🚀 1. Hiệu năng (Performance)

### 1.1. Largest Contentful Paint (LCP) & Tải tài nguyên
- **Non-blocking Fonts:** Sử dụng kỹ thuật `media="print"` để tải Google Fonts bất đồng bộ.
- **Preloading:** Preload các quân cờ SVG (`/pieces/*.svg`) và font chữ chính trong `index.html`.
- **Skeleton Synchronization:** Đảm bảo Typography của Skeleton trong `index.html` khớp 100% với CSS của React app (ví dụ: font-size h1) để tránh LCP render delay.

### 1.2. Chống nhảy Layout (Cumulative Layout Shift - CLS)
- **Footer Stability:** Thiết lập `contain-intrinsic-size` và `min-height` cho Footer khớp với kích thước render thực tế (~400px). Đảm bảo Suspense fallback có chiều cao tương đương.
- **Reserved Space:** Luôn thiết lập `min-height` cho các container chứa dữ liệu động (Lobby, Player List).
- **AuthBar:** Cố định `min-w-[120px]` cho khu vực đăng nhập.

### 1.3. Tối ưu Render & Media
- **Content Visibility:** Sử dụng `content-visibility: auto` cho Footer và các section lớn ở cuối trang.
- **Image Delivery:** Sử dụng đúng kích thước ảnh (ví dụ: Avatar 40x40 thay vì tải 150x150). Ưu tiên định dạng WebP hoặc SVG.
- **Memoization:** Sử dụng `React.memo` cho các component hiển thị bàn cờ (MiniBoard, Piece).

---

## 🔍 2. SEO (Search Engine Optimization)

### 2.1. Phân cấp tiêu đề (Heading Hierarchy)
- **Quy tắc:** Chỉ duy nhất một thẻ `<h1>` mỗi trang. Tuân thủ thứ tự `<h2>` -> `<h3>` -> `<h4>`.

### 2.2. Dữ liệu cấu trúc (Structured Data)
- **JSON-LD:** Tích hợp cho trang chủ, trang ván đấu và trang cờ thế.
- **Media Meta:** Đảm bảo `og:video` và `og:image` được sinh động theo từng ID ván đấu/cờ thế.

---

## ♿ 3. Khả năng truy cập (Accessibility)

### 3.1. Nhãn cho nút Icon (Aria Labels)
- Mọi nút bấm chỉ có icon BẮT BUỘC phải có `aria-label`.

### 3.2. Độ tương phản
- Đảm bảo độ tương phản chữ/nền đạt chuẩn WCAG, đặc biệt trong chế độ Dark Mode.

---

## 🏗️ 4. Quy tắc Code (Development Rules)

1. Tránh sử dụng `mt-auto` trong container Flexbox không có chiều cao cố định.
2. Sử dụng `LazyMount` cho các thành phần nặng nằm ngoài màn hình đầu tiên.
3. Luôn kiểm tra Lighthouse sau khi thay đổi Layout lớn.
