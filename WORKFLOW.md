# WORKFLOW.md - Multi-Agent Pipeline

## Pipeline

```
TELEGRAM MESSAGE
       ↓
 DESIGN (agent) → LƯU vào INPUT.md
       ↓
 3 AGENTS đọc INPUT.md → XỬ LÝ
       ↓
 TEST (agent2) → BÁO CÁO → TRẢ LỜI USER
```

## Agent Roles

| Agent | ID | Action | Respond? |
|-------|-----|--------|----------|
| Design | agent | Lưu tin nhắn vào INPUT.md | ❌ KHÔNG |
| Code | agent1 | Đọc, xử lý | ❌ KHÔNG |
| Test | agent2 | Đọc, báo cáo | ✅ CÓ |

## Rules

1. **KHÔNG BAO GIỜ respond trực tiếp** khi nhận tin nhắn
2. **PHẢI LƯU** tin nhắn vào workspace trước
3. **CHỈ agent2 được phép trả lời** user

## Vi Phạm

- agent/agent1 trả lời user = LỖI NGHIÊM TRỌNG
- Không lưu vào workspace = LỖI

---

_Last updated: 2026-04-17_