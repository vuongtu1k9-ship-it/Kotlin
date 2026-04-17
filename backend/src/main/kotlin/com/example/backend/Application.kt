package com.example.backend

import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.cio.*
import io.ktor.server.engine.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

fun main() {
    embeddedServer(CIO, port = 8080, host = "0.0.0.0") {
        module()
    }.start(wait = true)
}

fun Application.module() {
    install(ContentNegotiation) {
        json()
    }
    
    routing {
        get("/") {
            call.respondText("Chào mừng đến với backend cờ tướng (Ktor CIO Lite)!", ContentType.Text.Plain)
        }
        
        // API để lưu trạng thái ván cờ
        post("/save-game") {
            // TODO: Xử lý lưu trạng thái ván cờ
            call.respond(HttpStatusCode.OK, "Ván cờ đã được lưu!")
        }
        
        // API để lấy trạng thái ván cờ
        get("/load-game") {
            // TODO: Xử lý tải trạng thái ván cờ
            call.respond(HttpStatusCode.OK, mapOf("status" to "success", "board" to emptyList<String>()))
        }
    }
}