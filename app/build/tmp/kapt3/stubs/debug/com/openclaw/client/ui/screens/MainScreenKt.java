package com.openclaw.client.ui.screens;

import androidx.compose.foundation.layout.*;
import androidx.compose.material.icons.Icons;
import androidx.compose.material.icons.filled.*;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.TextStyle;
import androidx.hilt.navigation.compose.hiltViewModel;
import com.openclaw.client.domain.model.*;
import com.openclaw.client.ui.theme.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000j\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010 \n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\u001a0\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0007\u00f8\u0001\u0000\u00a2\u0006\u0004\b\b\u0010\t\u001a\u0010\u0010\n\u001a\u00020\u00012\u0006\u0010\u000b\u001a\u00020\fH\u0007\u001a \u0010\r\u001a\u00020\u00012\f\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\f0\u000f2\b\b\u0002\u0010\u0010\u001a\u00020\u0011H\u0007\u001a\u0010\u0010\u0012\u001a\u00020\u00012\u0006\u0010\u0013\u001a\u00020\u0014H\u0007\u001aH\u0010\u0015\u001a\u00020\u00012\f\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\u00140\u000f2\u0006\u0010\u0017\u001a\u00020\u00032\u0012\u0010\u0018\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00192\f\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\u0006\u0010\u001b\u001a\u00020\u001cH\u0007\u001aD\u0010\u001d\u001a\u00020\u00012\u0006\u0010\u001e\u001a\u00020\u00032\u0006\u0010\u001f\u001a\u00020\u00032\u0012\u0010 \u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00192\b\u0010!\u001a\u0004\u0018\u00010\"2\f\u0010#\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0007\u001aB\u0010$\u001a\u00020\u00012\u0006\u0010\u001e\u001a\u00020\u00032\u0012\u0010%\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u00192\b\u0010&\u001a\u0004\u0018\u00010\u00032\u0012\u0010\'\u001a\u000e\u0012\u0004\u0012\u00020\u0003\u0012\u0004\u0012\u00020\u00010\u0019H\u0007\u001a\u0012\u0010(\u001a\u00020\u00012\b\b\u0002\u0010)\u001a\u00020*H\u0007\u001a\u001e\u0010+\u001a\u00020\u00012\u0006\u0010,\u001a\u00020-2\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0007\u001aF\u0010.\u001a\u00020\u00012\f\u0010/\u001a\b\u0012\u0004\u0012\u00020-0\u000f2\u001a\u00100\u001a\u0016\u0012\u0004\u0012\u00020\u0003\u0012\u0006\u0012\u0004\u0018\u00010\u0003\u0012\u0004\u0012\u00020\u0001012\u0012\u00102\u001a\u000e\u0012\u0004\u0012\u00020-\u0012\u0004\u0012\u00020\u00010\u0019H\u0007\u0082\u0002\u0007\n\u0005\b\u00a1\u001e0\u0001\u00a8\u00063"}, d2 = {"ActionButton", "", "text", "", "color", "Landroidx/compose/ui/graphics/Color;", "onClick", "Lkotlin/Function0;", "ActionButton-bw27NRU", "(Ljava/lang/String;JLkotlin/jvm/functions/Function0;)V", "AgentChip", "agent", "Lcom/openclaw/client/domain/model/AgentStatus;", "AgentStatusBar", "agents", "", "modifier", "Landroidx/compose/ui/Modifier;", "ChatBubble", "message", "Lcom/openclaw/client/ui/screens/ChatMessage;", "ChatTab", "messages", "input", "onInputChange", "Lkotlin/Function1;", "onSend", "isLoading", "", "DebugTab", "code", "logcat", "onLogcatChange", "debugResult", "Lcom/openclaw/client/domain/model/DebugResult;", "onDebug", "EditorTab", "onCodeChange", "suggestion", "onSendCode", "MainScreen", "viewModel", "Lcom/openclaw/client/ui/screens/MainViewModel;", "ProjectCard", "project", "Lcom/openclaw/client/domain/model/Project;", "ProjectsTab", "projects", "onCreateProject", "Lkotlin/Function2;", "onSelectProject", "app_debug"})
public final class MainScreenKt {
    
    @kotlin.OptIn(markerClass = {androidx.compose.material3.ExperimentalMaterial3Api.class})
    @androidx.compose.runtime.Composable()
    public static final void MainScreen(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.ui.screens.MainViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void AgentStatusBar(@org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.AgentStatus> agents, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void AgentChip(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.AgentStatus agent) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void EditorTab(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onCodeChange, @org.jetbrains.annotations.Nullable()
    java.lang.String suggestion, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onSendCode) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ChatTab(@org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.ui.screens.ChatMessage> messages, @org.jetbrains.annotations.NotNull()
    java.lang.String input, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onInputChange, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onSend, boolean isLoading) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ChatBubble(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.ui.screens.ChatMessage message) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void DebugTab(@org.jetbrains.annotations.NotNull()
    java.lang.String code, @org.jetbrains.annotations.NotNull()
    java.lang.String logcat, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.String, kotlin.Unit> onLogcatChange, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.DebugResult debugResult, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onDebug) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ProjectsTab(@org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.Project> projects, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function2<? super java.lang.String, ? super java.lang.String, kotlin.Unit> onCreateProject, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super com.openclaw.client.domain.model.Project, kotlin.Unit> onSelectProject) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ProjectCard(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.Project project, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onClick) {
    }
}