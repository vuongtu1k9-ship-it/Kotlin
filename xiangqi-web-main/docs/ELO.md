# 🏆 Hệ Thống Xếp Hạng Elo

Cờ tướng Online sử dụng công thức Elo tiêu chuẩn quốc tế để duy trì tính công bằng và chính xác trong việc đánh giá trình độ người chơi.

## 🧮 Công Thức Tính

Hệ thống tính toán xác suất chiến thắng dựa trên sự chênh lệch điểm số giữa hai kỳ thủ:

### 1. Điểm số kỳ vọng (Expected Score)
$$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$$

### 2. Cập nhật điểm sau trận đấu
$$R'_A = R_A + K \times (S_A - E_A)$$

**Trong đó:**
- $S_A = 1$ (Thắng), $0.5$ (Hòa), $0 = $ (Thua).
- $R_A, R_B$: Điểm hiện tại của người chơi A và B.
- $R'_A$: Điểm mới sau cập nhật.

---

## ⚙️ Cấu Hình Mặc Định

> [!IMPORTANT]
> - **Điểm khởi đầu**: Tất cả kỳ thủ mới bắt đầu với **1200** điểm.
> - **Hệ số K (K-factor)**:
>   - **40**: Dành cho kỳ thủ có ít hơn 30 ván đấu xếp hạng (Giai đoạn làm quen).
>   - **20**: Dành cho kỳ thủ đã có trên 30 ván đấu.

---

## 📜 Quy Tắc Kết Quả

- **Kết thúc ván đấu**: Chiếu bí, hết nước đi (stalemate), hoặc hết thời gian đều được tính là thắng/thua.
- **Xử thua do thời gian**: Kỳ thủ hết thời gian (thời gian mỗi nước hoặc tổng thời gian) sẽ bị xử thua ngay lập tức.

> [!TIP]
> ### 🛡️ Khả Năng Kết Nối & Persistence
> Mất kết nối tạm thời hoặc tải lại trang **KHÔNG** làm mất điểm Elo hay xử thua. 
> Ván đấu sẽ vẫn ở trạng thái chờ cho đến khi:
> 1. Kỳ thủ quay lại thi đấu (thông qua banner ở Sảnh chờ).
> 2. Kỳ thủ bấm nút **"Rời phòng"** một cách rõ ràng.
> 3. Hết thời gian suy nghĩ trên đồng hồ.
