package com.cotuong

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
            
            // Màu sắc xen kẽ
            val color = if ((x + y) % 2 == 0) Color(0xFFF5F5DC) else Color(0xFFDEB887)
            drawRect(
                color = color,
                topLeft = Offset(left, top),
                size = androidx.compose.ui.geometry.Size(cellSize, cellSize)
            )
        }
    }
    
    // Vẽ sông
    drawRect(
        color = Color.Blue.copy(alpha = 0.2f),
        topLeft = Offset(0f, 4.5f * cellSize),
        size = androidx.compose.ui.geometry.Size(size.width, cellSize)
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
