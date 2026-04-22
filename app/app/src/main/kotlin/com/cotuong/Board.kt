package com.cotuong

/**
 * Lớp quản lý bàn cờ và các quân cờ trong cờ tướng.
 */
class Board {
    // Bàn cờ 9x10 (cột x hàng)
    private val pieces: MutableList<Piece> = mutableListOf()
    // Stack lưu lịch sử trạng thái bàn cờ (tối đa 3 nước đi gần nhất)
    private val history: ArrayDeque<List<Piece>> = ArrayDeque(3)

    init {
        initializeBoard()
    }

    /**
     * Khởi tạo bàn cờ với các quân cờ ở vị trí ban đầu.
     */
    fun initializeBoard() {
        // Xóa tất cả quân cờ hiện có
        pieces.clear()

        // Quân đỏ
        pieces.add(Piece(PieceType.CHARIOT, PieceColor.RED, 0, 0))
        pieces.add(Piece(PieceType.HORSE, PieceColor.RED, 1, 0))
        pieces.add(Piece(PieceType.ELEPHANT, PieceColor.RED, 2, 0))
        pieces.add(Piece(PieceType.ADVISOR, PieceColor.RED, 3, 0))
        pieces.add(Piece(PieceType.GENERAL, PieceColor.RED, 4, 0))
        pieces.add(Piece(PieceType.ADVISOR, PieceColor.RED, 5, 0))
        pieces.add(Piece(PieceType.ELEPHANT, PieceColor.RED, 6, 0))
        pieces.add(Piece(PieceType.HORSE, PieceColor.RED, 7, 0))
        pieces.add(Piece(PieceType.CHARIOT, PieceColor.RED, 8, 0))
        
        // Pháo đỏ
        pieces.add(Piece(PieceType.CANNON, PieceColor.RED, 1, 2))
        pieces.add(Piece(PieceType.CANNON, PieceColor.RED, 7, 2))
        
        // Tốt đỏ
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.RED, 0, 3))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.RED, 2, 3))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.RED, 4, 3))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.RED, 6, 3))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.RED, 8, 3))

        // Quân đen
        pieces.add(Piece(PieceType.CHARIOT, PieceColor.BLACK, 0, 9))
        pieces.add(Piece(PieceType.HORSE, PieceColor.BLACK, 1, 9))
        pieces.add(Piece(PieceType.ELEPHANT, PieceColor.BLACK, 2, 9))
        pieces.add(Piece(PieceType.ADVISOR, PieceColor.BLACK, 3, 9))
        pieces.add(Piece(PieceType.GENERAL, PieceColor.BLACK, 4, 9))
        pieces.add(Piece(PieceType.ADVISOR, PieceColor.BLACK, 5, 9))
        pieces.add(Piece(PieceType.ELEPHANT, PieceColor.BLACK, 6, 9))
        pieces.add(Piece(PieceType.HORSE, PieceColor.BLACK, 7, 9))
        pieces.add(Piece(PieceType.CHARIOT, PieceColor.BLACK, 8, 9))
        
        // Pháo đen
        pieces.add(Piece(PieceType.CANNON, PieceColor.BLACK, 1, 7))
        pieces.add(Piece(PieceType.CANNON, PieceColor.BLACK, 7, 7))
        
        // Tốt đen
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.BLACK, 0, 6))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.BLACK, 2, 6))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.BLACK, 4, 6))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.BLACK, 6, 6))
        pieces.add(Piece(PieceType.SOLDIER, PieceColor.BLACK, 8, 6))
    }

    /**
     * Lấy tất cả quân cờ trên bàn cờ.
     */
    fun getPieces(): List<Piece> {
        return pieces.toList()
    }

    /**
     * Lấy quân cờ tại vị trí (x, y).
     */
    fun getPieceAt(x: Int, y: Int): Piece? {
        return pieces.find { it.x == x && it.y == y }
    }

    /**
     * Lưu trạng thái hiện tại vào lịch sử.
     */
    private fun saveState() {
        if (history.size >= 3) {
            history.removeFirst() // Xóa trạng thái cũ nhất nếu vượt quá 3
        }
        history.addLast(pieces.map { it.copy() }) // Lưu bản sao của các quân cờ
    }

    /**
     * Di chuyển quân cờ từ (fromX, fromY) đến (toX, toY).
     * @return true nếu di chuyển thành công, false nếu không hợp lệ.
     */
    fun movePiece(fromX: Int, fromY: Int, toX: Int, toY: Int): Boolean {
        if (fromX !in 0..8 || fromY !in 0..9 || toX !in 0..8 || toY !in 0..9) {
            return false
        }

        val piece = getPieceAt(fromX, fromY) ?: return false
        val targetPiece = getPieceAt(toX, toY)

        // Không thể ăn quân cùng màu
        if (targetPiece != null && targetPiece.color == piece.color) {
            return false
        }

        // Kiểm tra nước đi hợp lệ theo loại quân cờ
        if (!isValidMove(piece, toX, toY)) {
            return false
        }

        // Lưu trạng thái trước khi di chuyển
        saveState()

        // Di chuyển quân cờ
        if (targetPiece != null) {
            pieces.remove(targetPiece) // Ăn quân đối phương
        }
        piece.x = toX
        piece.y = toY
        return true
    }



    /**
     * Kiểm tra nước đi hợp lệ theo luật cờ tướng.
     */
    private fun isValidMove(piece: Piece, toX: Int, toY: Int): Boolean {
        val dx = Math.abs(toX - piece.x)
        val dy = Math.abs(toY - piece.y)

        return when (piece.type) {
            PieceType.GENERAL -> {
                // Tướng: di chuyển 1 ô theo chiều dọc hoặc ngang, không được ra khỏi cung
                (dx == 1 && dy == 0 || dx == 0 && dy == 1) && (toX in 3..5) && (toY in (if (piece.color == PieceColor.RED) 0..2 else 7..9))
            }
            PieceType.ADVISOR -> {
                // Sĩ: di chuyển chéo 1 ô, không được ra khỏi cung
                dx == 1 && dy == 1 && (toX in 3..5) && (toY in (if (piece.color == PieceColor.RED) 0..2 else 7..9))
            }
            PieceType.ELEPHANT -> {
                // Tượng: di chuyển chéo 2 ô, không được qua sông
                dx == 2 && dy == 2 && (toY in (if (piece.color == PieceColor.RED) 0..4 else 5..9)) && getPieceAt((piece.x + toX) / 2, (piece.y + toY) / 2) == null
            }
            PieceType.CHARIOT -> {
                // Xe: di chuyển thẳng không giới hạn, không được nhảy qua quân khác
                (dx == 0 || dy == 0) && isPathClear(piece.x, piece.y, toX, toY)
            }
            PieceType.CANNON -> {
                // Pháo: di chuyển thẳng không giới hạn, ăn quân phải có quân chắn
                if (dx == 0 || dy == 0) {
                    val targetPiece = getPieceAt(toX, toY)
                    if (targetPiece == null) {
                        isPathClear(piece.x, piece.y, toX, toY)
                    } else {
                        countPiecesBetween(piece.x, piece.y, toX, toY) == 1
                    }
                } else {
                    false
                }
            }
            PieceType.HORSE -> {
                // Mã: di chuyển hình chữ L, không bị cản
                (dx == 2 && dy == 1 || dx == 1 && dy == 2) && getPieceAt(
                    piece.x + if (dx == 2) (toX - piece.x) / 2 else 0,
                    piece.y + if (dy == 2) (toY - piece.y) / 2 else 0
                ) == null
            }
            PieceType.SOLDIER -> {
                // Tốt: di chuyển 1 ô về phía trước, qua sông được đi ngang
                if (piece.color == PieceColor.RED) {
                    (toY == piece.y + 1 && dx == 0) || (piece.y >= 5 && dy == 0 && dx == 1)
                } else {
                    (toY == piece.y - 1 && dx == 0) || (piece.y <= 4 && dy == 0 && dx == 1)
                }
            }
        }
    }

    /**
     * Kiểm tra đường đi có thông thoáng không (cho Xe và Pháo).
     */
    private fun isPathClear(fromX: Int, fromY: Int, toX: Int, toY: Int): Boolean {
        if (fromX != toX && fromY != toY) return false

        val stepX = if (fromX == toX) 0 else if (fromX < toX) 1 else -1
        val stepY = if (fromY == toY) 0 else if (fromY < toY) 1 else -1

        var x = fromX + stepX
        var y = fromY + stepY

        while (x != toX || y != toY) {
            if (getPieceAt(x, y) != null) {
                return false
            }
            x += stepX
            y += stepY
        }
        return true
    }

    /**
     * Đếm số quân cờ giữa hai vị trí (cho Pháo).
     */
    private fun countPiecesBetween(fromX: Int, fromY: Int, toX: Int, toY: Int): Int {
        if (fromX != toX && fromY != toY) return 0

        val stepX = if (fromX == toX) 0 else if (fromX < toX) 1 else -1
        val stepY = if (fromY == toY) 0 else if (fromY < toY) 1 else -1

        var x = fromX + stepX
        var y = fromY + stepY
        var count = 0

        while (x != toX || y != toY) {
            if (getPieceAt(x, y) != null) {
                count++
            }
            x += stepX
            y += stepY
        }
        return count
    }

    /**
     * Hoàn tác nước đi gần nhất (tối đa 3 lần).
     * @return true nếu hoàn tác thành công, false nếu không có lịch sử.
     */
    fun undo(): Boolean {
        if (history.isEmpty()) {
            return false
        }

        // Khôi phục trạng thái từ lịch sử
        pieces.clear()
        pieces.addAll(history.removeLast())
        return true
    }

    /**
     * Kiểm tra có thể hoàn tác hay không.
     */
    fun canUndo(): Boolean {
        return history.isNotEmpty()
    }

    /**
     * Phân tích nước đi cuối cùng.
     * @return Mô tả nước đi (ví dụ: "Tướng Đen: (4,8) → (5,8)")
     */
    fun analyzeLastMove(): String? {
        if (history.size < 2) return null
        
        val previousState = history[history.size - 2]
        val currentState = history.last()
        
        // Tìm quân cờ đã di chuyển
        val movedPiece = currentState.firstOrNull { currentPiece ->
            previousState.none { prevPiece ->
                prevPiece.x == currentPiece.x && prevPiece.y == currentPiece.y && prevPiece.type == currentPiece.type
            }
        }
        
        if (movedPiece != null) {
            val previousPosition = previousState.find { it.type == movedPiece.type && it.color == movedPiece.color }
            return "${movedPiece.type} ${if (movedPiece.color == PieceColor.RED) "Đỏ" else "Đen"}: (${previousPosition?.x},${previousPosition?.y}) → (${movedPiece.x},${movedPiece.y})"
        }
        
        return null
    }
}