# SPEC_learn.md - Đặc tả kỹ thuật cho việc học dự án xiangqi-web

## Thông tin dự án
- **Ngày tạo**: 2026-04-21 06:07 UTC
- **Yêu cầu gốc**: "học dự án xiangqi-web"
- **Người yêu cầu**: Đỗ Linh (@Linh020182_bot)
- **Dự án đã clone**: `/root/.openclaw/workspace/xiangqi-flutter/`

## Phân tích yêu cầu
User muốn tôi học/hiểu dự án xiangqi-web. Đây là dự án **web** (không phải Flutter) được clone từ GitHub.

## Mục tiêu học tập
1. **Hiểu cấu trúc dự án**
2. **Đọc tài liệu/README**
3. **Phân tích codebase**
4. **Tạo tài liệu học tập**
5. **Đề xuất cải tiến** (nếu có)

## Phân tích dự án xiangqi-web

### 1. Thông tin cơ bản
- **Loại dự án**: Web application (React/Vue/Next.js/Svelte?)
- **Ngôn ngữ chính**: TypeScript (có package.json, tsconfig.json)
- **Công cụ build**: Vite (vite.config.ts)
- **Thư viện UI**: Tailwind CSS (tailwind.config.js)
- **Loại dự án**: Cờ Tướng (Xiangqi) web app

### 2. Cấu trúc thư mục dự kiến (dựa trên package.json)
```
xiangqi-flutter/
├── src/              # Source code chính
│   ├── components/   # Components UI
│   ├── pages/        # Các trang
│   ├── services/     # Dịch vụ API
│   ├── utils/        # Tiện ích
│   └── ...
├── public/           # Tài nguyên tĩnh
├── server/           # Backend (Node.js?)
├── socket/           # WebSocket (game realtime?)
├── docs/             # Tài liệu
├── tests/            # Tests
├── deploy/           # Cấu hình deploy
└── package.json      # Dependencies
```

### 3. Công nghệ sử dụng (dựa trên package.json)
- **Frontend**: TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js (server/ folder)
- **Real-time**: WebSocket (socket/ folder)
- **Database**: Có thể dùng MongoDB/PostgreSQL
- **CI/CD**: GitHub Actions (.github/workflows/)
- **Testing**: Playwright (playwright.config.mjs)

### 4. Tính năng chính (dựa trên tên dự án xiangqi)
- ✅ Game Cờ Tướng (Xiangqi) online
- ✅ Multiplayer realtime
- ✅ AI opponent
- ✅ Luật chơi đầy đủ
- ✅ UI hiện đại
- ✅ Responsive design

## Kế hoạch triển khai (Agent1 - Code Agent)

### Bước 1: Đọc tài liệu dự án
1. Đọc README.md chi tiết
2. Đọc package.json để hiểu dependencies
3. Đọc tsconfig.json
4. Đọc vite.config.ts

### Bước 2: Phân tích cấu trúc
1. Liệt kê tất cả thư mục/file quan trọng
2. Đọc code trong src/
3. Đọc code trong server/
4. Đọc code trong socket/

### Bước 3: Tạo tài liệu học tập
1. Tạo file `XIANGQI_WEB_ANALYSIS.md`
2. Ghi lại:
   - Cấu trúc dự án
   - Công nghệ sử dụng
   - Tính năng chính
   - Luồng hoạt động
   - Luồng dữ liệu
   - API endpoints
   - WebSocket events
   - Database schema (nếu có)
   - Cách chạy dự án
   - Cách deploy

### Bước 4: Tạo hướng dẫn sử dụng
1. Hướng dẫn cài đặt dependencies
2. Hướng dẫn chạy dev server
3. Hướng dẫn build production
4. Hướng dẫn deploy

### Bước 5: Đề xuất cải tiến (nếu có)
1. Đề xuất tính năng mới
2. Đề xuất tối ưu code
3. Đề xuất cải tiến UI/UX
4. Đề xuất cải tiến performance

## Yêu cầu cho Code Agent (agent1)

### Input:
- SPEC_learn.md này
- Dự án xiangqi-flutter đã clone

### Output:
- OUTPUT_learn.md ghi lại:
  - Trạng thái task (success/failed)
  - Những file đã phân tích
  - Tài liệu học tập đã tạo
  - Hướng dẫn sử dụng
  - Đề xuất cải tiến (nếu có)
  - Log lỗi (nếu có)

### Gọi tiếp theo:
- Gọi Test Agent (agent2) để kiểm tra tài liệu

## Yêu cầu cho Test Agent (agent2)

### Input:
- OUTPUT_learn.md từ agent1

### Output:
- Báo cáo cho user:
  - ✅ Thành công: Tóm tắt những gì đã học được + đường dẫn tài liệu
  - ❌ Thất bại: Lỗi chi tiết + hướng khắc phục

## Cấu trúc OUTPUT_learn.md dự kiến

```markdown
# OUTPUT_learn.md - Kết quả học dự án xiangqi-web

## Trạng thái Task
- Status: ✅ SUCCESS / ❌ FAILED

## Tài liệu đã tạo
1. XIANGQI_WEB_ANALYSIS.md
2. Hướng dẫn cài đặt
3. Hướng dẫn chạy dev
4. Hướng dẫn build/deploy

## Nội dung chính
- Cấu trúc dự án
- Công nghệ sử dụng
- Tính năng chính
- Luồng hoạt động
- Cách chạy dự án
- Cách deploy
- Đề xuất cải tiến

## Next Steps
- Agent2 báo cáo cho user
- User có thể yêu cầu triển khai tính năng mới
- User có thể yêu cầu build/deploy
```

## Trạng thái hiện tại
- [x] SPEC_learn.md đã tạo
- [ ] Đã chuyển cho agent1 (Code Agent)
- [ ] Đang chờ agent2 (Test Agent) báo cáo

## Ghi chú
Dự án xiangqi-web là dự án **web** (không phải Flutter).
Cần phân tích kỹ cấu trúc, công nghệ, và tính năng trước khi đề xuất cải tiến.
