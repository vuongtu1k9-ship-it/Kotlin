package com.xiangqi

import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.routing.*
import io.ktor.server.websocket.*
import io.ktor.websocket.*
import kotlinx.coroutines.channels.ClosedReceiveChannelException
import java.time.Duration

fun main() {
    embeddedServer(Netty, port = 8081) {
        install(WebSockets) {
            pingPeriod = Duration.ofSeconds(15)
            timeout = Duration.ofSeconds(30)
            maxFrameSize = Long.MAX_VALUE
            masking = false
        }
        routing {
            webSocket("/") {
                println("Kotlin WebSocket server started on ws://localhost:8081")
                try {
                    for (frame in incoming) {
                        if (frame is Frame.Text) {
                            val message = frame.readText()
                            println("Received from Node.js: $message")
                            
                            // Xử lý logic trò chơi ở đây
                            val game = Game()
                            val response = if (message.matches(Regex("^\\d[a-i]-\\d[a-i]$"))) {
                                // Gọi hàm xử lý nước đi
                                game.handleMove(message)
                                "Kotlin đã xử lý nước đi: $message"
                            } else {
                                "Kotlin không hiểu yêu cầu: $message"
                            }
                            
                            // Gửi phản hồi về Node.js
                            send(Frame.Text(response))
                        }
                    }
                } catch (e: ClosedReceiveChannelException) {
                    println("Client disconnected: ${e.message}")
                } catch (e: Exception) {
                    println("Error: ${e.message}")
                }
            }
        }
    }.start(wait = true)
}