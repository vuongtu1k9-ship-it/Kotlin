package com.xiangqi.game

import kotlin.math.max
import kotlin.math.min

/**
 * Class AI cho trò chơi Cờ Tướng sử dụng thuật toán Minimax với cắt tỉa Alpha-Beta.
 * @param depth Độ sâu tìm kiếm của thuật toán.
 */
class XiangqiAI(private val depth: Int = 3) {
    /**
     * Tìm nước đi tốt nhất cho một bên.
     * @param board Bàn cờ hiện tại.
     * @param side Bên cần tìm nước đi (Đỏ hoặc Đen).
     * @return Cặp tọa độ (từ, đến) của nước đi tốt nhất, hoặc null nếu không có nước đi hợp lệ.
     */
    fun findBestMove(board: Board, side: Side): Pair<Pair<Int, Int>, Pair<Int, Int>>? {
        val possibleMoves = board.getAllPossibleMoves(side)
        if (possibleMoves.isEmpty()) return null
        
        var bestMove: Pair<Pair<Int, Int>, Pair<Int, Int>>? = null
        var bestValue = if (side == Side.RED) Int.MIN_VALUE else Int.MAX_VALUE
        
        // Duyệt qua tất cả các nước đi hợp lệ
        for (move in possibleMoves) {
            val (from, to) = move
            val newBoard = board.clone()
            newBoard.movePiece(from.first, from.second, to.first, to.second)
            
            // Tính giá trị của nước đi hiện tại
            val moveValue = minimax(newBoard, depth - 1, Int.MIN_VALUE, Int.MAX_VALUE, side == Side.BLACK)
            
            // Cập nhật nước đi tốt nhất
            if (side == Side.RED && moveValue > bestValue) {
                bestValue = moveValue
                bestMove = move
            } else if (side == Side.BLACK && moveValue < bestValue) {
                bestValue = moveValue
                bestMove = move
            }
        }
        
        return bestMove
    }
    
    /**
     * Thuật toán Minimax với cắt tỉa Alpha-Beta.
     * @param board Bàn cờ hiện tại.
     * @param depth Độ sâu tìm kiếm còn lại.
     * @param alpha Giá trị alpha (dùng cho cắt tỉa).
     * @param beta Giá trị beta (dùng cho cắt tỉa).
     * @param isMaximizing Bên đang tối đa hóa (Đỏ) hay tối thiểu hóa (Đen).
     * @return Giá trị đánh giá của bàn cờ.
     */
    private fun minimax(
        board: Board,
        depth: Int,
        alpha: Int,
        beta: Int,
        isMaximizing: Boolean
    ): Int {
        // Điều kiện dừng: độ sâu = 0 hoặc không còn nước đi
        if (depth == 0) {
            return evaluateBoard(board)
        }
        
        val possibleMoves = board.getAllPossibleMoves(if (isMaximizing) Side.RED else Side.BLACK)
        if (possibleMoves.isEmpty()) {
            return if (isMaximizing) Int.MIN_VALUE else Int.MAX_VALUE
        }
        
        var alpha = alpha
        var beta = beta
        
        if (isMaximizing) {
            var maxEval = Int.MIN_VALUE
            for (move in possibleMoves) {
                val (from, to) = move
                val newBoard = board.clone()
                newBoard.movePiece(from.first, from.second, to.first, to.second)
                val eval = minimax(newBoard, depth - 1, alpha, beta, false)
                maxEval = max(maxEval, eval)
                alpha = max(alpha, eval)
                if (beta <= alpha) break // Cắt tỉa
            }
            return maxEval
        } else {
            var minEval = Int.MAX_VALUE
            for (move in possibleMoves) {
                val (from, to) = move
                val newBoard = board.clone()
                newBoard.movePiece(from.first, from.second, to.first, to.second)
                val eval = minimax(newBoard, depth - 1, alpha, beta, true)
                minEval = min(minEval, eval)
                beta = min(beta, eval)
                if (beta <= alpha) break // Cắt tỉa
            }
            return minEval
        }
    }
    
    /**
     * Đánh giá giá trị của bàn cờ.
     * @param board Bàn cờ hiện tại.
     * @return Giá trị đánh giá (dương: Đỏ có lợi, âm: Đen có lợi).
     */
    private fun evaluateBoard(board: Board): Int {
        var score = 0
        
        // Duyệt qua tất cả các ô trên bàn cờ
        for (row in 0 until 10) {
            for (col in 0 until 9) {
                val piece = board.getPiece(row, col) ?: continue
                
                // Cộng điểm dựa trên loại quân cờ và bên
                val pieceValue = when (piece.type) {
                    PieceType.KING -> 1000
                    PieceType.ADVISOR -> 20
                    PieceType.ELEPHANT -> 20
                    PieceType.HORSE -> 40
                    PieceType.CHARIOT -> 90
                    PieceType.CANNON -> 45
                    PieceType.PAWN -> 10
                }
                
                score += if (piece.side == Side.RED) pieceValue else -pieceValue
            }
        }
        
        return score
    }
}