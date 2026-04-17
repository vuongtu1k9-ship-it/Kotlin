package com.xiangqi.game

class Game {
    private val board = Board()
    private var currentSide = Side.RED  // Đỏ đi trước
    private val ai = XiangqiAI(depth = 3)  // AI với độ sâu tìm kiếm = 3
    
    fun start() {
        println("=== CỜ TƯỚNG KOTLIN ===")
        println("Chọn chế độ:")
        println("1. Người vs Người")
        println("2. Người (Đỏ) vs Máy (Đen)")
        print("Lựa chọn của bạn (1/2): ")
        val mode = readlnOrNull()?.toIntOrNull() ?: 1
        
        board.printBoard()
        println("Đỏ đi trước. Nhập nước đi theo định dạng: [hàng nguồn][cột nguồn]-[hàng đích][cột đích]")
        println("Ví dụ: 9a-8a (di chuyển quân từ hàng 9 cột a sang hàng 8 cột a)")
        
        if (mode == 2 && currentSide == Side.BLACK) {
            makeAIMove()
        }
    }
    
    fun handleMove(input: String): Boolean {
        val regex = """(\d)([a-i])-(\d)([a-i])""".toRegex()
        val match = regex.matchEntire(input) ?: return false
        
        val (fromRow, fromCol, toRow, toCol) = match.destructured
        val fromRowInt = fromRow.toInt()
        val toRowInt = toRow.toInt()
        val fromColInt = fromCol[0] - 'a'
        val toColInt = toCol[0] - 'a'
        
        val piece = board.getPiece(fromRowInt, fromColInt) ?: return false
        
        // Kiểm tra lượt đi
        if (piece.side != currentSide) {
            println("Lượt đi của ${currentSide.name}")
            return false
        }
        
        // Kiểm tra nước đi hợp lệ
        if (!board.isValidMove(fromRowInt, fromColInt, toRowInt, toColInt)) {
            println("Nước đi không hợp lệ!")
            return false
        }
        
        board.movePiece(fromRowInt, fromColInt, toRowInt, toColInt)
        
        // Đổi lượt
        currentSide = if (currentSide == Side.RED) Side.BLACK else Side.RED
        board.printBoard()
        println("Lượt đi của ${currentSide.name}")
        
        // Nếu đến lượt AI, tự động đưa ra nước đi
        if (currentSide == Side.BLACK) {
            makeAIMove()
        }
        return true
    }
    
    /**
     * Tự động đưa ra nước đi cho AI
     */
    private fun makeAIMove() {
        println("AI (Đen) đang suy nghĩ...")
        val bestMove = ai.findBestMove(board, Side.BLACK)
        
        if (bestMove == null) {
            println("AI không tìm thấy nước đi hợp lệ!")
            return
        }
        
        val (from, to) = bestMove
        val fromRow = from.first
        val fromCol = from.second
        val toRow = to.first
        val toCol = to.second
        
        val piece = board.getPiece(fromRow, fromCol)
        println("AI di chuyển: ${piece?.symbol} từ (${fromRow},${fromCol}) sang (${toRow},${toCol})")
        
        board.movePiece(fromRow, fromCol, toRow, toCol)
        currentSide = Side.RED
        board.printBoard()
        println("Lượt đi của ${currentSide.name}")
    }
}