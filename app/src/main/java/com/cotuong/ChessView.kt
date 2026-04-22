package com.cotuong

import com.cotuong.Board
import com.cotuong.Piece
import com.cotuong.PieceColor
import com.cotuong.PieceType
import android.media.SoundPool
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.nativeCanvas

/**
 * Composable để vẽ bàn cờ và quân cờ.
 */
@Composable
fun ChessView(
    soundPool: SoundPool,
    soundMoveId: Int,
    soundCaptureId: Int,
    soundWinId: Int
) {
    // Lưu trạng thái bàn cờ và quân cờ được chọn
    val board = remember { Board() }
    val selectedPiece = remember { mutableStateOf<Piece?>(null) }
    val currentPlayer = remember { mutableStateOf(PieceColor.RED) } // RED đi trước
    val gameStatus = remember { mutableStateOf("") }
    val lastMove = remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        // Hiển thị trạng thái trò chơi
        if (gameStatus.value.isNotEmpty()) {
            Text(
                text = gameStatus.value,
                modifier = Modifier.padding(16.dp),
                fontSize = 20.sp,
                color = Color.Red
            )
        }
        
        // Hiển thị nước đi cuối cùng
        if (lastMove.value.isNotEmpty()) {
            Text(
                text = "Nước đi cuối: ${lastMove.value}",
                modifier = Modifier.padding(horizontal = 16.dp),
                fontSize = 16.sp,
                color = Color.Blue
            )
        }

        // Nút Quay lại (Undo)
        Button(
            onClick = {
                if (board.undo()) {
                    // Phát âm thanh hoàn tác
                    soundPool.play(soundMoveId, 1f, 1f, 0, 0, 1f)
                    // Đổi lượt người chơi
                    currentPlayer.value = if (currentPlayer.value == PieceColor.RED) PieceColor.BLACK else PieceColor.RED
                }
            },
            modifier = Modifier.padding(16.dp),
            enabled = board.canUndo() // Vô hiệu hóa nếu không thể hoàn tác
        ) {
            Text("Quay lại")
        }

        // Nút Reset
        Button(
            onClick = {
                // Khởi tạo lại bàn cờ
                board.initializeBoard()
                selectedPiece.value = null
                currentPlayer.value = PieceColor.RED
                gameStatus.value = ""
            },
            modifier = Modifier.padding(16.dp)
        ) {
            Text("Reset Game")
        }

        // Bàn cờ
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .weight(1f)
                .pointerInput(Unit) {
                    detectTapGestures { offset ->
                        val cellSize = size.width / 9f
                        val x = (offset.x / cellSize).toInt()
                        val y = (offset.y / cellSize).toInt()

                        if (x in 0..8 && y in 0..9) {
                            val piece = board.getPieceAt(x, y)

                            if (selectedPiece.value == null) {
                                // Chọn quân cờ nếu thuộc về người chơi hiện tại
                                if (piece != null && piece.color == currentPlayer.value) {
                                    selectedPiece.value = piece
                                }
                            } else {
                                // Di chuyển quân cờ
                                if (board.movePiece(selectedPiece.value!!.x, selectedPiece.value!!.y, x, y)) {
                                    // Phát âm thanh khi di chuyển quân
                                    soundPool.play(soundMoveId, 1f, 1f, 0, 0, 1f)
                                    
                                    // Kiểm tra thắng/thua
                                    if (isGameOver(board)) {
                                        soundPool.play(soundWinId, 1f, 1f, 0, 0, 1f)
                                        gameStatus.value = "${if (currentPlayer.value == PieceColor.RED) "Đỏ" else "Đen"} thắng!"
                                    } else {
                                        // Đổi lượt
                                        currentPlayer.value = if (currentPlayer.value == PieceColor.RED) PieceColor.BLACK else PieceColor.RED
                                    }
                                }
                                selectedPiece.value = null
                            }
                        }
                    }
                }
        ) {
            drawBoard()
            drawPieces(board, selectedPiece.value)
        }
    }
}

/**
 * Vẽ bàn cờ.
 */
