package com.openclaw.client.domain.model;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000<\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u0016\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\b\u0087\b\u0018\u00002\u00020\u0001BA\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0003\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0003\u0012\u0006\u0010\b\u001a\u00020\t\u0012\b\u0010\n\u001a\u0004\u0018\u00010\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u00a2\u0006\u0002\u0010\u000eJ\t\u0010\u001b\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u001c\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u001d\u001a\u00020\u0003H\u00c6\u0003J\u000b\u0010\u001e\u001a\u0004\u0018\u00010\u0003H\u00c6\u0003J\t\u0010\u001f\u001a\u00020\tH\u00c6\u0003J\u000b\u0010 \u001a\u0004\u0018\u00010\u000bH\u00c6\u0003J\t\u0010!\u001a\u00020\rH\u00c6\u0003JS\u0010\"\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00032\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00032\b\b\u0002\u0010\b\u001a\u00020\t2\n\b\u0002\u0010\n\u001a\u0004\u0018\u00010\u000b2\b\b\u0002\u0010\f\u001a\u00020\rH\u00c6\u0001J\u0013\u0010#\u001a\u00020$2\b\u0010%\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010&\u001a\u00020\'H\u00d6\u0001J\t\u0010(\u001a\u00020\u0003H\u00d6\u0001R\u0013\u0010\n\u001a\u0004\u0018\u00010\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\u0006\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0014R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0014R\u0011\u0010\b\u001a\u00020\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0017\u0010\u0018R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0019\u0010\u001a\u00a8\u0006)"}, d2 = {"Lcom/openclaw/client/domain/model/Task;", "", "id", "", "type", "Lcom/openclaw/client/domain/model/TaskType;", "input", "output", "status", "Lcom/openclaw/client/domain/model/TaskStatus;", "assignedTo", "Lcom/openclaw/client/domain/model/BotType;", "createdAt", "", "(Ljava/lang/String;Lcom/openclaw/client/domain/model/TaskType;Ljava/lang/String;Ljava/lang/String;Lcom/openclaw/client/domain/model/TaskStatus;Lcom/openclaw/client/domain/model/BotType;J)V", "getAssignedTo", "()Lcom/openclaw/client/domain/model/BotType;", "getCreatedAt", "()J", "getId", "()Ljava/lang/String;", "getInput", "getOutput", "getStatus", "()Lcom/openclaw/client/domain/model/TaskStatus;", "getType", "()Lcom/openclaw/client/domain/model/TaskType;", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "copy", "equals", "", "other", "hashCode", "", "toString", "app_debug"})
public final class Task {
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String id = null;
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.domain.model.TaskType type = null;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String input = null;
    @org.jetbrains.annotations.Nullable()
    private final java.lang.String output = null;
    @org.jetbrains.annotations.NotNull()
    private final com.openclaw.client.domain.model.TaskStatus status = null;
    @org.jetbrains.annotations.Nullable()
    private final com.openclaw.client.domain.model.BotType assignedTo = null;
    private final long createdAt = 0L;
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.TaskType component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.TaskStatus component5() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.BotType component6() {
        return null;
    }
    
    public final long component7() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.Task copy(@org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.TaskType type, @org.jetbrains.annotations.NotNull()
    java.lang.String input, @org.jetbrains.annotations.Nullable()
    java.lang.String output, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.TaskStatus status, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.BotType assignedTo, long createdAt) {
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
    
    public Task(@org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.TaskType type, @org.jetbrains.annotations.NotNull()
    java.lang.String input, @org.jetbrains.annotations.Nullable()
    java.lang.String output, @org.jetbrains.annotations.NotNull()
    com.openclaw.client.domain.model.TaskStatus status, @org.jetbrains.annotations.Nullable()
    com.openclaw.client.domain.model.BotType assignedTo, long createdAt) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getId() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.TaskType getType() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getInput() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getOutput() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final com.openclaw.client.domain.model.TaskStatus getStatus() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable()
    public final com.openclaw.client.domain.model.BotType getAssignedTo() {
        return null;
    }
    
    public final long getCreatedAt() {
        return 0L;
    }
}