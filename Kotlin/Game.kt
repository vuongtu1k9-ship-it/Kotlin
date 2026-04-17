package com.xiangqi

class Game {
    private val board = Board()
    private var currentSide = Side.RED  // Đỏ đi trước
    
    fun start() {
        println("=== CỜ TƯỚNG KOTLIN ===")
        board.printBoard()
        println("Đỏ đi trước. Nhập nước đi theo định dạng: [hàng nguồn][cột nguồn]-[hàng đích][cột đích]")
        println("Ví dụ: 9a-8a (di chuyển quân từ hàng 9 cột a sang hàng 8 cột a)")
    }
    
    fun handleMove(input: String): Boolean {
        val regex = "(\d)([a-i])-(\d)([a-i])".toRegex()
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
        if (!board.movePiece(fromRowInt, fromColInt, toRowInt, toColInt)) {
            println("Nước đi không hợp lệ!")
            return false
        }
        
        // Đổi lượt
        currentSide = if (currentSide == Side.RED) Side.BLACK else Side.RED
        board.printBoard()
        println("Lượt đi của ${currentSide.name}")
        return true
    }
}