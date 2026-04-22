# 🌐 Hệ thống Đa ngôn ngữ (Internationalization - i18n)

Dự án Xiangqi Web hỗ trợ trải nghiệm toàn cầu với hệ thống bản địa hóa mạnh mẽ, hỗ trợ **19 ngôn ngữ** khác nhau.

---

## 🚀 Công nghệ sử dụng

- **i18next**: Thư viện lõi xử lý dịch thuật.
- **react-i18next**: Tích hợp sâu vào React thông qua Hooks (`useTranslation`) và Components.
- **i18next-http-backend**: Lazy-loading các tệp ngôn ngữ giúp giảm dung lượng bundle ban đầu.
- **i18next-browser-languagedetector**: Tự động nhận diện ngôn ngữ của người dùng dựa trên trình duyệt hoặc cài đặt trước đó.

---

## 📂 Danh sách Ngôn ngữ hỗ trợ (19)

Hệ thống hiện hỗ trợ các mã ngôn ngữ sau:
- `vi` (Tiếng Việt - Mặc định)
- `en` (English)
- `zh` (中文 - Trung Quốc)
- `ja` (日本語 - Nhật Bản)
- `ko` (한국어 - Hàn Quốc)
- `fr` (Français - Pháp)
- `de` (Deutsch - Đức)
- `es` (Español - Tây Ban Nha)
- `ru` (Русский - Nga)
- `th` (ไทย - Thái Lan)
- `lo` (ລາວ - Lào)
- `km` (Khmer - Campuchia)
- `my` (Burmese - Myanmar)
- `ms` (Malay - Malaysia)
- `id` (Indonesian - Indonesia)
- `pt` (Português - Bồ Đào Nha)
- `it` (Italiano - Ý)
- `hi` (Hindi - Ấn Độ)
- `bn` (Bengali - Bangladesh)

---

## 🏗️ Cấu trúc thư mục

Tất cả các tệp dịch thuật được lưu trữ tại `public/locales/`:
```text
public/locales/
  vi/
    translation.json
  en/
    translation.json
  ... (các ngôn ngữ khác)
```

### Quy tắc đặt Key
Chúng tôi sử dụng cấu trúc phân cấp (Nested Keys) để quản lý dễ dàng:
- `navbar.*`: Các mục trên thanh điều hướng.
- `siteSeo.*`: Tiêu đề và mô tả SEO cho từng trang.
- `legal.*`: Nội dung Chính sách bảo mật và Điều khoản dịch vụ.
- `game.*`: Các thuật ngữ trong ván đấu.

---

## 🛠️ Hướng dẫn cho Nhà phát triển

### 1. Cách sử dụng trong Component
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('navbar.home')}</h1>;
}
```

### 2. Cách thêm ngôn ngữ mới
1. Tạo thư mục mới trong `public/locales/` (ví dụ: `fr`).
2. Sao chép tệp `translation.json` từ thư mục `en` sang thư mục mới.
3. Cập nhật danh sách `LANGUAGES` trong `src/constants/languages.ts`.
4. Chạy script đồng bộ hóa để đảm bảo không thiếu key:
   `node scripts/sync_i18n.mjs`

---

## 🔄 Quy trình Đồng bộ (Synchronization)

Để đảm bảo tất cả 19 ngôn ngữ đều có đầy đủ các key dịch mới nhất từ tiếng Việt hoặc tiếng Anh, hãy sử dụng công cụ đồng bộ hóa:
```bash
node scripts/sync_i18n.mjs
```
Script này sẽ tự động:
- Lấy danh sách key từ tệp `vi/translation.json`.
- Kiểm tra và bổ sung các key thiếu vào tất cả các ngôn ngữ khác.
- Đảm bảo cấu trúc JSON luôn đồng nhất.

---

© 2026 **Cờ Tướng Live**. Nền tảng cờ tướng đa ngôn ngữ hàng đầu.
