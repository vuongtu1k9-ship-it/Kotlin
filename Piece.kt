package com.xiangqi

enum class PieceType {
    KING,       // Tướng (Soái)
    ADVISOR,    // Sĩ
    ELEPHANT,   // Tượng
    HORSE,      // Mã
    CHARIOT,    // Xe
    CANNON,     // Pháo
    PAWN        // Tốt (Binh)
}

enum class Side {
    RED, BLACK
}

data class Piece(
    val type: PieceType,
    val side: Side,
    val symbol: String
) {
    fun isRed(): Boolean = side == Side.RED
    fun isBlack(): Boolean = side == Side.BLACK
}