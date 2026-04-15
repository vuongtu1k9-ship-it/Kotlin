package com.xiangqi

/**
 * Enum để xác định loại quân cờ
 */
enum class PieceType {
    KING,      // Tướng/Soái
    ADVISOR,   // Sĩ
    ELEPHANT,  // Tượng
    HORSE,     // Mã
    CHARIOT,   // Xe
    CANNON,    // Pháo
    PAWN       // Tốt
}

/**
 * Enum để xác định bên (Đỏ hoặc Đen)
 */
enum class Side {
    RED,   // Đỏ
    BLACK  // Đen
}

/**
 * Class đại diện cho một quân cờ
 */
data class Piece(
    val type: PieceType,  // Loại quân cờ
    val side: Side,       // Bên (Đỏ/Đen)
    val symbol: String    // Ký hiệu quân cờ
) {
    /**
     * Tạo bản sao của quân cờ
     */
    fun copy(): Piece {
        return Piece(type, side, symbol)
    }
}