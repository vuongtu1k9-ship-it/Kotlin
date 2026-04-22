# Xiangqi Web - E2E Online Test Suite

Bộ kịch bản này được thiết kế để kiểm tra nhanh các tính năng thi đấu Online ở chế độ **Headless** (Chạy ngầm - Tốc độ cao).

## 📂 Thư mục chứa kịch bản
Tất cả các script nằm tại: `scripts/e2e/`

| File | Chức năng chính |
| :--- | :--- |
| `test-lobby.mjs` | Kiểm tra đồng bộ Sảnh chờ (Tạo phòng -> Hiện tại sảnh User khác). |
| `test-move.mjs` | Kiểm tra đồng bộ nước đi thực tế (Red Move -> Black Sync -> STEP Update). |
| `test-interaction.mjs` | Kiểm tra hệ thống Dialog (Xin Hòa, Xin đổi bên, Từ chối). |
| `utils.mjs` | Các hàm tiện ích (Create Context, Click Cell, Wait Sync). |

## 🚀 Cách chạy kịch bản
Mở terminal tại thư mục gốc và chạy lệnh:

```bash
# Chạy test sảnh chờ
node scripts/e2e/test-lobby.mjs

# Chạy test đồng bộ nước đi (Quan trọng)
node scripts/e2e/test-move.mjs

# Chạy test tương tác (Dialog)
node scripts/e2e/test-interaction.mjs
```

## 🛠 Lưu ý về môi trường
- **Port:** Mặc định các script sử dụng `http://localhost:3000` (User A) và `http://127.0.0.1:3000` (User B) để giả lập 2 người chơi độc lập trên cùng 1 máy.
- **Bypass:** Quyền Guest hiện đang được mở (`roomHandlers.mjs`) để phục vụ automation.
