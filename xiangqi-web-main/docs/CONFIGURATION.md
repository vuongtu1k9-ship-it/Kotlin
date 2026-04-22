# Kiến trúc Cấu hình Hệ thống (Configuration Architecture)

Hệ thống tuân thủ mô hình tách biệt trách nhiệm giữa **Bảo mật Hạ tầng** và **Cấu hình Vận hành**.

---

## 1. `.env` — Bí mật & Hạ tầng (Secrets & Infrastructure)

**Nguyên tắc:** 
- Chứa các giá trị **không bao giờ được chia sẻ** và **không thể sửa đổi qua Web**.
- Web Admin không có quyền truy cập hay hiển thị các giá trị này.
- Cấu hình trực tiếp trên máy chủ qua file vật lý.

| Nhóm | Các biến tiêu biểu |
|------|-------|
| **Kết nối** | `MONGO_URL`, `REDIS_URL`, `PORT` |
| **Bảo mật** | `APP_JWT_SECRET`, `VAPID_PRIVATE_KEY` |
| **API Keys** | `GEMINI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `PAGESPEED_API_KEY` |

---

## 2. `data/config.json` — Cấu hình Vận hành (Mutable Config)

**Nguyên tắc:** 
- Tệp **duy nhất** chứa các cài đặt có thể thay đổi qua Admin Control Panel.
- Có thể chia sẻ cấu hình này cho Client nếu cần.
- Lưu trữ tại: `/data/xiangqi/config.json`.

**Cấu trúc mẫu:**
```json
{
  "site.maintenanceMode": false,
  "site.keywords": "cờ tướng, ...",
  "ai.defaultModel": "gemini-3.1-flash-lite-preview",
  "google.ga4PropertyId": "392362325"
}
```

---

## 3. MongoDB — Dữ liệu Ứng dụng (Application Data Only)

**Nguyên tắc:** 
- Database **CHỈ chứa dữ liệu** (Users, Matches, Puzzles...).
- **TUYỆT ĐỐI KHÔNG** lưu bất kỳ dữ liệu cấu hình nào trong database.
- Collection `site_config` đã bị loại bỏ để đảm bảo tính nhất quán (SSOT tại JSON).

---

## Luồng Đọc Cấu hình (Read Flow)

```
Backend cần JWT Secret? 
  → Đọc trực tiếp từ process.env.APP_JWT_SECRET (.env)

Backend cần trạng thái Bảo trì?
  → siteConfig.getConfig('site.maintenanceMode') (config.json)

Backend cần dữ liệu người dùng?
  → Truy vấn MongoDB (Application Data)
```

---

## Ghi chú cho Quản trị viên

- **Thiết lập Secrets:** Sửa file `.env` trên server và restart PM2.
- **Thiết lập Vận hành:** Truy cập tab **Cài đặt (Settings)** trong Admin để thay đổi trực tiếp.
- **Backup:** Chỉ cần backup thư mục `/data/xiangqi` là đủ cho toàn bộ cấu hình vận hành.
