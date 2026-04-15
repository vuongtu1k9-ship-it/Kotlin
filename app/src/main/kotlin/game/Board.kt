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
    
    /** Sao chép bàn cờ */
    fun clone(): Board {
        val newBoard = Board()
        for (row in 0 until rows) {
            for (col in 0 until cols) {
                newBoard.grid[row][col] = this.grid[row][col]?.copy()
            }
        }
        return newBoard
    }
    
    /** Kiểm tra nước đi hợp lệ cho Tốt */
    fun isValidPawnMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int, side: Side): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.PAWN) return false
        
        // Tốt chưa sang sông: chỉ đi thẳng
        if ((side == Side.RED && fromRow >= 5) || (side == Side.BLACK && fromRow <= 4)) {
            return toRow == fromRow + (if (side == Side.RED) -1 else 1) && toCol == fromCol
        }
        // Tốt đã sang sông: đi thẳng hoặc ngang
        return (toRow == fromRow + (if (side == Side.RED) -1 else 1) && toCol == fromCol) ||
               (toRow == fromRow && Math.abs(toCol - fromCol) == 1)
    }
    
    /** Kiểm tra nước đi hợp lệ cho Pháo */
    fun isValidCannonMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.CANNON) return false
        
        // Pháo đi thẳng hoặc ngang
        if (fromRow != toRow && fromCol != toCol) return false
        
        // Đếm số quân cờ trên đường đi
        var count = 0
        if (fromRow == toRow) {
            val step = if (toCol > fromCol) 1 else -1
            for (col in fromCol + step until toCol step step) {
                if (grid[fromRow][col] != null) count++
            }
        } else {
            val step = if (toRow > fromRow) 1 else -1
            for (row in fromRow + step until toRow step step) {
                if (grid[row][fromCol] != null) count++
            }
        }
        
        // Pháo ăn quân: phải có đúng 1 quân cờ chắn
        val targetPiece = grid[toRow][toCol]
        return if (targetPiece != null) count == 1 else count == 0
    }
    
    /** Kiểm tra nước đi hợp lệ cho Xe */
    fun isValidChariotMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.CHARIOT) return false
        
        // Xe đi thẳng hoặc ngang
        if (fromRow != toRow && fromCol != toCol) return false
        
        // Kiểm tra không có quân cờ chắn
        if (fromRow == toRow) {
            val step = if (toCol > fromCol) 1 else -1
            for (col in fromCol + step until toCol step step) {
                if (grid[fromRow][col] != null) return false
            }
        } else {
            val step = if (toRow > fromRow) 1 else -1
            for (row in fromRow + step until toRow step step) {
                if (grid[row][fromCol] != null) return false
            }
        }
        return true
    }
    
    /** Kiểm tra nước đi hợp lệ cho Mã */
    fun isValidHorseMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.HORSE) return false
        
        val rowDiff = Math.abs(toRow - fromRow)
        val colDiff = Math.abs(toCol - fromCol)
        
        // Mã đi hình chữ L
        if (!((rowDiff == 2 && colDiff == 1) || (rowDiff == 1 && colDiff == 2))) return false
        
        // Kiểm tra quân cờ chắn
        val blockRow = fromRow + (toRow - fromRow) / 2
        val blockCol = fromCol + (toCol - fromCol) / 2
        return grid[blockRow][blockCol] == null
    }
    
    /** Kiểm tra nước đi hợp lệ cho Tượng */
    fun isValidElephantMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int, side: Side): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.ELEPHANT) return false
        
        val rowDiff = Math.abs(toRow - fromRow)
        val colDiff = Math.abs(toCol - fromCol)
        
        // Tượng đi chéo 2 ô
        if (rowDiff != 2 || colDiff != 2) return false
        
        // Kiểm tra không vượt sông
        if ((side == Side.RED && toRow < 5) || (side == Side.BLACK && toRow > 4)) return false
        
        // Kiểm tra quân cờ chắn
        val blockRow = (fromRow + toRow) / 2
        val blockCol = (fromCol + toCol) / 2
        return grid[blockRow][blockCol] == null
    }
    
    /** Kiểm tra nước đi hợp lệ cho Sĩ */
    fun isValidAdvisorMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int, side: Side): Boolean {
        val piece = grid[fromRow][fromCol] ?: return false
        if (piece.type != PieceType.ADVISOR) return false
        
        // Sĩ đi chéo 1 ô trong cung
        if (Math.abs(toRow - fromRow) != 1 || Math.abs(toCol - fromCol) != 1) return false
        return isInPalace(toRow, toCol, side)
    }
    
    /** Liệt kê tất cả nước đi hợp lệ của một bên */
    fun getAllPossibleMoves(side: Side): List<Pair<Pair<Int, Int>, Pair<Int, Int>>> {
        val moves = mutableListOf<Pair<Pair<Int, Int>, Pair<Int, Int>>>()
        for (fromRow in 0 until rows) {
            for (fromCol in 0 until cols) {
                val piece = grid[fromRow][fromCol] ?: continue
                if (piece.side != side) continue
                
                for (toRow in 0 until rows) {
                    for (toCol in 0 until cols) {
                        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                            moves.add(Pair(Pair(fromRow, fromCol), Pair(toRow, toCol)))
                        }
                    }
                }
            }
        }
        return moves
    }
    
    /** Kiểm tra nước đi hợp lệ cho một quân cờ */
    fun isValidMove(fromRow: Int, fromCol: Int, toRow: Int, toCol: Int): Boolean {
        if (fromRow == toRow && fromCol == toCol) return false
        val piece = grid[fromRow][fromCol] ?: return false
        val targetPiece = grid[toRow][toCol]
        
        // Không ăn quân cùng bên
        if (targetPiece != null && targetPiece.side == piece.side) return false
        
        return when (piece.type) {
            PieceType.KING -> isValidKingMove(fromRow, fromCol, toRow, toCol, piece.side)
            PieceType.ADVISOR -> isValidAdvisorMove(fromRow, fromCol, toRow, toCol, piece.side)
            PieceType.ELEPHANT -> isValidElephantMove(fromRow, fromCol, toRow, toCol, piece.side)
            PieceType.HORSE -> isValidHorseMove(fromRow, fromCol, toRow, toCol)
            PieceType.CHARIOT -> isValidChariotMove(fromRow, fromCol, toRow, toCol)
            PieceType.CANNON -> isValidCannonMove(fromRow, fromCol, toRow, toCol)
            PieceType.PAWN -> isValidPawnMove(fromRow, fromCol, toRow, toCol, piece.side)
        }
    }
}