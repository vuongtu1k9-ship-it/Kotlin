package com.openclaw.client.ui.screens;

import androidx.lifecycle.ViewModel;
import com.xiangqi.client.BuildConfig;
import com.openclaw.client.data.repository.OpenClawRepository;
import com.openclaw.client.domain.model.*;
import com.openclaw.client.data.remote.*;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.*;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000Z\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\t\n\u0002\u0010 \n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001B\u000f\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0006\u0010\u000e\u001a\u00020\u000fJ\u0018\u0010\u0010\u001a\u00020\u000f2\u0006\u0010\u0011\u001a\u00020\u00122\b\u0010\u0013\u001a\u0004\u0018\u00010\u0012J\"\u0010\u0014\u001a\u00020\u000f2\u0006\u0010\u0015\u001a\u00020\u00122\b\u0010\u0016\u001a\u0004\u0018\u00010\u00122\b\u0010\u0017\u001a\u0004\u0018\u00010\u0012J\u0006\u0010\u0018\u001a\u00020\u000fJ\u001c\u0010\u0019\u001a\u00020\u000f2\u0006\u0010\u001a\u001a\u00020\u00122\f\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00120\u001cJ\u0018\u0010\u001d\u001a\u00020\u000f2\u0006\u0010\u0015\u001a\u00020\u00122\b\b\u0002\u0010\u001e\u001a\u00020\u0012J\u001e\u0010\u001f\u001a\u00020\u000f2\u0006\u0010\u0015\u001a\u00020\u00122\u0006\u0010 \u001a\u00020\t2\u0006\u0010!\u001a\u00020\u0012J\u0010\u0010\"\u001a\u00020\u000f2\u0006\u0010#\u001a\u00020$H\u0002J\u0006\u0010%\u001a\u00020\u000fJ\u0006\u0010&\u001a\u00020\u000fJ\u0016\u0010\'\u001a\u00020\u000f2\u0006\u0010\u0015\u001a\u00020\u00122\u0006\u0010(\u001a\u00020\u0012J\u000e\u0010)\u001a\u00020\u000f2\u0006\u0010\u0015\u001a\u00020\u0012J\u0010\u0010*\u001a\u00020\u000f2\u0006\u0010+\u001a\u00020,H\u0002J\u000e\u0010-\u001a\u00020\u000f2\u0006\u0010.\u001a\u00020/J\u000e\u00100\u001a\u00020\u000f2\u0006\u00101\u001a\u00020\u0012R\u0014\u0010\u0005\u001a\b\u0012\u0004\u0012\u00020\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0017\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u00070\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\r\u00a8\u00062"}, d2 = {"Lcom/openclaw/client/ui/screens/MainViewModel;", "Landroidx/lifecycle/ViewModel;", "repository", "Lcom/openclaw/client/data/repository/OpenClawRepository;", "(Lcom/openclaw/client/data/repository/OpenClawRepository;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/openclaw/client/ui/screens/MainUiState;", "requestCount", "", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "connect", "", "createProject", "name", "", "description", "debugCode", "code", "logcat", "stacktrace", "disconnect", "generateArchitecture", "appName", "features", "", "generateTests", "framework", "getSuggestion", "cursor", "context", "handleStreamMessage", "message", "Lcom/openclaw/client/domain/model/StreamMessage;", "healthCheck", "loadProjects", "refactorCode", "targetArchitecture", "reviewCode", "selectLeader", "botType", "Lcom/openclaw/client/domain/model/BotType;", "selectProject", "project", "Lcom/openclaw/client/domain/model/Project;", "sendMessage", "text", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class MainViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.data.repository.OpenClawRepository repository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.openclaw.client.ui.screens.MainUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.openclaw.client.ui.screens.MainUiState> uiState = null;
    private int requestCount = 0;
    
    @javax.inject.Inject()
    public MainViewModel(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.repository.OpenClawRepository repository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.openclaw.client.ui.screens.MainUiState> getUiState() {
        return null;
    }
    
    public final void connect() {
    }
    
    public final void disconnect() {
    }
    
    public final void healthCheck() {
    }
    
    public final void getSuggestion(@org.jetbrains.annotations.NotNull()
    java.lang.String code, int cursor, @org.jetbrains.annotations.NotNull()
    java.lang.String context) {
    }
    
    public final void debugCode(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.Nullable()
    java.lang.String logcat, @org.jetbrains.annotations.Nullable()
    java.lang.String stacktrace) {
    }
    
    public final void refactorCode(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    java.lang.String targetArchitecture) {
    }
    
    public final void generateArchitecture(@org.jetbrains.annotations.NotNull()
    java.lang.String appName, @org.jetbrains.annotations.NotNull()
    java.util.List<java.lang.String> features) {
    }
    
    public final void generateTests(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    java.lang.String framework) {
    }
    
    public final void reviewCode(@org.jetbrains.annotations.NotNull()
    java.lang.String code) {
    }
    
    public final void sendMessage(@org.jetbrains.annotations.NotNull()
    java.lang.String text) {
    }
    
    public final void createProject(@org.jetbrains.annotations.NotNull()
    java.lang.String name, @org.jetbrains.annotations.Nullable()
    java.lang.String description) {
    }
    
    public final void loadProjects() {
    }
    
    public final void selectProject(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.Project project) {
    }
    
    private final void selectLeader(com.openclaw.client.domain.model.BotType botType) {
    }
    
    private final void handleStreamMessage(com.openclaw.client.domain.model.StreamMessage message) {
    }
}