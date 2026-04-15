package com.xiangqi

import kotlin.math.max
import kotlin.math.min

class XiangqiAI(private val depth: Int = 3) {
    // Giá trị các quân cờ (dùng để đánh giá bàn cờ)
    private val pieceValues = mapOf(
        PieceType.KING to 100,
        PieceType.ADVISOR to 2,
        PieceType.ELEPHANT to 2,
        PieceType.HORSE to 4,
        PieceType.CHARIOT to 9,
        PieceType.CANNON to 4,
        PieceType.PAWN to 1
    )
    
    /**
     * Tìm nước đi tốt nhất cho bên hiện tại
     * @param board Bàn cờ hiện tại
     * @param side Bên cần tìm nước đi (RED hoặc BLACK)
     * @return Pair<from, to> (vị trí nguồn và đích)
     */
    fun findBestMove(board: Board, side: Side): Pair<Pair<Int, Int>, Pair<Int, Int>>? {
        val possibleMoves = getAllPossibleMoves(board, side)
        if (possibleMoves.isEmpty()) return null
        
        var bestMove: Pair<Pair<Int, Int>, Pair<Int, Int>>? = null
        var bestValue = if (side == Side.RED) Int.MIN_VALUE else Int.MAX_VALUE
        
        for (move in possibleMoves) {
            val (from, to) = move
            val newBoard = cloneBoard(board)
            newBoard.movePiece(from.first, from.second, to.first, to.second)
            
            val moveValue = minimax(newBoard, depth - 1, side == Side.BLACK, Int.MIN_VALUE, Int.MAX_VALUE)
            
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
     * Thuật toán Minimax với Alpha-Beta Pruning
     * @param board Bàn cờ hiện tại
     * @param depth Độ sâu tìm kiếm
     * @param isMaximizing Bên đang tối đa hóa điểm (RED) hay tối thiểu hóa (BLACK)
     * @param alpha Giá trị alpha (dùng cho cắt tỉa)
     * @param beta Giá trị beta (dùng cho cắt tỉa)
     * @return Giá trị đánh giá tốt nhất
     */
    private fun minimax(
        board: Board,
        depth: Int,
        isMaximizing: Boolean,
        alpha: Int,
        beta: Int
    ): Int {
        if (depth == 0) {
            return evaluateBoard(board)
        }
        
        val side = if (isMaximizing) Side.RED else Side.BLACK
        val possibleMoves = getAllPossibleMoves(board, side)
        
        if (possibleMoves.isEmpty()) {
            return if (isMaximizing) Int.MIN_VALUE else Int.MAX_VALUE
        }
        
        var alpha = alpha
        var beta = beta
        
        if (isMaximizing) {
            var maxEval = Int.MIN_VALUE
            for (move in possibleMoves) {
                val (from, to) = move
                val newBoard = cloneBoard(board)
                newBoard.movePiece(from.first, from.second, to.first, to.second)
                val eval = minimax(newBoard, depth - 1, false, alpha, beta)
                maxEval = max(maxEval, eval)
                alpha = max(alpha, eval)
                if (beta <= alpha) break
            }
            return maxEval
        } else {
            var minEval = Int.MAX_VALUE
            for (move in possibleMoves) {
                val (from, to) = move
                val newBoard = cloneBoard(board)
                newBoard.movePiece(from.first, from.second, to.first, to.second)
                val eval = minimax(newBoard, depth - 1, true, alpha, beta)
                minEval = min(minEval, eval)
                beta = min(beta, eval)
                if (beta <= alpha) break
            }
            return minEval
        }
    }
    
    /**
     * Đánh giá bàn cờ (tính điểm cho bên RED)
     * @param board Bàn cờ hiện tại
     * @return Điểm số (dương: RED có lợi, âm: BLACK có lợi)
     */
    private fun evaluateBoard(board: Board): Int {
        var score = 0
        for (row in 0 until 10) {
            for (col in 0 until 9) {
                val piece = board.getPiece(row, col) ?: continue
                val value = pieceValues[piece.type] ?: 0
                score += if (piece.side == Side.RED) value else -value
            }
        }
        return score
    }
    
    /**
     * Liệt kê tất cả nước đi hợp lệ của một bên
     * @param board Bàn cờ hiện tại
     * @param side Bên cần liệt kê nước đi
     * @return Danh sách các nước đi (Pair<from, to>)
     */
    private fun getAllPossibleMoves(board: Board, side: Side): List<Pair<Pair<Int, Int>, Pair<Int, Int>>> {
        return board.getAllPossibleMoves(side)
    }
    
    /**
     * Sao chép bàn cờ (dùng cho thuật toán Minimax)
     */
    private fun cloneBoard(original: Board): Board {
        return original.clone()
    }
}