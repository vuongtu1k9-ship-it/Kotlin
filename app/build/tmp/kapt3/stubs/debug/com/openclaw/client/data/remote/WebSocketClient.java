package com.openclaw.client.data.remote;

import com.openclaw.client.domain.model.StreamMessage;
import kotlinx.coroutines.flow.Flow;
import java.util.concurrent.TimeUnit;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000N\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0010$\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\n\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u000e\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u000fJ\u0006\u0010\u0015\u001a\u00020\u0013J\u001c\u0010\u0016\u001a\u000e\u0012\u0004\u0012\u00020\u000f\u0012\u0004\u0012\u00020\u00010\u00172\u0006\u0010\u0018\u001a\u00020\u000fH\u0002J\u0012\u0010\u0019\u001a\u0004\u0018\u00010\u00072\u0006\u0010\u0018\u001a\u00020\u000fH\u0002J\u0016\u0010\u001a\u001a\u00020\u00132\u0006\u0010\u001b\u001a\u00020\u001c2\u0006\u0010\u001d\u001a\u00020\u000fJ\u0016\u0010\u001e\u001a\u00020\u00132\u0006\u0010\u001f\u001a\u00020\u000f2\u0006\u0010 \u001a\u00020\u000fJ\"\u0010!\u001a\u00020\u00132\u0006\u0010\"\u001a\u00020\u000f2\u0012\u0010#\u001a\u000e\u0012\u0004\u0012\u00020\u000f\u0012\u0004\u0012\u00020\u00010\u0017J\u001c\u0010$\u001a\u00020\u000f2\u0012\u0010%\u001a\u000e\u0012\u0004\u0012\u00020\u000f\u0012\u0004\u0012\u00020\u00010\u0017H\u0002R\u0014\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0017\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u00070\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\u000fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0010\u001a\u0004\u0018\u00010\u0011X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006&"}, d2 = {"Lcom/openclaw/client/data/remote/WebSocketClient;", "", "okHttpClient", "Lokhttp3/OkHttpClient;", "(Lokhttp3/OkHttpClient;)V", "_messages", "Lkotlinx/coroutines/channels/Channel;", "Lcom/openclaw/client/domain/model/StreamMessage;", "isConnected", "", "messages", "Lkotlinx/coroutines/flow/Flow;", "getMessages", "()Lkotlinx/coroutines/flow/Flow;", "serverUrl", "", "webSocket", "Lokhttp3/WebSocket;", "connect", "", "url", "disconnect", "parseJson", "", "text", "parseMessage", "requestSuggestion", "cursor", "", "context", "sendCodeUpdate", "code", "fileName", "sendMessage", "type", "payload", "toJson", "map", "app_debug"})
public final class WebSocketClient {
    @org.jetbrains.annotations.NotNull()
    private final okhttp3.OkHttpClient okHttpClient = null;
    @org.jetbrains.annotations.Nullable()
    private okhttp3.WebSocket webSocket;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.channels.Channel<com.openclaw.client.domain.model.StreamMessage> _messages = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.Flow<com.openclaw.client.domain.model.StreamMessage> messages = null;
    private boolean isConnected = false;
    @org.jetbrains.annotations.NotNull()
    private java.lang.String serverUrl = "";
    
    @javax.inject.Inject()
    public WebSocketClient(@org.jetbrains.annotations.NotNull()
    okhttp3.OkHttpClient okHttpClient) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<com.openclaw.client.domain.model.StreamMessage> getMessages() {
        return null;
    }
    
    public final void connect(@org.jetbrains.annotations.NotNull()
    java.lang.String url) {
    }
    
    public final void sendMessage(@org.jetbrains.annotations.NotNull()
    java.lang.String type, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, ? extends java.lang.Object> payload) {
    }
    
    public final void sendCodeUpdate(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    java.lang.String fileName) {
    }
    
    public final void requestSuggestion(int cursor, @org.jetbrains.annotations.NotNull()
    java.lang.String context) {
    }
    
    public final void disconnect() {
    }
    
    private final com.openclaw.client.domain.model.StreamMessage parseMessage(java.lang.String text) {
        return null;
    }
    
    private final java.lang.String toJson(java.util.Map<java.lang.String, ? extends java.lang.Object> map) {
        return null;
    }
    
    private final java.util.Map<java.lang.String, java.lang.Object> parseJson(java.lang.String text) {
        return null;
    }
}