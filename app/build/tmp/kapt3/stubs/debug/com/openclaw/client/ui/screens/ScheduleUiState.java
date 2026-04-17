package com.openclaw.client.ui.screens;

import androidx.lifecycle.ViewModel;
import com.openclaw.client.data.local.BotScheduler;
import com.openclaw.client.data.local.TimerEvent;
import com.openclaw.client.data.repository.OpenClawRepository;
import com.openclaw.client.domain.model.*;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.*;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000:\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010$\n\u0002\u0010\u000e\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0002\b#\b\u0087\b\u0018\u00002\u00020\u0001B\u007f\u0012\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u0012\u0014\b\u0002\u0010\u0005\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\b0\u0006\u0012\b\b\u0002\u0010\t\u001a\u00020\n\u0012\b\b\u0002\u0010\u000b\u001a\u00020\u0007\u0012\b\b\u0002\u0010\f\u001a\u00020\r\u0012\b\b\u0002\u0010\u000e\u001a\u00020\r\u0012\b\b\u0002\u0010\u000f\u001a\u00020\u0010\u0012\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\b\u0012\b\b\u0002\u0010\u0012\u001a\u00020\u0010\u0012\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\u0002\u0010\u0014J\u000f\u0010$\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003H\u00c6\u0003J\u000b\u0010%\u001a\u0004\u0018\u00010\u0007H\u00c6\u0003J\u0015\u0010&\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\b0\u0006H\u00c6\u0003J\t\u0010\'\u001a\u00020\nH\u00c6\u0003J\t\u0010(\u001a\u00020\u0007H\u00c6\u0003J\t\u0010)\u001a\u00020\rH\u00c6\u0003J\t\u0010*\u001a\u00020\rH\u00c6\u0003J\t\u0010+\u001a\u00020\u0010H\u00c6\u0003J\u000b\u0010,\u001a\u0004\u0018\u00010\bH\u00c6\u0003J\t\u0010-\u001a\u00020\u0010H\u00c6\u0003J\u0083\u0001\u0010.\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\u0014\b\u0002\u0010\u0005\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\b0\u00062\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\u00072\b\b\u0002\u0010\f\u001a\u00020\r2\b\b\u0002\u0010\u000e\u001a\u00020\r2\b\b\u0002\u0010\u000f\u001a\u00020\u00102\n\b\u0002\u0010\u0011\u001a\u0004\u0018\u00010\b2\b\b\u0002\u0010\u0012\u001a\u00020\u00102\n\b\u0002\u0010\u0013\u001a\u0004\u0018\u00010\u0007H\u00c6\u0001J\u0013\u0010/\u001a\u00020\u00102\b\u00100\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u00101\u001a\u00020\rH\u00d6\u0001J\t\u00102\u001a\u00020\u0007H\u00d6\u0001R\u0013\u0010\u0011\u001a\u0004\u0018\u00010\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0013\u0010\u0013\u001a\u0004\u0018\u00010\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0018R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u001aR\u0011\u0010\u0012\u001a\u00020\u0010\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u001bR\u0011\u0010\u000f\u001a\u00020\u0010\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u001bR\u0011\u0010\u000e\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001aR\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001d\u0010\u001eR\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010 R\u0011\u0010\u000b\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b!\u0010\u0018R\u001d\u0010\u0005\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\b0\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\"\u0010#\u00a8\u00063"}, d2 = {"Lcom/openclaw/client/ui/screens/ScheduleUiState;", "", "schedules", "", "Lcom/openclaw/client/domain/model/Schedule;", "timerStates", "", "", "Lcom/openclaw/client/domain/model/TimerState;", "selectedBot", "Lcom/openclaw/client/domain/model/BotType;", "taskInput", "hours", "", "minutes", "isTimerActive", "", "currentTimer", "isLoading", "error", "(Ljava/util/List;Ljava/util/Map;Lcom/openclaw/client/domain/model/BotType;Ljava/lang/String;IIZLcom/openclaw/client/domain/model/TimerState;ZLjava/lang/String;)V", "getCurrentTimer", "()Lcom/openclaw/client/domain/model/TimerState;", "getError", "()Ljava/lang/String;", "getHours", "()I", "()Z", "getMinutes", "getSchedules", "()Ljava/util/List;", "getSelectedBot", "()Lcom/openclaw/client/domain/model/BotType;", "getTaskInput", "getTimerStates", "()Ljava/util/Map;", "component1", "component10", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "equals", "other", "hashCode", "toString", "app_debug"})
public final class ScheduleUiState {
    @org.jetbrains.annotations.NotNull()
    private final java.util.List<com.openclaw.client.domain.model.Schedule> schedules = null;
    @org.jetbrains.annotations.NotNull()
    private final java.util.Map<java.lang.String, com.openclaw.client.domain.model.TimerState> timerStates = null;
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.domain.model.BotType selectedBot = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String taskInput = null;
    private final int hours = 0;
    private final int minutes = 0;
    private final boolean isTimerActive = false;
    @org.jetbrains.annotations.Nullable()
    private final com.openclaw.client.domain.model.TimerState currentTimer = null;
    private final boolean isLoading = false;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String error = null;
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.Schedule> component1() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component10() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, com.openclaw.client.domain.model.TimerState> component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.BotType component3() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component4() {
        return null;
    }
    
    public final int component5() {
        return 0;
    }
    
    public final int component6() {
        return 0;
    }
    
    public final boolean component7() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.TimerState component8() {
        return null;
    }
    
    public final boolean component9() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.ui.screens.ScheduleUiState copy(@org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.Schedule> schedules, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, com.openclaw.client.domain.model.TimerState> timerStates, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.BotType selectedBot, @org.jetbrains.annotations.NotNull()
    java.lang.String taskInput, int hours, int minutes, boolean isTimerActive, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.TimerState currentTimer, boolean isLoading, @org.jetbrains.annotations.Nullable()
    java.lang.String error) {
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
    
    public ScheduleUiState(@org.jetbrains.annotations.NotNull()
    java.util.List<com.openclaw.client.domain.model.Schedule> schedules, @org.jetbrains.annotations.NotNull()
    java.util.Map<java.lang.String, com.openclaw.client.domain.model.TimerState> timerStates, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.BotType selectedBot, @org.jetbrains.annotations.NotNull()
    java.lang.String taskInput, int hours, int minutes, boolean isTimerActive, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.TimerState currentTimer, boolean isLoading, @org.jetbrains.annotations.Nullable()
    java.lang.String error) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<com.openclaw.client.domain.model.Schedule> getSchedules() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.util.Map<java.lang.String, com.openclaw.client.domain.model.TimerState> getTimerStates() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.BotType getSelectedBot() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getTaskInput() {
        return null;
    }
    
    public final int getHours() {
        return 0;
    }
    
    public final int getMinutes() {
        return 0;
    }
    
    public final boolean isTimerActive() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.TimerState getCurrentTimer() {
        return null;
    }
    
    public final boolean isLoading() {
        return false;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getError() {
        return null;
    }
    
    public ScheduleUiState() {
        super();
    }
}