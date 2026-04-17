# OpenClaw Agents Operation Guide - Kotlin/Android Auto Agent System

## Pipeline: TELEGRAM → SHARED WORKSPACE → 3 BOTS → MERGE → CI/CD → APK → REVIEW → TELEGRAM

```
     ┌─────────────────────────────────────────────────────────────────────┐
     │                        TELEGRAM BOT                                 │
     │                  Linh@020182_bot (INPUT/OUTPUT)                    │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓↑
     ┌─────────────────────────────────────────────────────────────────────┐
     │              SHARED WORKSPACE FILE (SPEC/CONTEXT)                  │
     │              File tổng hợp - cả 3 bots đều đọc/ghi                 │
     └─────────────────────────────────────────────────────────────────────┘
                    ↓              ↓              ↓
          ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
          │   DESIGN   │    │    CODE     │    │   REVIEW    │
          │    BOT      │    │    BOT      │    │   + FIX     │
          └─────────────┘    └─────────────┘    └─────────────┘
                    ↓              ↓              ↓
     ┌─────────────────────────────────────────────────────────────────────┐
     │              SHARED WORKSPACE FILE (OUTPUT)                         │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓
     ┌─────────────────────────────────────────────────────────────────────┐
     │              MERGE OUTPUT CONTROLLER                               │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓
     ┌─────────────────────────────────────────────────────────────────────┐
     │              CI/CD (GitHub Actions)                                 │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓
     ┌─────────────────────────────────────────────────────────────────────┐
     │              APK BUILD                                              │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓
     ┌─────────────────────────────────────────────────────────────────────┐
     │              FINAL REVIEW GATE                                      │
     └─────────────────────────────────────────────────────────────────────┘
                                      ↓↑
     ┌─────────────────────────────────────────────────────────────────────┐
     │                        TELEGRAM BOT                                 │
     │                  Linh@020182_bot (RESPONSE)                         │
     └─────────────────────────────────────────────────────────────────────┘
```

---

## 3-Bot System (Parallel Workers)

| Bot | Name | Role | Action |
|-----|------|------|--------|
| Design | Design Bot | Thiết kế | Tạo SPEC/CONTEXT |
| Code | Code Bot | Viết code | Code + GitHub Actions |
| Tester | Tester Bot | Test + Review | Test + Review + Fix |

---

## Pipeline Flow

```
USER (gửi tin nhắn Telegram)
    ↓
Telegram Bot (Linh@020182_bot)
    ↓
SHARED WORKSPACE FILE (SPEC/CONTEXT)
    ↓
    ├─ Design Bot → SPEC
    ├─ Code Bot → CODE
    └─ Tester Bot → TEST + REVIEW
    ↓
MERGE OUTPUT CONTROLLER
    ↓
GitHub Actions CI/CD
    ↓
APK BUILD
    ↓
TESTER báo cáo cho USER ←───────
    ↓                                │
FINAL REVIEW GATE                   │
    ↓                                │
    ├─ FAIL → quay lại Code Bot
    ↓                                │
    └─ PASS → Telegram Bot → USER ←─┘
```

**Luồng báo cáo:**
- Tester Bot chạy test → báo cáo kết quả cho USER
- Code Bot push lên GitHub → USER được thông báo
- Sau APK Build → Tester báo cáo cuối cùng cho USER

---

## Bot Responsibilities

### Design Bot
- Nhận yêu cầu từ Shared Workspace
- Phân tích và tạo SPEC/CONTEXT
- Thiết kế architecture (MVVM/Clean Architecture)
- Output: SPEC file trong workspace chung

### Code Bot
- Nhận SPEC từ workspace
- Viết Kotlin code theo spec
- Tạo CI/CD Pipeline (GitHub Actions)
- Output: Code + Workflow trong workspace chung

#### GitHub Actions Error Handling (BẮT BUỘC - SAU MỖI PUSH)

Sau khi **PUSH CODE LÊN GITHUB**, Code Bot PHẢI thực hiện **TỰ ĐỘNG** (KHÔNG cần user nhắc):

```
1. PUSH CODE
2. CHỜ build (2-5 phút)
3. CHECK kết quả: gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs"
4. NẾU FAIL → XÓA NGAY failing runs
5. FIX lỗi locally nếu cần
6. PUSH lại code đã fix
7. REPEAT bước 2-6 cho đến khi PASS
8. CHỈ BÁO CHO agent2 (Test) khi đã PASS
```

**Commands tự động:**
```bash
# Check kết quả
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq '.workflow_runs[0].conclusion'

# Xóa failing runs (TỰ ĐỘNG khi phát hiện "failure")
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs?status=failure" | jq -r '.workflow_runs[].id' | while read id; do
  gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/$id"
done

# Fix lỗi local và retry
cd /root/Kotlin && ./gradlew assembleDebug -x test --no-daemon
```

