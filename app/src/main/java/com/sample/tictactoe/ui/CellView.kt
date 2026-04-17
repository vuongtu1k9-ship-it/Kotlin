package com.sample.tictactoe.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import com.sample.tictactoe.game.Player
import kotlinx.coroutines.launch

@Composable
fun CellView(
    player: Player,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val scale = remember { Animatable(0f) }

    LaunchedEffect(player) {
        if (player != Player.EMPTY) {
            scale.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = 200)
            )
        }
    }

    Canvas(
        modifier = modifier
            .pointerInput(Unit) {
                detectTapGestures {
                    onClick()
                }
            }
    ) {
        // Draw cell background
        drawRect(Color(0xFF121212))

        // Draw grid lines
        drawLine(
            color = Color(0xFF333333),
            start = Offset(0f, size.height),
            end = Offset(size.width, size.height),
            strokeWidth = 2.dp.toPx()
        )
        drawLine(
            color = Color(0xFF333333),
            start = Offset(size.width, 0f),
            end = Offset(size.width, size.height),
            strokeWidth = 2.dp.toPx()
        )

        // Draw X or O
        when (player) {
            Player.X -> {
                val center = Offset(size.width / 2, size.height / 2)
                val strokeWidth = 8.dp.toPx()
                drawLine(
                    color = Color(0xFFFF5252),
                    start = center.copy(x = center.x - 40.dp.toPx()),
                    end = center.copy(x = center.x + 40.dp.toPx()),
                    strokeWidth = strokeWidth
                )
                drawLine(
                    color = Color(0xFFFF5252),
                    start = center.copy(y = center.y - 40.dp.toPx()),
                    end = center.copy(y = center.y + 40.dp.toPx()),
                    strokeWidth = strokeWidth
                )
            }
            Player.O -> {
                val center = Offset(size.width / 2, size.height / 2)
                val radius = 40.dp.toPx()
                drawCircle(
                    color = Color(0xFF448AFF),
                    center = center,
                    radius = radius,
                    style = Stroke(width = 8.dp.toPx())
                )
            }
            Player.EMPTY -> { /* Empty cell */ }
        }
    }
}
