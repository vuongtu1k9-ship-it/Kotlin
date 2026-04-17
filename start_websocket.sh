#!/bin/bash
# Script khởi động WebSocket Server (Kotlin)

cd /root/Kotlin/
kotor -cp "$(kotlinc WebSocketServer.kt -cp "app/build/libs/*" -d . -include-runtime)" com.xiangqi.WebSocketServerKt