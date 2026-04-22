# Quy tắc Phòng và Kỳ thủ (Match & Room Rules)

Tài liệu này quy định các cơ chế vận hành của phòng chơi và hành vi của người chơi trong hệ thống Cờ tướng Online. Tất cả các lập trình viên cần tuân thủ các quy tắc này khi phát triển tính năng mới.

## 1. Phân loại Phòng (Room Types)

Hệ thống hiện tại hỗ trợ 3 loại phòng chính:

1. **CÔNG KHAI (OPEN)**:
    - **Tạo từ**: Sảnh chờ (Lobby) khi không chọn đối thủ cụ thể.
    - **Quyền chơi**: Ai đến trước ngồi trước (First come, first served). Khi đủ 2 người, những người sau vào làm khán giả.
    - **Xác nhận sẵn sàng**: Cần cả 2 người chơi bấm "Sẵn sàng" trước khi ván đấu chính thức bắt đầu.
    - **Tính điểm**: Full ELO & Gold.
    - **Lưu ý Cờ thế (Open Puzzle)**: Hỗ trợ chế độ công khai để mọi người cùng giải. **Không tính điểm ELO**, nhưng **vẫn được thưởng Vàng** như ván đấu thường.
    - **Hiển thị**: Có mặt tại Lobby.

2. **THÁCH ĐẤU (PUBLIC FIXED)** (Mặc định khi mời người khác hoặc Đấu giải):
    - **Tạo từ**: Mời thi đấu người khác (Challenge), mở từ Thế cờ, hoặc tự động từ Giải đấu (Tournament).
    - **Quyền chơi**: Chỉ 2 người được chỉ định (Fixed Players).
    - **Quyền xem**: Mọi người đều có thể vào xem (Spectators).
    - **Xác nhận sẵn sàng**: Cần cả 2 người chơi bấm "Sẵn sàng" trước khi ván đấu chính thức bắt đầu.
    - **Tính điểm**: Full ELO & Gold. (Cờ thế: Gold only, no ELO).
    - **Hiển thị**: Có mặt tại Lobby (để giao lưu/xem).

3. **RIÊNG TƯ (PRIVATE)**:
    - **Tạo từ**: Tích chọn "Riêng tư" trong cấu hình.
    - **Quyền chơi**: Chỉ 2 người chơi được chỉ định.
    - **Quyền xem**: **KHÔNG** cho phép khán giả. Người lạ không thể vào room.
    - **Tính điểm**: **KHÔNG** tính ELO, **KHÔNG** thưởng Gold (Tránh cày điểm).
    - **Hiển thị**: Ẩn khỏi Lobby.

| Cơ chế Tự động Bắt đầu (Auto-start) |
| :--- |
| Để tối ưu trải nghiệm và giảm bớt thao tác thủ công, hệ thống áp dụng cơ chế tự động bắt đầu ván đấu: |
| - **Kích hoạt bằng nước đi**: Ván đấu chính thức bắt đầu (started=true) ngay khi kỳ thủ bên Đỏ thực hiện nước đi đầu tiên hợp lệ. |
| - **Điều kiện bắt đầu**: Hai kỳ thủ phải cùng có mặt trong phòng (đã ngồi vào ghế Đỏ và Đen). Nếu thiếu người, hệ thống sẽ thông báo "Đang đợi đủ người chơi...". |
| - **Giao diện hướng dẫn**: Khi đủ người nhưng chưa bắt đầu, hệ thống hiển thị gợi ý "Đến lượt bạn - Hãy đi nước đầu để bắt đầu" cho bên Đỏ và "Chờ bên Đỏ đi nước đầu để bắt đầu" cho bên Đen. |
| - **Đồng bộ hóa**: Ngay khi nước đi đầu tiên được thực hiện, đồng hồ thi đấu sẽ bắt đầu chạy và trạng thái ván đấu được cập nhật cho tất cả người xem. |

---

## 2. Vai trò Người chơi (Player Roles) 

