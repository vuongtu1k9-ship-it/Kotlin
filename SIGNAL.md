# SIGNAL.md - Agent Communication Protocol

_Giao thức truyền tin giữa các agent_

## Signal Types

### 📥 INPUT
Tin nhắn từ user hoặc external event

### 📤 OUTPUT
Kết quả trả về cho user

### 🔄 PROCESSING
Đang xử lý - chờ response

### ✅ COMPLETED
Task hoàn thành

### ❌ FAILED
Task thất bại - cần retry hoặc báo lỗi

### ⏳ WAITING
Đang chờ - xếp trong queue

## Message Schema

```json
{
  "id": "uuid",
  "type": "INPUT|PROCESSING|OUTPUT|COMPLETED|FAILED|WAITING",
  "from": "UI|LOGIC|CONTRACT",
  "to": "UI|LOGIC|CONTRACT|ALL",
  "payload": {},
  "state": "pending|processing|completed|failed",
  "timestamp": 1234567890
}
```

## Priority

| Priority | Agent | Use case |
|----------|-------|---------|
| 1 (cao nhất) | Contract | Validate, security |
| 2 | Logic | Processing, compute |
| 3 (thấp nhất) | UI | Display, feedback |

## Queue Flow

```
User → [QUEUE] → Contract → Logic → UI → User
              ↓
         [WAITING] ← conflict?
```

## State Lock

Khi 1 agent đang xử lý:
- Các agent khác phải chờ
- Không có race condition
- Đảm bảo data consistency