private fun DrawScope.drawBoard() {
    val cellSize = size.width / 9f
    
    // Vẽ các ô vuông
    for (x in 0 until 9) {
        for (y in 0 until 10) {
            val left = x * cellSize
            val top = y * cellSize
            
            // Màu sắc xen kẽ (chỉ áp dụng cho ô cờ)
            val color = if ((x + y) % 2 == 0) Color(0xFFF5F5DC) else Color(0xFFDEB887)
            drawRect(
                color = color,
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(cellSize, cellSize)
            )
            
            // Vẽ đường biên ô
            drawRect(
                color = Color.Black,
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(cellSize, cellSize),
                style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1f)
            )
        }
    }
    
    // Vẽ sông (giữa hàng 5 và 6)
    drawRect(
        color = Color.Blue.copy(alpha = 0.2f),
        topLeft = Offset(0f, 4.5f * cellSize),
        size = androidx.compose.ui.geometry.Size(size.width, cellSize)
    )
    
    // Vẽ cung Tướng (hàng 1-3 và 8-10)
    val cungSize = cellSize * 2
    // Cung Đỏ (hàng 1-3)
    drawLine(
        color = Color.Red,
        start = Offset(3.5f * cellSize, 0.5f * cellSize),
        end = Offset(5.5f * cellSize, 2.5f * cellSize),
        strokeWidth = 2f
    )
    drawLine(
        color = Color.Red,
        start = Offset(5.5f * cellSize, 0.5f * cellSize),
        end = Offset(3.5f * cellSize, 2.5f * cellSize),
        strokeWidth = 2f
    )
    // Cung Đen (hàng 8-10)
    drawLine(
        color = Color.Black,
        start = Offset(3.5f * cellSize, 7.5f * cellSize),
        end = Offset(5.5f * cellSize, 9.5f * cellSize),
        strokeWidth = 2f
    )
    drawLine(
        color = Color.Black,
        start = Offset(5.5f * cellSize, 7.5f * cellSize),
        end = Offset(3.5f * cellSize, 9.5f * cellSize),
        strokeWidth = 2f
    )
}

/**
 * Vẽ các quân cờ.
 * @param board Bàn cờ chứa các quân cờ.
 * @param selectedPiece Quân cờ được chọn.
 */
private fun DrawScope.drawPieces(board: Board, selectedPiece: Piece?) {
    val cellSize = size.width / 9f
    val pieceRadius = cellSize / 2.5f
    
    board.getPieces().forEach { piece ->
        val centerX = piece.x * cellSize + cellSize / 2
        val centerY = piece.y * cellSize + cellSize / 2
        
        // Vẽ quân cờ
        drawCircle(
            color = if (piece.color == PieceColor.RED) Color.Red else Color.Black,
            radius = pieceRadius,
            center = Offset(centerX, centerY)
        )
        
        // Đánh dấu quân cờ được chọn
        if (selectedPiece == piece) {
            drawCircle(
                color = Color.Yellow.copy(alpha = 0.5f),
                radius = pieceRadius * 1.2f,
                center = Offset(centerX, centerY)
            )
        }
        
        // Vẽ tên quân cờ
        drawContext.canvas.nativeCanvas.apply {
            drawText(
                when (piece.type) {
                    PieceType.GENERAL -> "Tướng"
                    PieceType.ADVISOR -> "Sĩ"
                    PieceType.ELEPHANT -> "Tượng"
                    PieceType.CHARIOT -> "Xe"
                    PieceType.CANNON -> "Pháo"
                    PieceType.HORSE -> "Mã"
                    PieceType.SOLDIER -> "Tốt"
                },
                centerX,
                centerY,
                android.graphics.Paint().apply {
                    textSize = pieceRadius
                    color = android.graphics.Color.WHITE
                    textAlign = android.graphics.Paint.Align.CENTER
                    isAntiAlias = true
                }
            )
        }
    }
}

/**
 * Kiểm tra trò chơi kết thúc chưa (tướng bị ăn).
 */
private fun isGameOver(board: Board): Boolean {
    val redGeneral = board.getPieces().any { it.type == PieceType.GENERAL && it.color == PieceColor.RED }
    val blackGeneral = board.getPieces().any { it.type == PieceType.GENERAL && it.color == PieceColor.BLACK }
    return !redGeneral || !blackGeneral
}
