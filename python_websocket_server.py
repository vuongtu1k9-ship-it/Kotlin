#!/usr/bin/env python3
# WebSocket Server thay thế Kotlin tạm thời

import asyncio
import websockets

async def handle_message(websocket, path):
    print("Kotlin WebSocket Server (Python) started on ws://localhost:8081")
    try:
        async for message in websocket:
            print(f"Received from Node.js: {message}")
            # Xử lý logic trò chơi giả lập
            if message.startswith("9a-8a"):
                response = f"Kotlin đã xử lý nước đi: {message} → Hợp lệ!"
            else:
                response = f"Kotlin đã xử lý: {message} → Nước đi không hợp lệ."
            await websocket.send(response)
    except Exception as e:
        print(f"Error: {e}")

start_server = websockets.serve(handle_message, "localhost", 8081)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()