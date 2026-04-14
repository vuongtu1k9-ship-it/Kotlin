package com.xiangqi

class Board {
    private val rows = 10
    private val cols = 9
    private val grid: Array<Array<Piece?>> = Array(rows) { arrayOfNulls(cols) }
    
    init {
        initializeBoard()
    }
    
    private fun initializeBoard() {
        // Khởi tạo quân cờ Đen (trên)
        grid[0][0] = Piece(PieceType.CHARIOT, Side.BLACK, "車")
        grid[0][1] = Piece(PieceType.HORSE, Side.BLACK, "馬")
        grid[0][2] = Piece(PieceType.ELEPHANT, Side.BLACK, "象")
        grid[0][3] = Piece(PieceType.ADVISOR, Side.BLACK, "士")
        grid[0][4] = Piece(PieceType.KING, Side.BLACK, "將")
        grid[0][5] = Piece(PieceType.ADVISOR, Side.BLACK, "士")
        grid[0][6] = Piece(PieceType.ELEPHANT, Side.BLACK, "象")
        grid[0][7] = Piece(PieceType.HORSE, Side.BLACK, "馬")
        grid[0][8] = Piece(PieceType.CHARIOT, Side.BLACK, "車")
        
        // Pháo Đen
        grid[2][1] = Piece(PieceType.CANNON, Side.BLACK, "炮")
        grid[2][7] = Piece(PieceType.CANNON, Side.BLACK, "炮")
        
        // Tốt Đen
        for (col in 0 until cols step 2) {
            grid[3][col] = Piece(PieceType.PAWN, Side.BLACK, "卒")
        }
        
        // Khởi tạo quân cờ Đỏ (dưới)
        grid[9][0] = Piece(PieceType.CHARIOT, Side.RED, "車")
        grid[9][1] = Piece(PieceType.HORSE, Side.RED, "馬")
        grid[9][2] = Piece(PieceType.ELEPHANT, Side.RED, "相")
        grid[9][3] = Piece(PieceType.ADVISOR, Side.RED, "仕")
        grid[9][4] = Piece(PieceType.KING, Side.RED, "帥")
        grid[9][5] = Piece(PieceType.ADVISOR, Side.RED, "仕")
        grid[9][6] = Piece(PieceType.ELEPHANT, Side.RED, "相")
        grid[9][7] = Piece(PieceType.HORSE, Side.RED, "馬")
        grid[9][8] = Piece(PieceType.CHARIOT, Side.RED, "車")
        
        // Pháo Đỏ
        grid[7][1] = Piece(PieceType.CANNON, Side.RED, "炮")
        grid[7][7] = Piece(PieceType.CANNON, Side.RED, "炮")
        
        // Tốt Đỏ
        for (col in 0 until cols step 2) {
            grid[6][col] = Piece(PieceType.PAWN, Side.RED, "兵")
        }
    }
    
    /** Kiểm tra ô có nằm trong cung tướng không */
    fun isInPalace(row: Int, col: Int, side: Side): Boolean {
        if (col < 3 || col > 5) return false  // Cột 3-5
        return when (side) {
            Side.RED -> row in 7..9    // Đỏ: hàng 7-9
            Side.BLACK -> row in 0..2  // Đen: hàng 0-2
        }
    }
    
    /** Kiểm tra nước đi hợp lệ cho Tướng */
    fun isValidKingMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int, side: Side): Boolean {
        // Kiểm tra di chuyển trong cung tướng
        if (!isInPalace(toRow, toCol, side)) return false
        
        // Kiểm tra di chuyển 1 ô theo chiều dọc/ngang
        return (Math.abs(toRow - fromRow) == 1 && toCol == fromCol) ||
               (Math.abs(toCol - fromCol) == 1 && toRow == fromRow)
    }
    
    /** Lấy quân cờ tại vị trí */
    fun getPiece(row: Int, col: Int): Piece? = grid[row][col]
    
    /** Di chuyển quân cờ */
    fun movePiece(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        
        // Kiểm tra nước đi hợp lệ (ví dụ: Tướng)
        if (piece.type == PieceType.KING && !isValidKingMove(fromRow, fromCol, toRow, toCol, piece.side)) {
            return false
        }
        
        grid[toRow][toCol] = piece
        grid[fromRow][fromCol] = null
        return true
    }
    
    /** In bàn cờ (debug) */
    fun printBoard() {
        for (row in 0 until rows) {
            for (col in 0 until cols) {
                val piece = grid[row][col]
                print(piece?.symbol ?: ".")
                print(" ")
            }
            println()
        }
    }
}