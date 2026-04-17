package com.sample.tictactoe.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sample.tictactoe.game.Board
import com.sample.tictactoe.game.Player
import com.sample.tictactoe.game.next

@Composable
fun TicTacToeScreen() {
    var board by remember { mutableStateOf(Board()) }
    var currentPlayer by remember { mutableStateOf(Player.X) }
    var gameStatus by remember { mutableStateOf("X's Turn") }

    fun handleCellClick(row: Int, col: Int) {
        if (board.checkWin(Player.X) || board.checkWin(Player.O) || board.checkDraw()) {
            return // Game already over
        }

        if (board.isValidMove(row, col)) {
            board.setCell(row, col, currentPlayer)

            if (board.checkWin(currentPlayer)) {
                gameStatus = "${currentPlayer.toMark()} Wins!"
            } else if (board.checkDraw()) {
                gameStatus = "Draw!"
            } else {
                currentPlayer = currentPlayer.next()
                gameStatus = "${currentPlayer.toMark()}'s Turn"
            }
        }
    }

    fun resetGame() {
        board.reset()
        currentPlayer = Player.X
        gameStatus = "X's Turn"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Tic Tac Toe",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Text(
            text = gameStatus,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurface
        )

        BoardView(
            board = board,
            onCellClick = ::handleCellClick,
            modifier = Modifier.fillMaxWidth(0.9f)
        )

        Button(
            onClick = ::resetGame,
            modifier = Modifier.fillMaxWidth(0.6f)
        ) {
            Text("Reset Game")
        }
    }
}
