package com.openclaw.client.ui.components;

import androidx.compose.animation.core.*;
import androidx.compose.foundation.layout.*;
import androidx.compose.material.icons.Icons;
import androidx.compose.material.icons.filled.*;
import androidx.compose.material3.*;
import androidx.compose.runtime.*;
import androidx.compose.ui.Alignment;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.text.font.FontWeight;
import androidx.hilt.navigation.compose.hiltViewModel;
import com.openclaw.client.domain.model.*;
import com.openclaw.client.ui.screens.ScheduleViewModel;
import com.openclaw.client.ui.theme.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000R\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\u001a@\u0010\u0000\u001a\u00020\u00012\u0006\u0010\u0002\u001a\u00020\u00032\b\u0010\u0004\u001a\u0004\u0018\u00010\u00052\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\b\b\u0002\u0010\t\u001a\u00020\nH\u0007\u001a.\u0010\u000b\u001a\u00020\u00012\u0006\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000f2\f\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\u0006\u0010\u0011\u001a\u00020\u000fH\u0007\u001a<\u0010\u0012\u001a\u00020\u00012\u0006\u0010\u0013\u001a\u00020\u00142\u0006\u0010\u0015\u001a\u00020\u00162\u0012\u0010\u0017\u001a\u000e\u0012\u0004\u0012\u00020\u0016\u0012\u0004\u0012\u00020\u00010\u00182\u0006\u0010\u0019\u001a\u00020\u001a2\u0006\u0010\u0011\u001a\u00020\u000fH\u0007\u001aD\u0010\u001b\u001a\u00020\u00012\u0006\u0010\u0004\u001a\u00020\u00052\b\u0010\u0002\u001a\u0004\u0018\u00010\u00032\f\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00010\u00072\f\u0010\u001c\u001a\b\u0012\u0004\u0012\u00020\u00010\u0007H\u0007\u001a\u0012\u0010\u001d\u001a\u00020\u00012\b\b\u0002\u0010\u001e\u001a\u00020\u001fH\u0007\u00a8\u0006 "}, d2 = {"ActiveTimerCard", "", "timerState", "Lcom/openclaw/client/domain/model/TimerState;", "schedule", "Lcom/openclaw/client/domain/model/Schedule;", "onPause", "Lkotlin/Function0;", "onCancel", "modifier", "Landroidx/compose/ui/Modifier;", "BotSelectionChip", "botType", "Lcom/openclaw/client/domain/model/BotType;", "isSelected", "", "onClick", "enabled", "DurationPicker", "label", "", "value", "", "onValueChange", "Lkotlin/Function1;", "range", "Lkotlin/ranges/IntRange;", "ScheduleCard", "onResume", "ScheduleTab", "viewModel", "Lcom/openclaw/client/ui/screens/ScheduleViewModel;", "app_debug"})
public final class ScheduleComponentsKt {
    
    @androidx.compose.runtime.Composable()
    public static final void ScheduleTab(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.ui.screens.ScheduleViewModel viewModel) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ActiveTimerCard(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.TimerState timerState, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.Schedule schedule, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onPause, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onCancel, @org.jetbrains.annotations.NotNull()
    androidx.compose.ui.Modifier modifier) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void BotSelectionChip(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.BotType botType, boolean isSelected, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onClick, boolean enabled) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void DurationPicker(@org.jetbrains.annotations.NotNull()
    java.lang.String label, int value, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function1<? super java.lang.Integer, kotlin.Unit> onValueChange, @org.jetbrains.annotations.NotNull()
    kotlin.ranges.IntRange range, boolean enabled) {
    }
    
    @androidx.compose.runtime.Composable()
    public static final void ScheduleCard(@org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.Schedule schedule, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.TimerState timerState, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onCancel, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onPause, @org.jetbrains.annotations.NotNull()
    kotlin.jvm.functions.Function0<kotlin.Unit> onResume) {
    }
}