package com.openclaw.client.data.remote;

import com.openclaw.client.domain.model.*;
import retrofit2.Response;
import retrofit2.http.*;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u008c\u0001\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\bf\u0018\u00002\u00020\u0001J\u001e\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u0006H\u00a7@\u00a2\u0006\u0002\u0010\u0007J\u001e\u0010\b\u001a\b\u0012\u0004\u0012\u00020\t0\u00032\b\b\u0001\u0010\u0005\u001a\u00020\nH\u00a7@\u00a2\u0006\u0002\u0010\u000bJ\u001e\u0010\f\u001a\b\u0012\u0004\u0012\u00020\r0\u00032\b\b\u0001\u0010\u000e\u001a\u00020\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0010J\u001e\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00120\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u0013H\u00a7@\u00a2\u0006\u0002\u0010\u0014J\u001e\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00160\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u0017H\u00a7@\u00a2\u0006\u0002\u0010\u0018J\u001e\u0010\u0019\u001a\b\u0012\u0004\u0012\u00020\u00040\u00032\b\b\u0001\u0010\u000e\u001a\u00020\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0010J\u001a\u0010\u001a\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020\u00040\u001b0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u001cJ\u001e\u0010\u001d\u001a\b\u0012\u0004\u0012\u00020\u001e0\u00032\b\b\u0001\u0010\u0005\u001a\u00020\u001fH\u00a7@\u00a2\u0006\u0002\u0010 J\u0014\u0010!\u001a\b\u0012\u0004\u0012\u00020\"0\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u001cJ\u001e\u0010#\u001a\b\u0012\u0004\u0012\u00020$0\u00032\b\b\u0001\u0010\u0005\u001a\u00020%H\u00a7@\u00a2\u0006\u0002\u0010&J\u001e\u0010\'\u001a\b\u0012\u0004\u0012\u00020(0\u00032\b\b\u0001\u0010\u0005\u001a\u00020)H\u00a7@\u00a2\u0006\u0002\u0010*J(\u0010+\u001a\b\u0012\u0004\u0012\u00020,0\u00032\b\b\u0001\u0010\u000e\u001a\u00020\u000f2\b\b\u0001\u0010\u0005\u001a\u00020-H\u00a7@\u00a2\u0006\u0002\u0010.\u00a8\u0006/"}, d2 = {"Lcom/openclaw/client/data/remote/OpenClawApiService;", "", "createProject", "Lretrofit2/Response;", "Lcom/openclaw/client/data/remote/ProjectDto;", "request", "Lcom/openclaw/client/data/remote/CreateProjectRequest;", "(Lcom/openclaw/client/data/remote/CreateProjectRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "debugCode", "Lcom/openclaw/client/data/remote/DebugResponse;", "Lcom/openclaw/client/data/remote/DebugRequest;", "(Lcom/openclaw/client/data/remote/DebugRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "deleteProject", "", "id", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "generateArchitecture", "Lcom/openclaw/client/data/remote/ArchitectureResponse;", "Lcom/openclaw/client/data/remote/ArchitectureRequest;", "(Lcom/openclaw/client/data/remote/ArchitectureRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "generateTests", "Lcom/openclaw/client/data/remote/TestResponse;", "Lcom/openclaw/client/data/remote/TestRequest;", "(Lcom/openclaw/client/data/remote/TestRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getProject", "getProjects", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getSuggestion", "Lcom/openclaw/client/data/remote/SuggestResponse;", "Lcom/openclaw/client/data/remote/SuggestRequest;", "(Lcom/openclaw/client/data/remote/SuggestRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "healthCheck", "Lcom/openclaw/client/data/remote/HealthResponse;", "refactorCode", "Lcom/openclaw/client/data/remote/RefactorResponse;", "Lcom/openclaw/client/data/remote/RefactorRequest;", "(Lcom/openclaw/client/data/remote/RefactorRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "reviewCode", "Lcom/openclaw/client/data/remote/ReviewResponse;", "Lcom/openclaw/client/data/remote/ReviewRequest;", "(Lcom/openclaw/client/data/remote/ReviewRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "updateAgents", "Lcom/openclaw/client/data/remote/AgentPolicyResponse;", "Lcom/openclaw/client/data/remote/AgentPolicyRequest;", "(Ljava/lang/String;Lcom/openclaw/client/data/remote/AgentPolicyRequest;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "app_debug"})
public abstract interface OpenClawApiService {
    
    @retrofit2.http.GET(value = "health")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object healthCheck(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.HealthResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/suggest")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getSuggestion(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.SuggestRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.SuggestResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/debug")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object debugCode(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.DebugRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.DebugResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/refactor")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object refactorCode(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.RefactorRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.RefactorResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/architecture")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object generateArchitecture(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.ArchitectureRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.ArchitectureResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/test")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object generateTests(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.TestRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.TestResponse>> $completion);
    
    @retrofit2.http.POST(value = "api/ai/review")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object reviewCode(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.ReviewRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.ReviewResponse>> $completion);
    
    @retrofit2.http.GET(value = "api/projects")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getProjects(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<java.util.List<com.openclaw.client.data.remote.ProjectDto>>> $completion);
    
    @retrofit2.http.POST(value = "api/projects")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object createProject(@retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.CreateProjectRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.ProjectDto>> $completion);
    
    @retrofit2.http.GET(value = "api/projects/{id}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object getProject(@retrofit2.http.Path(value = "id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.ProjectDto>> $completion);
    
    @retrofit2.http.DELETE(value = "api/projects/{id}")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object deleteProject(@retrofit2.http.Path(value = "id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String id, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<kotlin.Unit>> $completion);
    
    @retrofit2.http.POST(value = "api/projects/{id}/agents")
    @org.jetbrains.annotations.Nullable()
    public abstract java.lang.Object updateAgents(@retrofit2.http.Path(value = "id")
    @org.jetbrains.annotations.NotNull()
    java.lang.String id, @retrofit2.http.Body()
    @org.jetbrains.annotations.NotNull()
    com.openclaw.client.data.remote.AgentPolicyRequest request, @org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super retrofit2.Response<com.openclaw.client.data.remote.AgentPolicyResponse>> $completion);
}