# Quy Trình Huấn Luyện & Nâng Cấp Bot

## Tổng Quan

Hệ thống gồm 3 bot agents:
- **main** (@Linh020182_bot) - Main Coder & Coordinator - Tổng hợp, điều phối
- **main1** (@Linh020183_bot) - FrontendBot - Chuyên UI/UX Flutter/Web
- **main2** (@Linh020184_bot) - BackendBot - Chuyên Backend & Data

## Dự án Hiện tại

### Xiangqi (Cờ Tướng) Web App
- **Nguồn:** dffge552/xiangqi-pwa-offline (GitHub)
- **File:** `/root/.openclaw/workspace-main1/XIANGQI_SIMPLIFIED.md`
- **Trạng thái:** ✅ Basic game logic hoàn thành

### Nhiệm vụ cho bots:
- **main1 (Frontend):** Viết giao diện web, UI/UX
- **main2 (Backend):** API, data models, game logic
- **main (Coordinator):** Tổng hợp, review code

## Vai trò mỗi bot

### main (CodeSageBot)
- **Vai trò:** Main Coder & Coordinator  
- **Nhiệm vụ:** Tổng hợp, điều phối code từ main1/main2
- **Model:** minimax/m2.5:free

### main1 (FrontendBot)
- **Vai trò:** Frontend/UI Expert
- **Nhiệm vụ:** Viết widget, giao diện, animation Flutter
- **Model:** qwen/qwen3.6-plus:free

### main2 (BackendBot)
- **Vai trò:** Backend & Data Expert  
- **Nhiệm vụ:** Viết Protobuf API, xử lý logic, database
- **Model:** stepfun/step-3.5-flash:free

## Pipeline Nâng Cấp

```
LLM → Vector DB → Backend (gRPC/Protobuf)
```

### 1. LLM (Large Language Model)
- Model: stepfun/step-3.5-flash:free hoặc qwen/qwen3.6-plus:free hoặc minimax/m2.5
- Chức năng: Sinh nội dung, trả lời, huấn luyện

### 2. Vector DB
- Dùng để lưu trữ knowledge embeddings
- Cho phép tìm kiếm semantic
- Cập nhật knowledge base động

### 3. Backend - Protobuf
- gRPC services định nghĩa bằng .proto files
- Serialization hiệu quả
- Type-safe API contracts

## Nhiệm vụ mới: Auto Study Tool + Error Checker

### Tổng quan cách làm

#### Phần 1: Node.js điều khiển trình duyệt
- Dùng Puppeteer (hoặc Playwright)
- Headless = false để có thể quay màn hình

#### Phần 2: Quay video màn hình
- Dùng OBS Studio hoặc ffmpeg

### Cách 1 (dễ nhất): Node.js + OBS

**Bước 1: Cài Node.js**
```bash
node -v
```

**Bước 2: Tạo project**
```bash
mkdir auto-study
cd auto-study
npm init -y
npm install puppeteer
```

**Bước 3: Code mở web học tự động**

```javascript
const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com", { waitUntil: "networkidle2" });
  await page.type("input#search", "nodejs tutorial");
  await page.keyboard.press("Enter");
  await page.waitForSelector("ytd-video-renderer");
  const video = await page.$("ytd-video-renderer");
  await video.click();
})();
```

**Bước 4: Quay video bằng OBS**
- Cài OBS Studio
- Add Source → Display Capture
- Chọn màn hình
- Bấm Start Recording
- Chạy: `node study.js`

### Cách 2 (pro hơn): Node.js + FFmpeg tự quay

**Cài ffmpeg**

**Code quay màn hình (Windows):**
```javascript
const { spawn } = require("child_process");

const record = spawn("ffmpeg", [
  "-f", "gdigrab",
  "-framerate", "30",
  "-i", "desktop",
  "output.mp4"
]);
```

## Git Cheat Sheet cho Bot

### 🥇 Shallow Clone (clone nhẹ, không tải lịch sử)

