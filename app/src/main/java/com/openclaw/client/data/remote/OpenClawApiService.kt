package com.openclaw.client.data.remote

import com.openclaw.client.domain.model.*
import retrofit2.Response
import retrofit2.http.*

interface OpenClawApiService {
    @GET("health")
    suspend fun healthCheck(): Response<HealthResponse>

    @POST("api/ai/suggest")
    suspend fun getSuggestion(@Body request: SuggestRequest): Response<SuggestResponse>

    @POST("api/ai/debug")
    suspend fun debugCode(@Body request: DebugRequest): Response<DebugResponse>

    @POST("api/ai/refactor")
    suspend fun refactorCode(@Body request: RefactorRequest): Response<RefactorResponse>

    @POST("api/ai/architecture")
    suspend fun generateArchitecture(@Body request: ArchitectureRequest): Response<ArchitectureResponse>

    @POST("api/ai/test")
    suspend fun generateTests(@Body request: TestRequest): Response<TestResponse>

    @POST("api/ai/review")
    suspend fun reviewCode(@Body request: ReviewRequest): Response<ReviewResponse>

    @GET("api/projects")
    suspend fun getProjects(): Response<List<ProjectDto>>

    @POST("api/projects")
    suspend fun createProject(@Body request: CreateProjectRequest): Response<ProjectDto>

    @GET("api/projects/{id}")
    suspend fun getProject(@Path("id") id: String): Response<ProjectDto>

    @DELETE("api/projects/{id}")
    suspend fun deleteProject(@Path("id") id: String): Response<Unit>

    @POST("api/projects/{id}/agents")
    suspend fun updateAgents(
        @Path("id") id: String,
        @Body request: AgentPolicyRequest
    ): Response<AgentPolicyResponse>
}

data class HealthResponse(val status: String, val timestamp: Long)
data class SuggestRequest(val code: String, val cursor: Int, val context: String)
data class SuggestResponse(val suggestion: String, val confidence: Float)
data class DebugRequest(val code: String, val logcat: String?, val stacktrace: String?)
data class DebugResponse(val bug: String?, val line: Int?, val fix: String?, val patch: String?)
data class RefactorRequest(val code: String, val targetArchitecture: String)
data class RefactorResponse(val code: String, val changes: List<String>)
data class ArchitectureRequest(val appName: String, val features: List<String>)
data class ArchitectureResponse(val structure: Map<String, List<String>>, val files: List<String>)
data class TestRequest(val code: String, val framework: String)
data class TestResponse(val tests: List<String>, val coverage: Float)
data class ReviewRequest(val code: String)
data class ReviewResponse(val issues: List<CodeIssue>, val score: Int)
data class ProjectDto(val id: String, val name: String, val files: List<String>, val lastModified: Long)
data class CreateProjectRequest(val name: String, val description: String?)
data class AgentPolicyRequest(val coder: Boolean, val reviewer: Boolean, val optimizer: Boolean)
data class AgentPolicyResponse(val success: Boolean, val leader: String)
data class CodeIssue(val severity: String, val message: String, val line: Int?)