package com.openclaw.client.data.repository

import com.openclaw.client.data.remote.*
import com.openclaw.client.data.remote.WebSocketClient
import com.openclaw.client.domain.model.*
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OpenClawRepository @Inject constructor(
    private val apiService: OpenClawApiService,
    private val webSocketClient: WebSocketClient
) {
    val streamMessages: Flow<StreamMessage> = webSocketClient.messages

    suspend fun healthCheck(): Result<HealthResponse> {
        return try {
            val response = apiService.healthCheck()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Health check failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSuggestion(code: String, cursor: Int, context: String): Result<SuggestResponse> {
        return try {
            val response = apiService.getSuggestion(SuggestRequest(code, cursor, context))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Suggestion failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun debugCode(code: String, logcat: String?, stacktrace: String?): Result<DebugResponse> {
        return try {
            val response = apiService.debugCode(DebugRequest(code, logcat, stacktrace))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Debug failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refactorCode(code: String, targetArchitecture: String): Result<RefactorResponse> {
        return try {
            val response = apiService.refactorCode(RefactorRequest(code, targetArchitecture))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Refactor failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateArchitecture(appName: String, features: List<String>): Result<ArchitectureResponse> {
        return try {
            val response = apiService.generateArchitecture(ArchitectureRequest(appName, features))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Architecture generation failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateTests(code: String, framework: String = "junit"): Result<TestResponse> {
        return try {
            val response = apiService.generateTests(TestRequest(code, framework))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Test generation failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun reviewCode(code: String): Result<ReviewResponse> {
        return try {
            val response = apiService.reviewCode(ReviewRequest(code))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Review failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProjects(): Result<List<ProjectDto>> {
        return try {
            val response = apiService.getProjects()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Get projects failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createProject(name: String, description: String?): Result<ProjectDto> {
        return try {
            val response = apiService.createProject(CreateProjectRequest(name, description))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Create project failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun connectWebSocket(url: String) {
        webSocketClient.connect(url)
    }

    fun disconnectWebSocket() {
        webSocketClient.disconnect()
    }

    fun sendCodeUpdate(code: String, fileName: String) {
        webSocketClient.sendCodeUpdate(code, fileName)
    }

    fun requestSuggestion(cursor: Int, context: String) {
        webSocketClient.requestSuggestion(cursor, context)
    }
}