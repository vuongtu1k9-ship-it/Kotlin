# Quy trình Triển khai (Deployment)

Dự án sử dụng GitHub Actions và Self-hosted Runners để triển khai tự động.

## 🌍 Phân lớp Môi trường

| Môi trường | Host | URL | Đặc điểm |
| :--- | :--- | :--- | :--- |
| **Development** | `192.168.1.23` | `dev.cotuong.xyz` | **Deploy mọi nhánh**. Phục vụ test tính năng mới. |
| **Production** | `192.168.80.139` | `cotuong.xyz` | CHỈ deploy nhánh `production` hoặc `prod`. |

---

## 🏗️ Kiến trúc Hạ tầng (Infrastructure)

Hệ thống vận hành qua 4 lớp để đảm bảo an toàn và tốc độ:

1.  **HAProxy**: Cân bằng tải, xử lý SSL.
2.  **Varnish**: Cache nội dung tĩnh và kết quả API.
3.  **Nginx**: Web server phục vụ file `dist/` và Proxy tới Node.js.
4.  **Node.js (PM2)**: Backend logic chạy tại Port `3001`.

**Timeout Config**: Tất cả các lớp đều được cấu hình timeout **600s** để hỗ trợ quá trình sinh video ván đấu dài.

---

## 🚀 Quy trình Triển khai (CI/CD Pipeline)

Dự án áp dụng cơ chế **Quality Gate** tự động để bảo vệ môi trường Production.

### 1. Quy trình Tiêu chuẩn (Standard)
Khi có hành động `push` vào nhánh `production`:
1.  **Giai đoạn 1**: Hệ thống tự động triển khai lên server **Dev**.
2.  **Giai đoạn 2**: Chạy bộ test **Xiangqi Power Gate v3.0** (Full mode) trên server Dev.
3.  **Giai đoạn 3**: Nếu và chỉ nếu Giai đoạn 2 thành công (`Success`), hệ thống mới kích hoạt triển khai lên server **Production**.

### 2. Quy trình Khẩn cấp (Hotfix Bypass)
Trong trường hợp cần sửa lỗi cực nhanh trên Prod mà không muốn đợi Dev:
1.  Truy cập GitHub Actions -> Chọn workflow "Deploy to Server".
2.  Nhấn "Run workflow".
3.  Tại dropdown **Target environment**, chọn **`production`**.
4.  Hệ thống sẽ bỏ qua Dev và triển khai thẳng lên Prod.

---

## 🛠️ Xử lý sự cố (Troubleshooting)

### ❌ Lỗi "Quality Gate failed: BROKEN OG:IMAGE"
Nếu script kiểm tra SEO thất bại do không tìm thấy ảnh (404/500):
1. **Kiểm tra `.gitignore`**: Đảm bảo không có quy tắc nào chặn thư mục `public/assets/`.
2. **Kiểm tra tệp tin trên Server**: SSH vào server và kiểm tra thư mục `/var/www/xiangqi-web-dev/current/public/assets/`.
3. **Đồng bộ thủ công**: Nếu cần, chạy lệnh `rsync -avz public/assets <server_ip>:<deploy_path>/current/public/`.

---

## 🧹 Bảo trì Hệ thống (Maintenance)

### 1. Dọn dẹp ổ cứng (Disk Cleanup)
Hệ thống triển khai sử dụng cơ chế `releases` để rollback nhanh, điều này có thể chiếm nhiều dung lượng. 
Định kỳ chạy lệnh sau trên server để giữ lại 3 bản release mới nhất:
```bash
cd /var/www/xiangqi-web-dev/releases && ls -t | tail -n +4 | xargs -r rm -rf
```

### 2. Dọn dẹp Cache
- **Apt Cache**: `sudo apt-get clean`
- **NPM Cache**: `npm cache clean --force`
- **PM2 Logs**: `pm2 flush` (Xóa trắng log hiện tại)
