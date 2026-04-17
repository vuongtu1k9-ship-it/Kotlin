package com.openclaw.client.data.remote

import com.openclaw.client.domain.model.StreamMessage
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import okhttp3.*
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebSocketClient @Inject constructor(
    private val okHttpClient: OkHttpClient
) {
    private var webSocket: WebSocket? = null
    private val _messages = Channel<StreamMessage>(Channel.BUFFERED)
    val messages: Flow<StreamMessage> = _messages.receiveAsFlow()

    private var isConnected = false
    private var serverUrl: String = ""

    fun connect(url: String) {
        if (isConnected) return
        serverUrl = url

        val request = Request.Builder()
            .url(url)
            .build()

        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                isConnected = true
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                val message = parseMessage(text)
                message?.let { _messages.trySend(it) }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                webSocket.close(1000, null)
                isConnected = false
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnected = false
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                isConnected = false
                _messages.trySend(StreamMessage.Error(t.message ?: "Connection failed"))
            }
        })
    }

    fun sendMessage(type: String, payload: Map<String, Any>) {
        if (!isConnected) return
        val message = mapOf("type" to type, "payload" to payload)
        webSocket?.send(toJson(message))
    }

    fun sendCodeUpdate(code: String, fileName: String) {
        sendMessage("code_update", mapOf("code" to code, "file" to fileName))
    }

    fun requestSuggestion(cursor: Int, context: String) {
        sendMessage("suggest", mapOf("cursor" to cursor, "context" to context))
    }

    fun disconnect() {
        webSocket?.close(1000, "Client disconnected")
        webSocket = null
        isConnected = false
    }

    private fun parseMessage(text: String): StreamMessage? {
        return try {
            val json = parseJson(text)
            val type = json["type"] as? String ?: return null
            val data = json["data"] as? String ?: ""

            when (type) {
                "suggestion" -> StreamMessage.Suggestion(data)
                "debug" -> StreamMessage.Debug(data)
                "error" -> StreamMessage.Error(data)
                "complete" -> StreamMessage.Complete(data)
                "progress" -> StreamMessage.Progress(data)
                else -> null
            }
        } catch (e: Exception) {
            StreamMessage.Error("Parse error: ${e.message}")
        }
    }

    private fun toJson(map: Map<String, Any>): String {
        return buildString {
            append("{")
            map.entries.forEachIndexed { index, (key, value) ->
                if (index > 0) append(",")
                append("\"$key\":")
                when (value) {
                    is String -> append("\"${value.replace("\"", "\\\"")}\"")
                    is Number -> append(value)
                    is Boolean -> append(value)
                    is Map<*, *> -> append(toJson(value as Map<String, Any>))
                    else -> append("\"$value\"")
                }
            }
            append("}")
        }
    }

    private fun parseJson(text: String): Map<String, Any> {
        return try {
            val gson = com.google.gson.Gson()
            gson.fromJson(text, Map::class.java) as Map<String, Any>
        } catch (e: Exception) {
            emptyMap()
        }
    }
}