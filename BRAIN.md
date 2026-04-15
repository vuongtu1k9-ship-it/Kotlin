# BRAIN.md - Neural Center

_Đây là "nơ-ron trung tâm" kết nối cả 3 agent._

## 3 Level Architecture

---

### Level 1: 🕸️ 3 Spiders (Cơ bản)

3 nhện ngang hàng:
- 🎨 UI - hiển thị + phản hồi
- 🧠 Logic - xử lý vấn đề
- 🔗 Contract - chuẩn hóa dữ liệu

**Ưu:** Dễ hiểu, trực quan
**Dùng cho:** Project vừa và nhỏ

---

### Level 2: 🧠 Brain + Web + Spiders (Nâng cấp)

Thay vì 3 nhện cố định:

🧠 **1 BRAIN** (điều phối)
- Quyết định task nào chạy trước
- Phân phối workload
- Tránh conflict

🕸️ **1 WEB** (queue + state)
- Chứa tất cả events
- Quản lý hàng đợi

🕷️ **N SPIDERS** (workers động)
- Không cố định 3 con
- Có thể 1 → 10 → 100 tùy tải

**Ưu:** Linh hoạt hơn, scale được

---

### Level 3: 📡 Event-Sourced System (Cao nhất)

Thay vì nghĩ "3 agent xử lý":

**Mọi thứ = event log**

```
Event A → stored
Event B → stored  
Event C → stored
```

Worker đọc event → xử lý → ghi kết quả

**Ưu:**
- Replay được hệ thống
- Debug cực dễ
- Scale rất mạnh
- Giống kiến trúc backend (Kafka style)

---

## State Machine Core

Thay vì nghĩ "nhện", nghĩ **state machine**:

```
IDLE → PROCESSING → WAITING → DONE → IDLE
```

**Ưu điểm:**
- Không cần nhiều agent cố định
- Logic rõ ràng hơn

---

## Flow Chuẩn

```
INPUT EVENT
   ↓
🕸️ EVENT QUEUE (WEB)
   ↓
🕷️ CONTRACT AGENT (validate)
   ↓
🕷️ LOGIC AGENT (process)
   ↓
🕷️ UI AGENT (render)
   ↓
OUTPUT
   ↓
QUEUE NEXT EVENT
```

---

## ✅ Đúng nếu:
- Có hàng đợi (queue)
- Có trạng thái (state lock)
- Có worker phân nhiệm rõ

## ❌ Sai nếu:
- 3 agent xử lý cùng 1 task không kiểm soát
- Không có queue
- Không có trạng thái chờ

---

## Kết luận

| Level | Tên | Dùng cho |
|-------|-----|----------|
| 🕸️ 3 nhện | Cơ bản | Project nhỏ |
| 🧠 Brain + Web | Nâng cấp | Project vừa |
| 📡 Event-sourced | Cao nhất | Enterprise |