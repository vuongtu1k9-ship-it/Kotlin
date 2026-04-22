# 📢 Social Media Automation System

Hệ thống tự động hóa nội dung (Social Automation Service) tích hợp sâu trong Backend để tự động quảng bá các ván đấu hay và thế cờ đặc sắc lên các nền tảng mạng xã hội.

---

## 🚀 Tính năng (Features)

- **🤖 Tự động hoàn toàn:** Tự động chọn nội dung, tạo hình ảnh/video và đăng bài định kỳ (mỗi 6 giờ).
- **📸 Chụp ảnh ván đấu:** Sử dụng thư viện `Sharp` để tạo hình ảnh bàn cờ độ phân giải cao từ FEN.
- **🎬 Xuất Video:** Tự động tạo video quay lại diễn biến ván đấu (cho YouTube/TikTok).
- **📊 Đa nền tảng:** Hỗ trợ Facebook (Page/Group), TikTok, và YouTube.

---

## 🛠️ Cấu hình (Configuration)

### 1. Facebook API
Các thông số định danh được lưu tại `/data/xiangqi/config.json`:
- `facebook.pageId`: ID Fanpage.
- `facebook.groupId`: ID Nhóm.
- `facebook.appId`: ID Ứng dụng Meta.

Các khóa bí mật (Secrets) phải được cấu hình trong tệp `.env`:
- `FB_APP_SECRET`: Meta App Secret.
- `FB_PAGE_TOKEN`: Long-lived Page Access Token.
- `FB_USER_TOKEN`: User Access Token (cho mục đích cá nhân).

### 2. TikTok & YouTube API
- Cấu hình qua các biến môi trường: `TIKTOK_ACCESS_TOKEN`, `YOUTUBE_API_KEY`, v.v...

---

## 📂 Cấu trúc mã nguồn
- `server/services/socialAutomationService.mjs`: Core service quản lý lịch trình và điều phối.
- `server/routes/social/`: Các API endpoint để kích hoạt đăng bài thủ công từ Admin.
- `server/utils/imageGen.mjs`: Tiện ích tạo ảnh bàn cờ.
- `server/utils/videoGen.mjs`: Tiện ích tạo video từ dữ liệu ván đấu.

---

## 🧪 Kiểm thử & Bảo trì (Testing & Maintenance)

### Đăng bài thủ công
Admin có thể sử dụng giao diện **Admin Social Manager** tại `/admin/social` để:
1. Xem lịch sử các bài đã đăng.
2. Kích hoạt đăng bài ngay lập tức cho một ván đấu cụ thể.
3. Kiểm tra trạng thái kết nối các API.

### Xem log
Sử dụng PM2 để theo dõi hoạt động của bot:
```bash
pm2 logs xiangqi-web --grep "SocialService"
```

---

> [!CAUTION]
> **Bảo mật**: Tuyệt đối không lưu trữ Access Token trong mã nguồn hoặc các tệp tài liệu công khai. Luôn sử dụng Biến môi trường (`.env`).