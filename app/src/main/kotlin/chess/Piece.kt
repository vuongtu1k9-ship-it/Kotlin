package chess

/**
 * Enum định nghĩa loại quân cờ trong cờ tướng.
 */
enum class PieceType {
    GENERAL,  // Tướng
    ADVISOR,  // Sĩ
    ELEPHANT, // Tượng
    CHARIOT,  // Xe
    CANNON,   // Pháo
    HORSE,    // Mã
    SOLDIER   // Tốt
}

/**
 * Enum định nghĩa màu sắc của quân cờ.
 */
enum class PieceColor {
    RED,   // Quân đỏ
    BLACK  // Quân đen
}

/**
 * Lớp đại diện cho một quân cờ trong cờ tướng.
 * @property type Loại quân cờ.
 * @property color Màu sắc của quân cờ.
 * @property x Vị trí cột (0-8).
 * @property y Vị trí hàng (0-9).
 */
data class Piece(
    val type: PieceType,
    val color: PieceColor,
    var x: Int,
    var y: Int
) {
    /**
     * Kiểm tra xem quân cờ có hợp lệ không.
     */
    fun isValid(): Boolean {
        return x in 0..8 && y in 0..9
    }
}