### Participation & Spectating
- **Strict One-Seat Policy**: A single user (UID) can only occupy **one** player seat (Red or Black) per room.
- **Single Active Match Enforcement**: Mỗi người chơi chỉ có thể tham gia **duy nhất một** ván đấu tại một thời điểm. Hệ thống sẽ chặn việc tạo hoặc chấp nhận lời mời thi đấu mới nếu người chơi đang trong ván đấu chưa kết thúc.
- **Banner Quay Lại**: Khi người chơi đang trong ván đấu nhưng chuyển sang trang khác, một banner thông báo sẽ luôn hiển thị ở đầu trang để nhắc nhở quay lại ván đấu.
- **Side Affinity**: Once a player is assigned a side, they are locked to that side for the duration of the match. Re-joining will always place them in their original seat.
- **Spectators**: Any user joining a room where both seats are occupied (or a room they aren't assigned to in tournament/fixed mode) will automatically become a spectator.
- **Khán giả (Spectators)**: Người xem ván đấu. Danh sách khán giả được quản lý dựa trên `socket.id` trong `state.spectators`.

---

## 3. Hệ thống Tính điểm và Thưởng (Scoring & Rewards)

Việc tính điểm Elo và thưởng Vàng được thực hiện tự động bởi `server/scoring.mjs` dựa trên các quy tắc:

- **Điều kiện tính Elo/Vàng**: Ván đấu phải có ít nhất **1 nước đi** từ phía người chơi.
- **Xử thua (Forfeit)**:
    - Nếu ván đấu kết thúc bằng `forfeit` (rời phòng) nhưng có **dưới 1 nước đi**:
        - **Elo**: Không thay đổi (không trừ điểm người thua, không cộng điểm người thắng).
        - **Vàng**: Không thưởng.
        - **Hệ thống Tính điểm Giải đấu**:
    - **Thắng**: 3 điểm.
    - **Hòa**: 1 điểm.
    - **Thua**: 0 điểm.
    - **Xử thắng (Bye/Forfeit)**: 3 điểm.
- **Giải đấu**: Vẫn cập nhật kết quả vào Standings dựa trên điểm số trên ngay cả khi ván đấu kết thúc sớm.
    - Nếu ván đấu đã bắt đầu (>= 1 nước đi):
        - Tính điểm Elo và thưởng Vàng như ván đấu bình thường.

---

## 4. Định nghĩa "Rời phòng" (Explicit vs Implicit Leave)

Hệ thống phân biệt rõ giữa việc người chơi **chủ động** từ bỏ ván đấu và việc **vô tình** mất kết nối:

- **Rời phòng Chủ động (Explicit Leave)**:
    - Người chơi bấm nút "Rời phòng" trên giao diện HUD hoặc khi ván đấu kết thúc.
    - **Xác nhận**: Hệ thống luôn yêu cầu xác nhận (`window.confirm`) trước khi thực hiện để tránh thoát nhầm.
    - **Hệ quả**: 
        - Người chơi được chuyển hướng về Trang chủ ngay lập tức.
        - Trạng thái "Đang tham gia ván đấu" được xóa bỏ.
        - Đối thủ nhận được thông báo *"Đối thủ đã rời phòng"*.
        - Kích hoạt xử thua (trong Giải đấu) hoặc xóa phòng (trong ván đấu chưa bắt đầu).
- **Rời phòng Bị động (Implicit Leave)**:
    - Người chơi đóng tab, tải lại trang, đóng trình duyệt, hoặc bị mất kết nối mạng.
    - **Hệ quả**: Socket bị ngắt kết nối (`disconnect`), ghế ngồi khi chưa thi dấu tương ứng được giải phóng (`null`), trong trường hợp ván đấu đang diễn ra đồng hồ tiếp tục chạy đến khi timeout. Kỳ thủ vẫn có thể quay lại ván đấu bất kỳ lúc nào thông qua banner thông báo trên trang web, hoặc quay lại qua url ván đấu.

---

## 6. Thể thức Giải đấu (Tournament Formats)

Hệ thống hỗ trợ các thể thức thi đấu chuyên nghiệp:

1. **Hệ Thụy Sĩ (Swiss System)**: Phù hợp cho số lượng kỳ thủ lớn, ghép cặp dựa trên điểm số hiện tại.
2. **Vòng tròn (Round Robin)**: Mọi người thi đấu với tất cả mọi người còn lại.
3. **Loại trực tiếp (Single/Double Elimination)**: Thu gọn dần danh sách người chơi qua các vòng knock-out.
4. **Đấu trường (Arena)**: Thi đấu liên tục trong một khoảng thời gian cố định, ghép cặp ngay khi có người rảnh.

---

## 5. Lưu ý cho Lập trình viên

- Khi thay đổi trạng thái phòng, luôn gọi `saveRoom(roomId, state)` để đồng bộ hóa.
- Logic quét dọn phòng định kỳ nằm trong `server/socket/index.mjs` (sử dụng `isOrphanRoom`).
- Logic chặn người lạ ngồi vào ghế được thực thi trong handler `room:join`.
- Luôn truyền cờ `explicit: true` từ phía Frontend khi kỳ thủ chủ động bấm nút "Rời phòng".

---

## 7. Luật Cờ Tướng và Xử Hòa (Xiangqi Drawing Rules)

Hệ thống tự động áp dụng các quy định quốc tế về xử hòa để đảm bảo tính công bằng và ngăn chặn việc kéo dài ván đấu vô ích:

1. **Hòa do thỏa thuận (Agreement Draw)**:
    - Một bên gửi yêu cầu hòa thông qua nút "Xin hòa".
    - Đối phương có quyền "Đồng ý" hoặc "Từ chối". Nếu đồng ý, ván đấu kết thúc ngay với kết quả Hòa.

2. **Luật 60 nước không ăn quân (60-Move Rule)**:
    - Ván đấu tự động xử hòa nếu sau **120 hiệp đi** (tương đương 60 nước đi đầy đủ của cả hai bên) mà **không có bất kỳ quân nào bị ăn**.
    - Chỉ có việc ăn quân mới làm mới (reset) bộ đếm này.

3. **Xử lý Lặp thế trận (Repetition Rules)**:
    - Nếu một trạng thái bàn cờ lặp lại **3 lần** mà không thuộc trường hợp vi phạm, hệ thống tự động xử hòa.
    - **Luật Cấm**: Nếu một bên lặp lại thế trận bằng cách **Chiếu dai** (Perpetual Check) hoặc **Đuổi dai** (Perpetual Chase), bên đó sẽ bị **xử thua** ngay lập tức.

4. **Hòa kỹ thuật (Insufficient Material)**:
    - Hệ thống tự động xử hòa khi lực lượng hai bên không còn đủ để chiếu bí đối phương (Khô tử hòa).
    - Ví dụ: Chỉ còn 2 quân Tướng trên bàn cờ.

