package com.openclaw.client.data.repository;

import com.openclaw.client.data.remote.*;
import com.openclaw.client.data.remote.WebSocketClient;
import com.openclaw.client.domain.model.*;
import kotlinx.coroutines.flow.Flow;
import javax.inject.Inject;
import javax.inject.Singleton;

@javax.inject.Singleton()
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0082\u0001\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0005\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u000e\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000fJ.\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u00120\u00112\u0006\u0010\u0013\u001a\u00020\u000f2\b\u0010\u0014\u001a\u0004\u0018\u00010\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u0015\u0010\u0016J8\u0010\u0017\u001a\b\u0012\u0004\u0012\u00020\u00180\u00112\u0006\u0010\u0019\u001a\u00020\u000f2\b\u0010\u001a\u001a\u0004\u0018\u00010\u000f2\b\u0010\u001b\u001a\u0004\u0018\u00010\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b\u001c\u0010\u001dJ\u0006\u0010\u001e\u001a\u00020\rJ2\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020 0\u00112\u0006\u0010!\u001a\u00020\u000f2\f\u0010\"\u001a\b\u0012\u0004\u0012\u00020\u000f0#H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b$\u0010%J.\u0010&\u001a\b\u0012\u0004\u0012\u00020\'0\u00112\u0006\u0010\u0019\u001a\u00020\u000f2\b\b\u0002\u0010(\u001a\u00020\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b)\u0010\u0016J\"\u0010*\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00120#0\u0011H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b+\u0010,J4\u0010-\u001a\b\u0012\u0004\u0012\u00020.0\u00112\u0006\u0010\u0019\u001a\u00020\u000f2\u0006\u0010/\u001a\u0002002\u0006\u00101\u001a\u00020\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b2\u00103J\u001c\u00104\u001a\b\u0012\u0004\u0012\u0002050\u0011H\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b6\u0010,J,\u00107\u001a\b\u0012\u0004\u0012\u0002080\u00112\u0006\u0010\u0019\u001a\u00020\u000f2\u0006\u00109\u001a\u00020\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b:\u0010\u0016J\u0016\u0010;\u001a\u00020\r2\u0006\u0010/\u001a\u0002002\u0006\u00101\u001a\u00020\u000fJ$\u0010<\u001a\b\u0012\u0004\u0012\u00020=0\u00112\u0006\u0010\u0019\u001a\u00020\u000fH\u0086@\u00f8\u0001\u0000\u00f8\u0001\u0001\u00a2\u0006\u0004\b>\u0010?J\u0016\u0010@\u001a\u00020\r2\u0006\u0010\u0019\u001a\u00020\u000f2\u0006\u0010A\u001a\u00020\u000fR\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u0082\u0002\u000b\n\u0002\b!\n\u0005\b\u00a1\u001e0\u0001\u00a8\u0006B"}, d2 = {"Lcom/openclaw/client/data/repository/OpenClawRepository;", "", "apiService", "Lcom/openclaw/client/data/remote/OpenClawApiService;", "webSocketClient", "Lcom/openclaw/client/data/remote/WebSocketClient;", "(Lcom/openclaw/client/data/remote/OpenClawApiService;Lcom/openclaw/client/data/remote/WebSocketClient;)V", "streamMessages", "Lkotlinx/coroutines/flow/Flow;", "Lcom/openclaw/client/domain/model/StreamMessage;", "getStreamMessages", "()Lkotlinx/coroutines/flow/Flow;", "connectWebSocket", "", "url", "", "createProject", "Lkotlin/Result;", "Lcom/openclaw/client/data/remote/ProjectDto;", "name", "description", "createProject-0E7RQCE", "(Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "debugCode", "Lcom/openclaw/client/data/remote/DebugResponse;", "code", "logcat", "stacktrace", "debugCode-BWLJW6A", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "disconnectWebSocket", "generateArchitecture", "Lcom/openclaw/client/data/remote/ArchitectureResponse;", "appName", "features", "", "generateArchitecture-0E7RQCE", "(Ljava/lang/String;Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "generateTests", "Lcom/openclaw/client/data/remote/TestResponse;", "framework", "generateTests-0E7RQCE", "getProjects", "getProjects-IoAF18A", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getSuggestion", "Lcom/openclaw/client/data/remote/SuggestResponse;", "cursor", "", "context", "getSuggestion-BWLJW6A", "(Ljava/lang/String;ILjava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "healthCheck", "Lcom/openclaw/client/data/remote/HealthResponse;", "healthCheck-IoAF18A", "refactorCode", "Lcom/openclaw/client/data/remote/RefactorResponse;", "targetArchitecture", "refactorCode-0E7RQCE", "requestSuggestion", "reviewCode", "Lcom/openclaw/client/data/remote/ReviewResponse;", "reviewCode-gIAlu-s", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "sendCodeUpdate", "fileName", "app_debug"})
public final class OpenClawRepository {
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.data.remote.OpenClawApiService apiService = null;
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.data.remote.WebSocketClient webSocketClient = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.Flow<com.openclaw.client.domain.model.StreamMessage> streamMessages = null;
    
    @javax.inject.Inject()
    public OpenClawRepository(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.OpenClawApiService apiService, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.WebSocketClient webSocketClient) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.Flow<com.openclaw.client.domain.model.StreamMessage> getStreamMessages() {
        return null;
    }
    
    public final void connectWebSocket(@org.jetbrains.annotations.NotNull()
    java.lang.String url) {
    }
    
    public final void disconnectWebSocket() {
    }
    
    public final void sendCodeUpdate(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    java.lang.String fileName) {
    }
    
    public final void requestSuggestion(int cursor, @org.jetbrains.annotations.NotNull()
    java.lang.String context) {
    }
}