package com.openclaw.client.data.local;

import com.openclaw.client.domain.model.*;
import kotlinx.coroutines.*;
import kotlinx.coroutines.flow.*;
import javax.inject.Inject;
import javax.inject.Singleton;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u001e\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\b7\u0018\u00002\u00020\u0001:\u0004\u0003\u0004\u0005\u0006B\u0007\b\u0004\u00a2\u0006\u0002\u0010\u0002\u0082\u0001\u0004\u0007\b\t\n\u00a8\u0006\u000b"}, d2 = {"Lcom/openclaw/client/data/local/TimerEvent;", "", "()V", "Cancelled", "Completed", "Started", "Tick", "Lcom/openclaw/client/data/local/TimerEvent$Cancelled;", "Lcom/openclaw/client/data/local/TimerEvent$Completed;", "Lcom/openclaw/client/data/local/TimerEvent$Started;", "Lcom/openclaw/client/data/local/TimerEvent$Tick;", "app_debug"})
public abstract class TimerEvent {
    
    private TimerEvent() {
        super();
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0006\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\t\u0010\u0007\u001a\u00020\u0003H\u00c6\u0003J\u0013\u0010\b\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u0003H\u00c6\u0001J\u0013\u0010\t\u001a\u00020\n2\b\u0010\u000b\u001a\u0004\u0018\u00010\fH\u00d6\u0003J\t\u0010\r\u001a\u00020\u000eH\u00d6\u0001J\t\u0010\u000f\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006\u00a8\u0006\u0010"}, d2 = {"Lcom/openclaw/client/data/local/TimerEvent$Cancelled;", "Lcom/openclaw/client/data/local/TimerEvent;", "scheduleId", "", "(Ljava/lang/String;)V", "getScheduleId", "()Ljava/lang/String;", "component1", "copy", "equals", "", "other", "", "hashCode", "", "toString", "app_debug"})
    public static final class Cancelled extends com.openclaw.client.data.local.TimerEvent {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String scheduleId = null;
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.data.local.TimerEvent.Cancelled copy(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId) {
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
        
        public Cancelled(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getScheduleId() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001B\u0015\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\t\u0010\u000b\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\f\u001a\u00020\u0005H\u00c6\u0003J\u001d\u0010\r\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u0005H\u00c6\u0001J\u0013\u0010\u000e\u001a\u00020\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u0011H\u00d6\u0003J\t\u0010\u0012\u001a\u00020\u0013H\u00d6\u0001J\t\u0010\u0014\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0007\u0010\bR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\n\u00a8\u0006\u0015"}, d2 = {"Lcom/openclaw/client/data/local/TimerEvent$Completed;", "Lcom/openclaw/client/data/local/TimerEvent;", "scheduleId", "", "botType", "Lcom/openclaw/client/domain/model/BotType;", "(Ljava/lang/String;Lcom/openclaw/client/domain/model/BotType;)V", "getBotType", "()Lcom/openclaw/client/domain/model/BotType;", "getScheduleId", "()Ljava/lang/String;", "component1", "component2", "copy", "equals", "", "other", "", "hashCode", "", "toString", "app_debug"})
    public static final class Completed extends com.openclaw.client.data.local.TimerEvent {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String scheduleId = null;
        @org.jetbrains.annotations.NotNull()
        private final com.openclaw.client.domain.model.BotType botType = null;
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.domain.model.BotType component2() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.data.local.TimerEvent.Completed copy(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, @org.jetbrains.annotations.NotNull()
        com.openclaw.client.domain.model.BotType botType) {
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
        
        public Completed(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, @org.jetbrains.annotations.NotNull()
        com.openclaw.client.domain.model.BotType botType) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getScheduleId() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.domain.model.BotType getBotType() {
            return null;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\f\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0007H\u00c6\u0003J\'\u0010\u0012\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0013\u001a\u00020\u00142\b\u0010\u0015\u001a\u0004\u0018\u00010\u0016H\u00d6\u0003J\t\u0010\u0017\u001a\u00020\u0018H\u00d6\u0001J\t\u0010\u0019\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000e\u00a8\u0006\u001a"}, d2 = {"Lcom/openclaw/client/data/local/TimerEvent$Started;", "Lcom/openclaw/client/data/local/TimerEvent;", "scheduleId", "", "botType", "Lcom/openclaw/client/domain/model/BotType;", "totalSeconds", "", "(Ljava/lang/String;Lcom/openclaw/client/domain/model/BotType;J)V", "getBotType", "()Lcom/openclaw/client/domain/model/BotType;", "getScheduleId", "()Ljava/lang/String;", "getTotalSeconds", "()J", "component1", "component2", "component3", "copy", "equals", "", "other", "", "hashCode", "", "toString", "app_debug"})
    public static final class Started extends com.openclaw.client.data.local.TimerEvent {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String scheduleId = null;
        @org.jetbrains.annotations.NotNull()
        private final com.openclaw.client.domain.model.BotType botType = null;
        private final long totalSeconds = 0L;
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.domain.model.BotType component2() {
            return null;
        }
        
        public final long component3() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.data.local.TimerEvent.Started copy(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, @org.jetbrains.annotations.NotNull()
        com.openclaw.client.domain.model.BotType botType, long totalSeconds) {
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
        
        public Started(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, @org.jetbrains.annotations.NotNull()
        com.openclaw.client.domain.model.BotType botType, long totalSeconds) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getScheduleId() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.domain.model.BotType getBotType() {
            return null;
        }
        
        public final long getTotalSeconds() {
            return 0L;
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0002\b\t\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001B\u0015\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\t\u0010\u000b\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\f\u001a\u00020\u0005H\u00c6\u0003J\u001d\u0010\r\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u0005H\u00c6\u0001J\u0013\u0010\u000e\u001a\u00020\u000f2\b\u0010\u0010\u001a\u0004\u0018\u00010\u0011H\u00d6\u0003J\t\u0010\u0012\u001a\u00020\u0013H\u00d6\u0001J\t\u0010\u0014\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0007\u0010\bR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\n\u00a8\u0006\u0015"}, d2 = {"Lcom/openclaw/client/data/local/TimerEvent$Tick;", "Lcom/openclaw/client/data/local/TimerEvent;", "scheduleId", "", "remainingSeconds", "", "(Ljava/lang/String;J)V", "getRemainingSeconds", "()J", "getScheduleId", "()Ljava/lang/String;", "component1", "component2", "copy", "equals", "", "other", "", "hashCode", "", "toString", "app_debug"})
    public static final class Tick extends com.openclaw.client.data.local.TimerEvent {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String scheduleId = null;
        private final long remainingSeconds = 0L;
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        public final long component2() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.openclaw.client.data.local.TimerEvent.Tick copy(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, long remainingSeconds) {
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
        
        public Tick(@org.jetbrains.annotations.NotNull()
        java.lang.String scheduleId, long remainingSeconds) {
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getScheduleId() {
            return null;
        }
        
        public final long getRemainingSeconds() {
            return 0L;
        }
    }
}