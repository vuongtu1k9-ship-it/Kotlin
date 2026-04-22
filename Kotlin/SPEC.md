# SPEC.md - Cờ Tướng Kotlin Project Specification

## 📋 Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | Cờ Tướng Kotlin (Xiangqi Android App) |
| **Language** | Kotlin |
| **Platform** | Android |
| **UI Framework** | Jetpack Compose |
| **Architecture** | Clean Architecture (Repository Pattern) |
| **Repository** | https://github.com/vuongtu1k9-ship-it/Kotlin |
| **Workspace** | /root/.openclaw/workspace/Kotlin |

---

## 🎯 Project Status (from existing codebase)

### ✅ Already Implemented
- ✅ Full Xiangqi game rules
- ✅ Local game storage (GameRepository)
- ✅ Clean architecture with GameRepository
- ✅ Compose UI components
- ✅ Board.kt, Game.kt, Piece.kt, Main.kt
- ✅ Removed Supabase dependency
- ✅ Fixed board display, piece movement, turn management

### ⚠️ Current Issues (from HEARTBEAT.md)
- ❌ AI đánh cờ hoạt động: Chưa có AI opponent
- ❌ Unit tests: Chưa có unit tests
- ❌ Build Gradle: Chưa verify build
- ❌ Deploy: Chưa lên GitHub Releases
- ❌ 100% coverage: Chưa đạt

---

## 🚀 Next Steps (Từ ACTION_PLAN.md)

### Phase 1: Setup & Verification
1. **Build APK** từ codebase hiện tại
2. **Kiểm tra build** thành công
3. **Chạy thử app** trên emulator
4. **Validate game rules**

### Phase 2: Automation & Testing
1. **Tạo AVD (Android Virtual Device)**
   - Android 8.1 (API 27)
   - RAM: 512MB
   - Resolution: 480x800
   - Headless mode

2. **Cài đặt môi trường test**
   - Android SDK ✅
   - ADB ✅
   - AVD manager

3. **Viết test automation**
   - Test case: Mở app, click start, kiểm tra bàn cờ
   - Screenshot khi lỗi
   - Log errors

### Phase 3: CI/CD Integration
1. **Cập nhật GitHub Actions**
   - Auto build APK
   - Auto test trên emulator
   - Auto deploy lên GitHub Releases

2. **Tích hợp với Telegram bot**
   - Gọi test từ Telegram
   - Gửi kết quả về Telegram

---

## 📝 Technical Details

### Project Structure (from README.md)
```
xiangqi-apk/
├── app/
│   ├── src/main/java/com/xiangqi/
│   │   ├── MainActivity.kt          # Main entry point
│   │   ├── data/
│   │   │   ├── GameRepository.kt    # Local game storage
│   │   │   ├── Models.kt             # Game data models
│   │   ├── game/
│   │   │   ├── XiangqiEngine.kt     # Game logic and rules
│   │   ├── ui/
│   │   │   └── GameScreen.kt        # UI components
```

### Key Files (from ls output)
- **Board.kt** - Bàn cờ logic
- **Game.kt** - Game state management
- **Piece.kt** - Quân cờ model
- **Main.kt** - Entry point
- **GameRepository.kt** - Local storage
- **build.gradle** - Build configuration

---

## 🎯 SPECIFICATION FOR AGENT1 (Code Agent)

### Task: Triển khai automation test cho Cờ Tướng Kotlin

#### Bước 1: Build & Verify
```bash
cd /root/.openclaw/workspace/Kotlin
./gradlew assembleDebug
```

**Expected:** Build successful, APK at: `app/build/outputs/apk/debug/app-debug.apk`

#### Bước 2: Tạo AVD cho test automation
```bash
# Tạo AVD
avdmanager create avd -n cotuong_test -k "system-images;android-27;default;x86_64"

# Chạy emulator headless
emulator -avd cotuong_test -no-window -no-audio -no-boot-anim &
```

#### Bước 3: Viết test automation script
**File:** `/root/.openclaw/workspace/Kotlin/auto-test.sh`

**Nội dung:**
```bash
#!/bin/bash

# Auto test script for Cờ Tướng Kotlin
set -e

cd /root/.openclaw/workspace/Kotlin

echo "🔄 Bước 1: Build APK..."
./gradlew assembleDebug

APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ ! -f "$APK_PATH" ]; then
    echo "❌ Build thất bại!"
    exit 1
fi

echo "✅ Build thành công! APK: $APK_PATH"

# Kiểm tra emulator
if ! adb devices | grep -q "emulator"; then
    echo "🚀 Bước 2: Khởi động emulator..."
    emulator -avd cotuong_test -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect &
    sleep 30  # Chờ emulator khởi động
fi

echo "📱 Bước 3: Install APK..."
adb install -r -t "$APK_PATH"

# Chạy test
# TODO: Viết test cases cụ thể

echo "✅ Test automation completed!"
```

