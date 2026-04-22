# SPEC_android.md - Đặc tả kỹ thuật cho việc học dự án xiangqi-android

## Thông tin dự án
- **Ngày tạo**: 2026-04-21 06:08 UTC
- **Yêu cầu gốc**: "học dự án xiangqi-android"
- **Người yêu cầu**: Đỗ Linh (@Linh020182_bot)
- **Dự án đã clone**: `/root/.openclaw/workspace/xiangqi-android/`

## Phân tích yêu cầu
User muốn tôi học/hiểu dự án xiangqi-android. Đây là dự án **Flutter Android** app.

## Mục tiêu học tập
1. **Hiểu cấu trúc dự án Flutter Android**
2. **Đọc tài liệu/README**
3. **Phân tích codebase**
4. **Tạo tài liệu học tập**
5. **Đề xuất cải tiến** (nếu có)

## Phân tích dự án xiangqi-android

### 1. Thông tin cơ bản
- **Loại dự án**: Flutter Android app
- **Ngôn ngữ chính**: Dart
- **Công cụ build**: Flutter SDK
- **Cấu trúc**: Flutter app chuẩn
- **Mục đích**: Ứng dụng Cờ Tướng (Xiangqi) trên Android

### 2. Cấu trúc thư mục dự kiến (dựa trên pubspec.yaml)
```
xiangqi-android/
├── android/          # Cấu hình Android
│   ├── app/          # Cấu hình app
│   ├── build.gradle  # Gradle config
│   └── ...
├── ios/              # Cấu hình iOS (nếu có)
├── lib/              # Source code chính
│   ├── main.dart     # Entry point
│   ├── screens/      # Các màn hình
│   ├── widgets/      # Components
│   ├── models/       # Models
│   ├── services/     # Dịch vụ
│   └── ...
├── assets/           # Tài nguyên (hình ảnh, âm thanh)
├── docs/             # Tài liệu
├── test/             # Tests
├── pubspec.yaml      # Dependencies
└── pubspec.lock      # Lock file
```

### 3. Công nghệ sử dụng (dựa trên pubspec.yaml)
- **Framework**: Flutter
- **Ngôn ngữ**: Dart
- **UI**: Flutter widgets
- **State management**: Có thể dùng Provider, Riverpod, Bloc, hoặc GetX
- **Database**: Có thể dùng Hive, SQLite, hoặc Firebase
- **API**: Có thể gọi API backend

### 4. Tính năng chính (dựa trên tên dự án xiangqi)
- ✅ Game Cờ Tướng (Xiangqi) trên Android
- ✅ UI Flutter
- ✅ State management
- ✅ Assets (hình ảnh quân cờ)
- ✅ Có thể có multiplayer
- ✅ Có thể có AI

## Kế hoạch triển khai (Agent1 - Code Agent)

### Bước 1: Đọc tài liệu dự án
1. Đọc README.md chi tiết
2. Đọc pubspec.yaml để hiểu dependencies
3. Đọc pubspec.lock
4. Đọc analysis_options.yaml

### Bước 2: Phân tích cấu trúc
1. Liệt kê tất cả thư mục/file quan trọng
2. Đọc code trong lib/
3. Đọc code trong android/
4. Đọc code trong assets/

### Bước 3: Tạo tài liệu học tập
1. Tạo file `XIANGQI_ANDROID_ANALYSIS.md`
2. Ghi lại:
   - Cấu trúc dự án
   - Công nghệ sử dụng
   - Tính năng chính
   - Luồng hoạt động
   - State management
   - Database (nếu có)
   - API integration (nếu có)
   - Cách chạy dự án
   - Cách build APK
   - Cách deploy

### Bước 4: Tạo hướng dẫn sử dụng
1. Hướng dẫn cài đặt Flutter SDK
2. Hướng dẫn chạy dev
3. Hướng dẫn build APK
4. Hướng dẫn deploy lên Google Play

### Bước 5: Đề xuất cải tiến (nếu có)
1. Đề xuất tính năng mới
2. Đề xuất tối ưu code
3. Đề xuất cải tiến UI/UX
4. Đề xuất cải tiến performance
5. Đề xuất thêm localization (tiếng Việt)

## Yêu cầu cho Code Agent (agent1)

### Input:
- SPEC_android.md này
- Dự án xiangqi-android đã clone

### Output:
- OUTPUT_android.md ghi lại:
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
- OUTPUT_android.md từ agent1

### Output:
- Báo cáo cho user:
  - ✅ Thành công: Tóm tắt những gì đã học được + đường dẫn tài liệu
  - ❌ Thất bại: Lỗi chi tiết + hướng khắc phục

## Cấu trúc OUTPUT_android.md dự kiến

```markdown
# OUTPUT_android.md - Kết quả học dự án xiangqi-android

## Trạng thái Task
- Status: ✅ SUCCESS / ❌ FAILED

## Tài liệu đã tạo
1. XIANGQI_ANDROID_ANALYSIS.md
2. Hướng dẫn cài đặt Flutter
3. Hướng dẫn chạy dev
4. Hướng dẫn build APK
5. Đề xuất cải tiến

## Nội dung chính
- Cấu trúc dự án
- Công nghệ sử dụng
- Tính năng chính
- Luồng hoạt động
- Cách chạy dự án
- Cách build APK
- Đề xuất cải tiến

## Next Steps
- Agent2 báo cáo cho user
- User có thể yêu cầu triển khai tính năng mới
- User có thể yêu cầu build APK
- User có thể yêu cầu deploy
```

## Trạng thái hiện tại
- [x] SPEC_android.md đã tạo
- [ ] Đã chuyển cho agent1 (Code Agent)
- [ ] Đang chờ agent2 (Test Agent) báo cáo

## Ghi chú
Dự án xiangqi-android là dự án **Flutter Android** app.
Cần phân tích kỹ cấu trúc, công nghệ, và tính năng trước khi đề xuất cải tiến.
