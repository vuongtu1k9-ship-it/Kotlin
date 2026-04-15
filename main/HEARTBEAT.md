# Heartbeat Checklist

## Mỗi 30 phút
- [ ] Kiểm tra GitHub Actions workflow status
  - Check: gh run list --limit 5
  - Nếu fail: ghi log và nhắn cho user

## Mỗi giờ
- [ ] Check workspace Kotlin có cập nhật mới không
  - git fetch && git status
  - Nếu có commit mới: tổng hợp thông báo

## Mỗi ngày (8h sáng)
- [ ] Tóm tắt hoạt động
  - Số commit hôm qua
  - Build status
  - Gửi qua Telegram

## Mỗi tuần (thứ Hai)
- [ ] Review code changes tuần trước
  - git log --since="7 days ago"
  - Báo cáo tổng kết cho user