**LUẬT VÀNG:**
- ❌ KHÔNG báo cáo cho user khi build đang FAIL
- ❌ KHÔNG để failing runs tồn tại sau khi push
- ✅ PHẢI retry cho đến khi build PASS
- ✅ PHẢI xóa failing runs TRƯỚC KHI báo cáo

**TỰ ĐỘNG HÓA:** Chạy script:
```bash
/root/.openclaw/workspace/utils/auto_fix_build.sh
```
Script sẽ: Check build → Xóa failing runs → Fix lỗi → Retry (max 3 lần)

### Review+Fix Bot
- Đọc output từ Design Bot và Code Bot
- Validate code vs SPEC
- Kiểm tra CI/CD pipeline
- Báo cáo lỗi nếu có
- Quyết định Pass/Fail
- Output: Review report trong workspace

#### GitHub Actions Failure Check (BẮT BUỘC)

Review+Fix Bot PHẢI kiểm tra sau mỗi push:

1. **Check build status:**
   ```bash
   gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq '.workflow_runs[0] | {status: .conclusion, title: .display_title}'
   ```

2. **Nếu có failing runs → XÓA ngay:**
   ```bash
   # Xóa tất cả failing runs
   gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs?status=failure" | jq -r '.workflow_runs[].id' | while read id; do
     gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/$id"
   done
   ```

3. **Report kết quả:** PASS hoặc FAIL + lỗi chi tiết

**TỰ ĐỘNG HÓA:** Chạy script:
```bash
/root/.openclaw/workspace/utils/auto_fix_build.sh
```

### Merge Output Controller
- Tổng hợp output từ 3 bots
- Điều phối luồng chạy tiếp theo
- Gửi kết quả sang CI/CD

### Final Review Gate
- Kiểm tra APK cuối cùng
- Đảm bảo đạt chuẩn trước khi release
- Trả kết quả về Telegram Bot

---

## Startup (Bắt buộc)

Before execution:
1. Read SOUL.md
2. Read USER.md
3. Read IDENTITY.md
4. Read latest memory/
5. Read WORKFLOW.md (nếu có)

---

## 🚨 WORKFLOW RULE (BẮT BUỘC)

### KHI NHẬN TIN NHẮN TỪ TELEGRAM:

- **agent (Design)** → LƯU vào INPUT.md → **KHÔNG trả lời**
- **agent1 (Code)** → ĐỌC INPUT.md → XỬ LÝ → **KHÔNG trả lời**
- **agent2 (Test)** → ĐỌC INPUT.md → BÁO CÁO → **TRẢ LỜI user**

### TUÂN THEO PIPELINE:
```
USER → DESIGN (lưu) → CODE (xử lý) → TEST (báo cáo + trả lời)
```

**VI PHẠM**: Nếu agent/agent1 trả lời user trực tiếp → LỖI NGHIÊM TRỌNG

---

# 🔥 CORE RULE (CRITICAL)

> OUTPUT MUST ALWAYS BE A CLEAN STRING

## 🚨 FORBIDDEN - Auto-Reject If Present

- `[object Object]` (ANY appearance → REJECT & fix)
- `HEARTBEAT_OK` in normal responses (strip it)
- String concatenation with raw objects
- Template strings embedding objects directly

## Output Sanitizer (Run BEFORE sending response)

```javascript
function sanitize(text) {
  if (!text) return "";
  let out = String(text);
  // Remove [object Object] patterns
  out = out.replace(/\[object Object\]+/g, "");
  // Clean HEARTBEAT_OK unless it's a genuine heartbeat response
  if (!out.toLowerCase().includes("heartbeat")) {
    out = out.replace(/HEARTBEAT_OK/g, "");
  }
  return out.replace(/\s+/g, " ").trim();
}
```

## Response Decision Tree

```
Is this a heartbeat-only check?
├── YES → Reply: "HEARTBEAT_OK" only
└── NO → 
    └── Does output contain [object Object]?
        ├── YES → FIX (extract or JSON.stringify) → retry
        └── NO → Does output end with HEARTBEAT_OK?
            ├── YES → Strip HEARTBEAT_OK → send clean response
            └── NO → Send response
```

---

# 🔥 OUTPUT PIPELINE (ENFORCED)

ALL agents MUST follow:

1. Import hàm `normalizePayload` từ `utils/normalize.js`:
   ```js
   const { normalizePayload } = require('./utils/normalize');
   ```
2. Áp dụng hàm này cho mọi output:
   ```js
   const output = normalizePayload(payload);
   ```
3. Đảm bảo output luôn là **clean string** trước khi trả về:
   ```
   input → processing → normalize → STRING → output
   ```

---

## ✅ Normalize Function (MANDATORY)

**All agents MUST import and use this function from `utils/normalize.js`:**

```js
const { normalizePayload } = require('./utils/normalize');

// Use before returning output
const output = normalizePayload(payload);
```

**Why this is required:**
- Prevents `[object Object]` in output
- Handles heartbeat messages
- Extracts text from object responses
- Ensures clean string output