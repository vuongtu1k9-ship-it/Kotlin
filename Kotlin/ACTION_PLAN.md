# Kế hoạch Hành Động - Auto Test Bot

## Phase 1: Setup (Ngày 1)

### 1.1 Tạo AVD (Android Virtual Device)
- Cấu hình: Android 8.1 (API 27)
- RAM: 512MB
- CPU: 1 core
- GPU: off (software rendering)
- Resolution: 480x800

### 1.2 Cài đặt môi trường
- Cài Android SDK (✅ Đã xong)
- Cài ADB (✅ Đã xong)
- Tiếp: Tạo AVD

### 1.3 Test chạy thử
- Build APK từ cotuong-game
- Install lên emulator
- Kiểm tra chạy được

## Phase 2: Automation (Ngày 2-3)

### 2.1 Cài đặt Appium
- Node.js server
- WebDriver client

### 2.2 Viết script test
- Test case: Mở app, click start, kiểm tra bàn cờ
- Screenshot khi lỗi
- Log errors

### 2.3 Tích hợp với bot
- Gọi test từ Telegram
- Gửi kết quả về Telegram

## Phase 3: Continuous Testing (Ngày 4+)

### 3.1 Tự động build và test
- Git webhook trigger
- Auto build APK
- Auto test trên emulator

### 3.2 Reporting
- Gửi report lên Telegram
- Error detection
- Notification khi có lỗi

## Commands cần chạy

```bash
# Tạo AVD
avdmanager create avd -n cotuong_test -k "system-images;android-27;default;x86_64"

# Chạy emulator (headless)
emulator -avd cotuong_test -no-window -no-audio -no-boot-anim

# Install APK
adb install cotuong-game.apk

# Test với Appium
appium &
node test-script.js
```

## Monitoring

- Log: `/tmp/openclaw/openclaw-2026-04-07.log`
- Video output: `/root/.openclaw/workspace-main1/auto-study-tool/`
- Report: Gửi về Telegram group -1003647318348