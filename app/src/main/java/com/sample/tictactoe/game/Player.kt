package com.sample.tictactoe.game

enum class Player {
    X,
    O,
    EMPTY
}

fun Player.next(): Player = when (this) {
    Player.X -> Player.O
    Player.O -> Player.X
    Player.EMPTY -> Player.EMPTY
}

fun Player.isWin(): Boolean = this != Player.EMPTY

fun Player.toMark(): String = when (this) {
    Player.X -> "X"
    Player.O -> "O"
    Player.EMPTY -> ""
}
