package com.sample.tictactoe.game

class Board {
    private val grid: Array<Array<Player>> = Array(3) { Array(3) { Player.EMPTY } }

    fun getCell(row: Int, col: Int): Player = grid[row][col]

    fun setCell(row: Int, col: Int, player: Player) {
        if (row in 0..2 && col in 0..2 && grid[row][col] == Player.EMPTY) {
            grid[row][col] = player
        }
    }

    fun reset() {
        for (i in 0..2) {
            for (j in 0..2) {
                grid[i][j] = Player.EMPTY
            }
        }
    }

    fun checkWin(player: Player): Boolean {
        if (player == Player.EMPTY) return false

        // Check rows
        for (i in 0..2) {
            if (grid[i][0] == player && grid[i][1] == player && grid[i][2] == player) {
                return true
            }
        }

        // Check columns
        for (j in 0..2) {
            if (grid[0][j] == player && grid[1][j] == player && grid[2][j] == player) {
                return true
            }
        }

        // Check diagonals
        if (grid[0][0] == player && grid[1][1] == player && grid[2][2] == player) {
            return true
        }
        if (grid[0][2] == player && grid[1][1] == player && grid[2][0] == player) {
            return true
        }

        return false
    }

    fun checkDraw(): Boolean {
        for (i in 0..2) {
            for (j in 0..2) {
                if (grid[i][j] == Player.EMPTY) {
                    return false
                }
            }
        }
        return true
    }

    fun isValidMove(row: Int, col: Int): Boolean {
        return row in 0..2 && col in 0..2 && grid[row][col] == Player.EMPTY
    }
}
