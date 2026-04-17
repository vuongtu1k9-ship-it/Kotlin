# TRAINING.md - Kotlin/Android Agent System

## System Pipeline

```
USER → DESIGN → CODING → TESTER → GITHUB → RELEASE
```

## Agent Roles

| Agent | Name | Training Focus |
|-------|------|----------------|
| agent | Design | PRD, Architecture, Task decomposition |
| agent1 | Code | Kotlin, Clean Architecture, Git workflow |
| agent2 | Test | Unit test, Logic validation, Pass/Fail |

## Training Workflow

1. **Design Agent Training**
   - Input: User requirement (natural language)
   - Output: PRD + Architecture + Tasks
   - Focus: Requirement → Spec conversion

2. **Coding Agent Training**
   - Input: Task from Design
   - Output: Kotlin source code
   - Focus: Code generation following spec

3. **Tester Agent Training**
   - Input: Code from Coding
   - Output: Pass/Fail + Bug report
   - Focus: Validation against PRD

## Retry Loop

- If Test fails → return to Coding (max 3 times)
- After 3 failures → report to user

## GitHub Actions Integration

- Auto build on pass
- Generate APK/AAB
- Create release

---

## MODULE 2: GitHub Actions Build Error Handling

### Mục tiêu
Agent tự động phát hiện, sửa lỗi build và xóa failing workflow runs.

### Bước 1: Check build errors
```bash
# Local build
cd /root/Kotlin && ./gradlew assembleDebug -x test --no-daemon 2>&1 | grep -E "^e:" | head -20

# Check GitHub Actions
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs?status=failure"
```

### Bước 2: Phân loại lỗi thường gặp
- **BuildConfig not found**: Import sai package → Fix: `com.xiangqi.client.BuildConfig`
- **Unresolved reference**: Thiếu import → Thêm import `com.openclaw.client.data.remote.*`
- **Type mismatch**: Sai kiểu → Sửa logic hoặc cast
- **Resource not found**: Thiếu file → Thêm file hoặc xóa tham chiếu

### Bước 3: Fix lỗi
```bash
# Edit file
nano /root/Kotlin/app/src/main/java/com/openclaw/client/ui/screens/MainViewModel.kt

# Rebuild
cd /root/Kotlin && ./gradlew assembleDebug -x test --no-daemon
```

### Bước 4: Xóa failing runs + Auto check + Auto fix (TỰ ĐỘNG)

**Sau mỗi PUSH CODE, agent1 PHẢI chạy TỰ ĐỘNG:**

```bash
# TỰ ĐỘNG - Chạy script (sẽ: check → xóa → fix → retry)
chạy: /root/.openclaw/workspace/utils/auto_fix_build.sh
```

**Script sẽ:**
1. Đợi build hoàn tất (max 3 phút)
2. Check kết quả → Nếu FAIL → XÓA failing runs NGAY
3. Fix lỗi local bằng Gradle
4. Push code đã fix
5. Retry (max 3 lần) cho đến khi PASS
6. Chỉ báo cáo khi đã PASS hoàn toàn

**Commands thủ công (nếu script lỗi):**
```bash
# Xóa tất cả failing runs
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs?status=failure" | jq -r '.workflow_runs[].id' | while read id; do
  gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/$id"
done

# Check kết quả
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | python3 -c "import sys,json; print(f'Total: {json.load(sys.stdin)[\"total_count\"]}')"
```

### Bước 5: Deploy
```bash
cd /root/Kotlin
git add -A
git commit -m "Fix: [mô tả lỗi]"
git push origin cotuong
```

### Nhận diện từ khóa trong log
- **"rate limit"** → Xoay API key (chạy `/root/.openclaw/keys/rotate_key.sh`)
- **"failure"** → Xóa workflow run
- **"Unresolved reference"** → Thêm import
- **"Type mismatch"** → Sửa kiểu dữ liệu
- **"Process completed with exit code 1"** → Build failed

---

## COMMANDS NHANH

```bash
# Check status
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs?per_page=5" | jq '.workflow_runs[] | "\(.run_number) \(.conclusion) \(.display_title)"'

# Delete all runs
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq -r '.[].id' | xargs -r -I{} gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/{}"
```

---

_Last updated: 2026-04-17_