# 🏁 CoTuong - App Cờ Tướng Kotlin

[![Build APK](https://github.com/vuongtu1k9-ship-it/Kotlin/actions/workflows/build.yml/badge.svg)](https://github.com/vuongtu1k9-ship-it/Kotlin/actions/workflows/build.yml)
[![GitHub Release](https://img.shields.io/github/v/release/vuongtu1k9-ship-it/Kotlin?include_prereleases)](https://github.com/vuongtu1k9-ship-it/Kotlin/releases)

App cờ tướng viết bằng **Kotlin** cho nền tảng **Android**, sử dụng **Jetpack Compose** cho giao diện. Dự án được tích hợp **GitHub Actions** để tự động build APK sau mỗi thay đổi.

---

## 📌 Tính năng chính

| Tính năng          | Mô tả                                                                                     | Trạng thái  |
|--------------------|-------------------------------------------------------------------------------------------|-------------|
| 🎮 Bàn cờ 9x10      | Hiển thị bàn cờ đúng luật cờ tướng Việt Nam.                                              | ✅ Hoàn thành |
| 🏃 Tương tác chạm   | Chọn và di chuyển quân cờ bằng cách chạm vào màn hình.                                   | ✅ Hoàn thành |
| 🔄 Luật chơi        | Tuân thủ luật cờ tướng: tướng, sĩ, tượng, xe, pháo, mã, tốt.                              | ✅ Hoàn thành |
| 🔄 Reset game       | Nút "Reset Game" để khởi động lại ván cờ.                                               | ✅ Hoàn thành |
| ↩️ Quay lại (Undo)  | Hoàn tác nước đi gần nhất (tối đa 3 lần).                                                 | ✅ Hoàn thành |
| 🤖 AI chơi cờ       | Máy (quân đen) có thể chơi với người dùng (thuật toán Minimax đơn giản).                  | 🟡 Đang phát triển |
| 🎨 Giao diện        | Hiển thị tên quân cờ bằng tiếng Việt (Tướng, Sĩ, Tượng, Xe, Pháo, Mã, Tốt).               | ✅ Hoàn thành |
| 📱 Multiplayer      | Chế độ chơi online 2 người (sắp triển khai).                                             | ⚪ Chưa bắt đầu |
| 💾 Lưu game         | Lưu trạng thái ván cờ để chơi tiếp sau (sắp triển khai).                                 | ⚪ Chưa bắt đầu |
| 🔊 Âm thanh          | Hiệu ứng âm thanh khi di chuyển quân cờ, ăn quân, và thắng/thua.                        | ✅ Hoàn thành     |

---

## 🚀 Cách cài đặt & chạy

### 1️⃣ Chạy trên máy local (Android Studio)

#### **Yêu cầu:**
- **Android Studio** (phiên bản mới nhất)
- **JDK 17**
- **Android SDK** (API 34)

#### **Bước 1: Clone dự án**
```bash
# Clone repository
git clone https://github.com/vuongtu1k9-ship-it/Kotlin.git
cd Kotlin

# Chuyển sang nhánh cotuong
git checkout cotuong
```

#### **Bước 2: Mở dự án trong Android Studio**
1. Mở **Android Studio**.
2. Chọn **File > Open** và chọn thư mục `Kotlin`.
3. Đợi Android Studio **đồng bộ dự án** (Gradle sẽ tải dependencies).

#### **Bước 3: Chạy app**
1. Kết nối **thiết bị Android** hoặc khởi động **emulator**.  
2. Nhấn **Run** (▶️) hoặc phím tắt `Shift + F10`.
3. App sẽ được build và chạy trên thiết bị.

---

### 2️⃣ Build APK bằng lệnh

Nếu bạn không dùng Android Studio, có thể build APK bằng lệnh:

```bash
cd Kotlin

# Cấp quyền thực thi cho gradlew (Linux/macOS)
chmod +x gradlew

# Build APK debug
./gradlew assembleDebug
```

#### **APK sẽ nằm tại:**
```
app/build/outputs/apk/debug/app-debug.apk
```

---

### 3️⃣ Tải APK từ GitHub Actions

Dự án được tích hợp **GitHub Actions** để tự động build APK sau mỗi thay đổi. Bạn có thể tải APK trực tiếp từ:

🔗 **[Tải APK mới nhất](https://github.com/vuongtu1k9-ship-it/Kotlin/actions)**

#### **Cách tải:**
1. Vào tab **Actions** trong repository.
2. Chọn workflow **"Build APK"** mới nhất.
3. Tải file `cotuong.apk` từ **artifact**.
4. Chép file `.apk` vào điện thoại và cài đặt.

---

## 🛠 Cấu trúc dự án

```
Kotlin/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions (tự động build APK)
├── app/
│   ├── build.gradle.kts       # Cấu hình Gradle cho module app
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml  # Cấu hình ứng dụng
│           └── java/com/cotuong/
│               ├── Board.kt         # Logic bàn cờ + luật chơi + Undo
│               ├── ChessView.kt     # Giao diện (Jetpack Compose + nút Undo)
│               ├── MainActivity.kt  # Điểm khởi đầu
│               └── Piece.kt         # Định nghĩa quân cờ
├── gradlew                    # Script build (Linux/macOS)
├── gradlew.bat                # Script build (Windows)
├── local.properties           # Cấu hình SDK path
└── settings.gradle.kts        # Cấu hình Gradle project
```

---

## 📂 Tài liệu tham khảo

### 1. Luật chơi cờ tướng
- [Luật chơi cờ tướng chuẩn](https://vi.wikipedia.org/wiki/C%E1%BB%9D_t%C6%B0%E1%BB%9Fng)
- **Tướng**: Di chuyển 1 ô theo chiều dọc/ngang, không ra khỏi cung.
- **Sĩ**: Di chuyển chéo 1 ô, không ra khỏi cung.
- **Tượng**: Di chuyển chéo 2 ô, không qua sông.
- **Xe**: Di chuyển thẳng không giới hạn.
- **Pháo**: Di chuyển thẳng, ăn quân phải có quân chắn.
- **Mã**: Di chuyển hình chữ L, không bị cản.
- **Tốt**: Di chuyển 1 ô về phía trước, qua sông được đi ngang.

### 2. Thuật toán AI (Minimax)
- **Mục tiêu**: Máy (quân đen) có thể chơi với người dùng.
- **Thuật toán**: Minimax đơn giản (độ sâu tìm kiếm = 2-3).
- **Điểm số**: Quân tướng (1000), sĩ (10), tượng (20), xe (50), pháo (30), mã (25), tốt (5).

### 3. GitHub Actions
- **Workflow**: [.github/workflows/build.yml](.github/workflows/build.yml)
- **Bước build**:
  - Cài đặt JDK 17
  - Cài đặt Android SDK
  - Build APK debug
  - Upload APK lên artifact

---

## 🤝 Đóng góp

Bạn muốn đóng góp vào dự án? Hãy làm theo các bước sau:

1. **Fork** repository này.
2. Tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`.
3. Commit thay đổi: `git commit -m "Add: Mô tả thay đổi"`.
4. Push lên nhánh: `git push origin feature/ten-tinh-nang`.
5. Tạo **Pull Request** vào nhánh `cotuong`.

---

## 🔊 Hiệu ứng âm thanh

App sử dụng **SoundPool** để phát hiệu ứng âm thanh khi:
- Di chuyển quân cờ (`sound_move.mp3`)
- Thắng/thua (`sound_win.mp3`)

### **Cách thay đổi file âm thanh:**
1. Thay thế file trong thư mục:
   ```
   app/src/main/res/raw/
   ```
2. Đổi tên file thành:
   - `sound_move.mp3` (âm thanh di chuyển)
   - `sound_capture.mp3` (âm thanh ăn quân)
   - `sound_win.mp3` (âm thanh thắng/thua)

---

## ↩️ Hướng dẫn sử dụng tính năng Quay lại (Undo)

Tính năng **Quay lại (Undo)** cho phép bạn hoàn tác nước đi gần nhất (tối đa 3 lần).

### **Cách sử dụng:**
1. Sau khi di chuyển quân cờ, nút **"Quay lại"** sẽ sáng lên.
2. Nhấn nút **"Quay lại"** để hoàn tác nước đi gần nhất.
3. Bạn có thể hoàn tác **tối đa 3 nước đi gần nhất**. Sau đó, nút sẽ mờ đi.

### **Lưu ý:**
- Tính năng **Undo** chỉ hoạt động trong ván cờ hiện tại.
- Khi **Reset Game**, lịch sử hoàn tác sẽ bị xóa.
   - `sound_capture.mp3` (âm thanh ăn quân)
   - `sound_win.mp3` (âm thanh thắng/thua)

### **Cách tắt hiệu ứng âm thanh:**
Xóa hoặc đổi tên file `.mp3` trong thư mục `raw`.

---

## 📜 Giấy phép

Dự án này được phát hành dưới giấy phép **MIT License**.

```
MIT License

Copyright (c) 2026 Linh

Permission is hereby granted... (xem file LICENSE)
```

---

## 📬 Liên hệ

Nếu bạn có câu hỏi hoặc đề xuất tính năng mới, hãy liên hệ:
- **GitHub**: [@vuongtu1k9-ship-it](https://github.com/vuongtu1k9-ship-it)
- **Email**: vuongtu1k9@gmai.com (thay thế bằng email thật nếu cần)

---

## 🎯 Kế hoạch phát triển tiếp theo

| Tính năng          | Mô tả                                                                                     | Ưu tiên |
|--------------------|-------------------------------------------------------------------------------------------|---------|
| 🤖 AI chơi cờ       | Hoàn thiện thuật toán Minimax (độ sâu 3-4) + tối ưu hiệu suất.                           | Cao     |
| 🔗 Multiplayer      | Thêm chế độ chơi online 2 người qua WebSocket/Firebase.                                  | Cao     |
| 🎨 Hình ảnh quân cờ | Thay thế text bằng hình ảnh cho từng loại quân cờ.                                       | Trung   |
| 💾 Lưu game         | Lưu trạng thái ván cờ vào SharedPreferences hoặc Firebase.                                | Trung   |
| ↩️ Quay lại (Undo)  | Cải thiện UI/UX cho nút Undo (ví dụ: animation).                                          | Thấp    |

---

## 📸 Ảnh chụp màn hình (sẽ cập nhật sau)

| Màn hình           | Mô tả                                                                                     |
|--------------------|-------------------------------------------------------------------------------------------|
| ![Bàn cờ](https://via.placeholder.com/300x500) | Bàn cờ 9x10 hiển thị đúng luật chơi.                                                     |
| ![AI chơi](https://via.placeholder.com/300x500) | Máy (quân đen) đang chơi với người dùng.                                                  |

---

## 🔥 Cảm ơn bạn đã sử dụng dự án!

Nếu bạn thấy dự án hữu ích, hãy **star ⭐** repository này nhé!

```
🌟 Star dự án: https://github.com/vuongtu1k9-ship-it/Kotlin
```# trigger