```bash
# Clone chỉ phiên bản mới nhất - nhanh và nhẹ
git clone --depth=1 https://github.com/user/repo.git

# Giảm dung lượng từ GB → vài chục MB
```

### Các tùy chọn khác

```bash
# Clone 1 branch cụ thể
git clone --depth=1 --branch main https://github.com/user/repo.git

# Lấy 1 thư mục trong repo (sparse-checkout)
git clone --filter=blob:none https://github.com/user/repo.git

# Kiểm tra remote mà không clone
git ls-remote https://github.com/user/repo.git
```

### Khi cần full history sau đó
```bash
cd repo
git fetch --unshallow
```

## Chuyên môn: Error Checking Bot

Sau khi học xong, bạn cần:

1. **Kiểm tra lỗi Node.js**: Review code, tìm bugs, suggest fixes
2. **Kiểm tra lỗi Flutter/Android**: Build APK, log errors
3. **Automation testing**: Viết script test tự động
4. **Debug**: Giúp người dùng debug các vấn đề

### Tool cần biết:
- `node --inspect` - Debug Node.js
- `flutter doctor` - Check Flutter environment
- `adb logcat` - Check Android logs
- `puppeteer` / `playwright` - Browser automation

## Nhiệm vụ đầu tiên

1. ✅ Tạo thư mục `auto-study-tool` trong workspace - DONE
2. ✅ Viết script tạo video test - DONE (send-video.js)
3. ✅ Test gửi video lên Telegram group - DONE (Message ID: 409)
4. Tiếp theo: Viết script Puppeteer để mở web học tự động

### Nhiệm vụ mới: Android Emulator Test

**Lựa chọn tốt nhất cho server:**

🥇 Android Emulator (headless + AVD nhẹ) từ Android Studio

**Tại sao phù hợp:**
- Chạy không cần GUI (rất hợp server)
- Test UI bằng: Espresso, UI Automator, Appium
- Tạo AVD cấu hình thấp (Android 7–9 là đủ cho game cờ)

**Cách tối ưu nhẹ:**
- Dùng image x86 (không Google Play)
- Tắt animation
- RAM: ~512MB–1GB
- Độ phân giải thấp (480x800)

**Tool test khuyên dùng:**
- Appium (đa năng, dễ viết bot)
- UI Automator (nhanh, nhẹ hơn)

**Cấu hình đề xuất:**
- Android: 7.0–9.0
- RAM: 768MB
- CPU: 1 core
- GPU: off (software)

**Tips cho test game cờ tướng:**
```bash
# Disable animation để tiết kiệm CPU
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

### Kết quả test video
- Video test đã được tạo và gửi thành công lên nhóm edu
- File: test_output.mp4 (5 giây, 640x480)
- Gửi qua bot @Linh020182_bot

### Tiến độ Android Emulator
- ✅ Android SDK đã cài đặt: /root/android-sdk
- ✅ ADB đã có sẵn: Version 37.0.0
- ✅ Emulator package đã cài
- ⚠️ KVM không available (VT-x disabled) - cần chạy test trên device thật hoặc CI server

### Giải pháp thay thế
1. Test trên device thật qua ADB
2. Dùng Firebase Test Lab
3. Dùng CI/CD (GitHub Actions, GitLab CI) có sẵn Android emulator

## Kế hoạch hành động

### Phase 1: Setup (Ngày 1)
1. Tạo AVD với cấu hình nhẹ (Android 8.1, 512MB RAM)
2. Cài đặt cotuong-game APK
3. Test chạy thử

### Phase 2: Automation (Ngày 2-3)
1. Cài đặt Appium
2. Viết script test cơ bản
3. Tích hợp với bot

### Phase 3: Continuous Testing (Ngày 4+)
1. Tự động build và test APK
2. Gửi report lên Telegram
3. Error detection và notification

## Tiêu Chuẩn Tài Liệu

- Markdown format (.md)
- Code blocks có syntax highlighting
- Comments bằng tiếng Việt
- Cập nhật timestamp

## Cập Nhật Cuối Cùng
2026-04-07