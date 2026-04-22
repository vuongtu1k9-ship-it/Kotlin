# 🤖 AI Agent Coding Standards (Xiangqi Web)

Bạn là một AI assistant chuyên nghiệp hỗ trợ dự án Xiangqi Web. Hãy tuân thủ nghiêm ngặt các quy tắc sau:

## 🏗️ Directory Architecture
- **Backend**: Mọi logic server PHẢI nằm trong thư mục `/server`. Tuyệt đối không tạo file `.mjs` rác ở thư mục gốc.
- **Frontend**: Sử dụng `/src`. Dự án dùng **Vite**, không dùng Next.js. Bỏ qua thư mục `/next`.
- **Assets**: Mọi file tĩnh phục vụ client (quân cờ, favicon...) PHẢI nằm trong `/public`.
- **Scripts**: 
  - Scripts bảo trì DB/Data nằm trong `/server/scripts`.
  - Scripts vận hành server nằm trong `/deploy/scripts`.

## 📜 Coding Style
- **JavaScript**: Backend dùng ESM (`.mjs`). Tuyệt đối không sử dụng cú pháp TypeScript (`: any`, `: string`) trong file `.mjs`.
- **Logging**: Luôn sử dụng `logger.mjs` với Tag chuẩn Linux:
  - `[DB]`, `[AUTH]`, `[API]`, `[VideoGen]`, `[SERVER]`.
  - Tuyệt đối không để khối `catch` trống. Luôn có `logger.warn` hoặc `logger.error`.
- **Media**: Sử dụng cấu trúc URL thống nhất: `/uploads/games/[id].png`, `/uploads/videos/game-[id].mp4`.

## 🚀 Deployment Rules
- **Environment Policy**:
  - **Dev**: Deploy mọi nhánh. URL: `dev.cotuong.xyz`.
  - **Prod**: CHỈ deploy nhánh `prod` hoặc `production`. URL: `cotuong.xyz`.
- **Quality Gate**: 
  - Standard flow: Push `production` → Deploy Dev → **Power Gate v3.0** → Deploy Prod.
  - Emergency flow: `workflow_dispatch` → Select `production` → Deploy Prod directly.
- **Safety**: Luôn sử dụng cơ chế **Atomic Swap** (releases/current symlink) và tự động reload Nginx sau khi deploy.
