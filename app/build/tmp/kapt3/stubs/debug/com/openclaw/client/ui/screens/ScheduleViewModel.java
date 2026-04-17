package com.openclaw.client.ui.screens;

import androidx.lifecycle.ViewModel;
import com.openclaw.client.data.local.BotScheduler;
import com.openclaw.client.data.local.TimerEvent;
import com.openclaw.client.data.repository.OpenClawRepository;
import com.openclaw.client.domain.model.*;
import dagger.hilt.android.lifecycle.HiltViewModel;
import kotlinx.coroutines.flow.*;
import javax.inject.Inject;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000P\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0006\b\u0007\u0018\u00002\u00020\u0001B\u0017\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u000e\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u0011J\u0006\u0010\u0012\u001a\u00020\u000fJ\u0010\u0010\u0013\u001a\u00020\u000f2\u0006\u0010\u0014\u001a\u00020\u0015H\u0002J\u000e\u0010\u0016\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u0011J\u000e\u0010\u0017\u001a\u00020\u000f2\u0006\u0010\u0010\u001a\u00020\u0011J\u000e\u0010\u0018\u001a\u00020\u000f2\u0006\u0010\u0019\u001a\u00020\u001aJ\u0016\u0010\u001b\u001a\u00020\u000f2\u0006\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u001dJ\u000e\u0010\u001f\u001a\u00020\u000f2\u0006\u0010 \u001a\u00020\u0011J\u0006\u0010!\u001a\u00020\u000fJ\u0016\u0010\"\u001a\u00020\u000f2\u0006\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u001dR\u0014\u0010\u0007\u001a\b\u0012\u0004\u0012\u00020\t0\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\n\u001a\b\u0012\u0004\u0012\u00020\t0\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\r\u00a8\u0006#"}, d2 = {"Lcom/openclaw/client/ui/screens/ScheduleViewModel;", "Landroidx/lifecycle/ViewModel;", "scheduler", "Lcom/openclaw/client/data/local/BotScheduler;", "repository", "Lcom/openclaw/client/data/repository/OpenClawRepository;", "(Lcom/openclaw/client/data/local/BotScheduler;Lcom/openclaw/client/data/repository/OpenClawRepository;)V", "_uiState", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/openclaw/client/ui/screens/ScheduleUiState;", "uiState", "Lkotlinx/coroutines/flow/StateFlow;", "getUiState", "()Lkotlinx/coroutines/flow/StateFlow;", "cancelSchedule", "", "scheduleId", "", "clearError", "handleTimerEvent", "event", "Lcom/openclaw/client/data/local/TimerEvent;", "pauseSchedule", "resumeSchedule", "setBotType", "botType", "Lcom/openclaw/client/domain/model/BotType;", "setDuration", "hours", "", "minutes", "setTask", "task", "startSchedule", "startWithDelay", "app_debug"})
@dagger.hilt.android.lifecycle.HiltViewModel()
public final class ScheduleViewModel extends androidx.lifecycle.ViewModel {
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.data.local.BotScheduler scheduler = null;
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.data.repository.OpenClawRepository repository = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.MutableStateFlow<com.openclaw.client.ui.screens.ScheduleUiState> _uiState = null;
    @org.jetbrains.annotations.NotNull()
    private final kotlinx.coroutines.flow.StateFlow<com.openclaw.client.ui.screens.ScheduleUiState> uiState = null;
    
    @javax.inject.Inject()
    public ScheduleViewModel(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.local.BotScheduler scheduler, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.repository.OpenClawRepository repository) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final kotlinx.coroutines.flow.StateFlow<com.openclaw.client.ui.screens.ScheduleUiState> getUiState() {
        return null;
    }
    
    public final void setTask(@org.jetbrains.annotations.NotNull()
    java.lang.String task) {
    }
    
    public final void setBotType(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.BotType botType) {
    }
    
    public final void setDuration(int hours, int minutes) {
    }
    
    public final void startSchedule() {
    }
    
    public final void startWithDelay(int hours, int minutes) {
    }
    
    public final void cancelSchedule(@org.jetbrains.annotations.NotNull()
    java.lang.String scheduleId) {
    }
    
    public final void pauseSchedule(@org.jetbrains.annotations.NotNull()
    java.lang.String scheduleId) {
    }
    
    public final void resumeSchedule(@org.jetbrains.annotations.NotNull()
    java.lang.String scheduleId) {
    }
    
    public final void clearError() {
    }
    
    private final void handleTimerEvent(com.openclaw.client.data.local.TimerEvent event) {
    }
}