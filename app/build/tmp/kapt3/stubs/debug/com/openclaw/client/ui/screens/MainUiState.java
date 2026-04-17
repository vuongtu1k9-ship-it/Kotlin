package com.openclaw.client.ui.screens;

import androidx.lifecycle.ViewModel;
import com.xiangqi.client.BuildConfig;
import com.openclaw.client.data.repository.OpenClawRepository;
import com.openclaw.client.domain.model.*;
import com.openclaw.client.data.remote.*;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.*;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000F\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u001e\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001B\u0085\u0001\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0004\u001a\u00020\u0003\u0012\n\b\u0002\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u0012\u000e\b\u0002\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b\u0012\n\b\u0002\u0010\n\u001a\u0004\u0018\u00010\u000b\u0012\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\u0006\u0012\u000e\b\u0002\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000e0\b\u0012\n\b\u0002\u0010\u000f\u001a\u0004\u0018\u00010\u0010\u0012\u000e\b\u0002\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\b\u0012\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0012\u00a2\u0006\u0002\u0010\u0014J\t\u0010#\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010$\u001a\u0004\u0018\u00010\u0012H\u00c6\u0003J\t\u0010%\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010&\u001a\u0004\u0018\u00010\u0006H\u00c6\u0003J\u000f\u0010\'\u001a\b\u0012\u0004\u0012\u00020\t0\bH\u00c6\u0003J\u000b\u0010(\u001a\u0004\u0018\u00010\u000bH\u00c6\u0003J\u000b\u0010)\u001a\u0004\u0018\u00010\u0006H\u00c6\u0003J\u000f\u0010*\u001a\b\u0012\u0004\u0012\u00020\u000e0\bH\u00c6\u0003J\u000b\u0010+\u001a\u0004\u0018\u00010\u0010H\u00c6\u0003J\u000f\u0010,\u001a\b\u0012\u0004\u0012\u00020\u00120\bH\u00c6\u0003J\u0089\u0001\u0010-\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\n\b\u0002\u0010\u0005\u001a\u0004\u0018\u00010\u00062\u000e\b\u0002\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b2\n\b\u0002\u0010\n\u001a\u0004\u0018\u00010\u000b2\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\u00062\u000e\b\u0002\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000e0\b2\n\b\u0002\u0010\u000f\u001a\u0004\u0018\u00010\u00102\u000e\b\u0002\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\b2\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0012H\u00c6\u0001J\u0013\u0010.\u001a\u00020\u00032\b\u0010/\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u00100\u001a\u000201H\u00d6\u0001J\t\u00102\u001a\u00020\u0006H\u00d6\u0001R\u0017\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0017\u0010\r\u001a\b\u0012\u0004\u0012\u00020\u000e0\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0016R\u0013\u0010\n\u001a\u0004\u0018\u00010\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0013\u0010\f\u001a\u0004\u0018\u00010\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0013\u0010\u000f\u001a\u0004\u0018\u00010\u0010\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0013\u0010\u0005\u001a\u0004\u0018\u00010\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u001bR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0004\u0010\u001fR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0002\u0010\u001fR\u0017\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\b\u00a2\u0006\b\n\u0000\u001a\u0004\b \u0010\u0016R\u0013\u0010\u0013\u001a\u0004\u0018\u00010\u0012\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010\"\u00a8\u00063"}, d2 = {"Lcom/openclaw/client/ui/screens/MainUiState;", "", "isLoading", "", "isConnected", "error", "", "agents", "", "Lcom/openclaw/client/domain/model/AgentStatus;", "currentLeader", "Lcom/openclaw/client/domain/model/BotType;", "currentSuggestion", "chatMessages", "Lcom/openclaw/client/ui/screens/ChatMessage;", "debugResult", "Lcom/openclaw/client/domain/model/DebugResult;", "projects", "Lcom/openclaw/client/domain/model/Project;", "selectedProject", "(ZZLjava/lang/String;Ljava/util/List;Lcom/openclaw/client/domain/model/BotType;Ljava/lang/String;Ljava/util/List;Lcom/openclaw/client/domain/model/DebugResult;Ljava/util/List;Lcom/openclaw/client/domain/model/Project;)V", "getAgents", "()Ljava/util/List;", "getChatMessages", "getCurrentLeader", "()Lcom/openclaw/client/domain/model/BotType;", "getCurrentSuggestion", "()Ljava/lang/String;", "getDebugResult", "()Lcom/openclaw/client/domain/model/DebugResult;", "getError", "()Z", "getProjects", "getSelectedProject", "()Lcom/openclaw/client/domain/model/Project;", "component1", "component10", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "", "toString", "app_debug"})
public final class MainUiState {
    private final boolean isLoading = false;
    private final boolean isConnected = false;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String error = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.openclaw.client.domain.model.AgentStatus> agents = null;
    @org.jetbrains.annotations.Nullable()
    private final com.openclaw.client.domain.model.BotType currentLeader = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String currentSuggestion = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.openclaw.client.ui.screens.ChatMessage> chatMessages = null;
    @org.jetbrains.annotations.Nullable()
    private final com.openclaw.client.domain.model.DebugResult debugResult = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.openclaw.client.domain.model.Project> projects = null;
    @org.jetbrains.annotations.Nullable()
    private final com.openclaw.client.domain.model.Project selectedProject = null;
    
    public final boolean component1() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.Project component10() {
        return null;
    }
    
    public final boolean component2() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component3() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.AgentStatus> component4() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.BotType component5() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component6() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.ui.screens.ChatMessage> component7() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.DebugResult component8() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.Project> component9() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.ui.screens.MainUiState copy(boolean isLoading, boolean isConnected, @org.jetbrains.annotations.Nullable()
    java.lang.String error, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.AgentStatus> agents, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.BotType currentLeader, @org.jetbrains.annotations.Nullable()
    java.lang.String currentSuggestion, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.ui.screens.ChatMessage> chatMessages, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.DebugResult debugResult, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.Project> projects, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.Project selectedProject) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
    
    public MainUiState(boolean isLoading, boolean isConnected, @org.jetbrains.annotations.Nullable()
    java.lang.String error, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.AgentStatus> agents, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.BotType currentLeader, @org.jetbrains.annotations.Nullable()
    java.lang.String currentSuggestion, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.ui.screens.ChatMessage> chatMessages, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.DebugResult debugResult, @org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.Project> projects, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.Project selectedProject) {
        super();
    }
    
    public final boolean isLoading() {
        return false;
    }
    
    public final boolean isConnected() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getError() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.AgentStatus> getAgents() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.BotType getCurrentLeader() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getCurrentSuggestion() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.ui.screens.ChatMessage> getChatMessages() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.DebugResult getDebugResult() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.Project> getProjects() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.Project getSelectedProject() {
        return null;
    }
    
    public MainUiState() {
        super();
    }
}