#### Bước 4: Tạo test cases
**File:** `/root/.openclaw/workspace/Kotlin/cotuong-test-plan.md`

**Nội dung:** (Update existing file)

**Test Cases:**
1. **TC-001: Mở app**
   - Mô tả: Kiểm tra app khởi động được
   - Bước: adb shell am start -n com.xiangqi/.MainActivity
   - Expected: App mở thành công

2. **TC-002: Hiển thị bàn cờ**
   - Mô tả: Kiểm tra bàn cờ hiển thị đúng
   - Bước: Chụp screenshot, kiểm tra pixel
   - Expected: Bàn cờ hiển thị đầy đủ

3. **TC-003: Di chuyển quân cờ**
   - Mô tả: Kiểm tra luật di chuyển quân cờ
   - Bước: Click vào quân Tốt, di chuyển
   - Expected: Quân cờ di chuyển theo luật

4. **TC-004: Lưu game**
   - Mô tả: Kiểm tra lưu game local
   - Bước: Chơi vài nước, thoát app, mở lại
   - Expected: Game được lưu, load lại đúng

5. **TC-005: Kiểm tra chiếu tướng**
   - Mô tả: Kiểm tra luật chiếu tướng
   - Bước: Di chuyển quân khiến tướng bị chiếu
   - Expected: Hiển thị "Chiếu tướng!"

---

## 📊 Success Criteria

### Build & Deploy
- [ ] ✅ Build Gradle thành công
- [ ] ✅ APK được tạo (app-debug.apk)
- [ ] ✅ Deploy lên GitHub Releases
- [ ] ✅ Version: v1.0.0

### Test Automation
- [ ] ✅ AVD cotuong_test tồn tại
- [ ] ✅ Emulator chạy headless
- [ ] ✅ APK install thành công
- [ ] ✅ Test cases chạy được
- [ ] ✅ Screenshot khi lỗi
- [ ] ✅ Log errors chi tiết

### Code Quality
- [ ] ✅ Unit tests pass (100% coverage)
- [ ] ✅ Build không warning
- [ ] ✅ Clean architecture maintained
- [ ] ✅ No memory leaks

---

## 🚦 Priority & Timeline

### Priority: P0 (Critical)
- Build APK
- Tạo AVD
- Viết test automation
- Validate game rules

### Timeline: 1-2 days
- Phase 1: Setup (Today)
- Phase 2: Automation (Tomorrow)
- Phase 3: CI/CD (Day after)

---

## 📚 References

- **Repository**: https://github.com/vuongtu1k9-ship-it/Kotlin
- **ACTION_PLAN.md**: Kế hoạch action chi tiết
- **README.md**: Hướng dẫn build & deploy
- **HEARTBEAT.md**: Trạng thái hệ thống
- **XIANGQI_SIMPLIFIED.md**: Luật cờ tướng đơn giản

---

## 🎯 Output Expected from agent1

1. **OUTPUT.md** với:
   - Trạng thái build (success/fail)
   - Đường dẫn APK
   - Kết quả test automation
   - Log errors (nếu có)

2. **File mới tạo:**
   - `/root/.openclaw/workspace/Kotlin/auto-test.sh`
   - Update `/root/.openclaw/workspace/Kotlin/cotuong-test-plan.md`

3. **AVD cotuong_test** được tạo

4. **agent2 (Test)** sẽ validate kết quả

---

## ⚠️ Important Notes

### Từ AGENTS.md & SOUL.md:
- **agent (Design)** KHÔNG được trả lời user
- **agent1 (Code)** KHÔNG được trả lời user
- **Chỉ agent2 (Test)** được trả lời user

### Workflow:
```
INPUT.md (user request) → SPEC.md (this file) → agent1 (triển khai) → OUTPUT.md → agent2 (validate & response)
```

### Nếu build fail:
- Xem log lỗi
- Fix code
- Update CHANGELOG.md
- Commit + push lại

---

## 📝 Created
2026-04-21 10:35 UTC
By: OpenClaw Multi-Agent System
Purpose: Auto test automation for Cờ Tướng Kotlin
