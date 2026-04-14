package com.xiangqi

fun main() {
    val game = Game()
    game.start()
    
    // Vòng lặp game (đơn giản)
    while (true) {
        print(">>> Nhập nước đi: ")
        val input = readlnOrNull() ?: continue
        if (input == "exit") break
        game.handleMove(input)
    }
}