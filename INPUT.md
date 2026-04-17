# INPUT.md - Shared Workspace Input

## Task hiện tại

> Build bản mới trên GitHub mà không tự xóa bản build lỗi và không tự check lỗi khi bị lỗi. Tôi vẫn phải nhắc nhở.

---

## Yêu cầu cho Agent1 (Code)

**SAU KHI PUSH CODE LÊN GITHUB, AGENT1 PHẢI TỰ ĐỘNG:**

1. ⏳ **CHỜ** build hoàn tất (2-5 phút)
2. 🔍 **CHECK** kết quả: `gh api repos/vuongtu1k9-ship-it/Kotlin/actions/runs`
3. ❌ **NẾU FAIL**: XÓA failing runs NGAY
4. 🔧 **FIX** lỗi locally nếu cần
5. 🔁 **RETRY** cho đến khi PASS
6. ✅ **CHỈ BÁO** cho Agent2 khi đã PASS

**ĐÂY LÀ LUẬT VÀNG - KHÔNG ĐƯỢC QUÊN!**

---

## Processing Status

- **DESIGN**: chờ
- **CODE**: đang xử lý
- **TEST**: chờ báo cáo