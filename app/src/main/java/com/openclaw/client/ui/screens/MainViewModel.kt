package com.openclaw.client.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.xiangqi.client.BuildConfig
import com.openclaw.client.data.repository.OpenClawRepository
import com.openclaw.client.domain.model.*
import com.openclaw.client.data.remote.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val isLoading: Boolean = false,
    val isConnected: Boolean = false,
    val error: String? = null,
    val agents: List<AgentStatus> = listOf(
        AgentStatus(BotType.CODER, AgentRole.WORKER, false, null),
        AgentStatus(BotType.REVIEWER, AgentRole.WORKER, false, null),
        AgentStatus(BotType.OPTIMIZER, AgentRole.WORKER, false, null)
    ),
    val currentLeader: BotType? = null,
    val currentSuggestion: String? = null,
    val chatMessages: List<ChatMessage> = emptyList(),
    val debugResult: DebugResult? = null,
    val projects: List<Project> = emptyList(),
    val selectedProject: Project? = null
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: OpenClawRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private var requestCount = 0

    init {
        viewModelScope.launch {
            repository.streamMessages.collect { message ->
                handleStreamMessage(message)
            }
        }
    }

    fun connect() {
        viewModelScope.launch {
            try {
                repository.connectWebSocket(BuildConfig.WS_URL)
                _uiState.update { it.copy(isConnected = true) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isConnected = false) }
            }
        }
    }

    fun disconnect() {
        repository.disconnectWebSocket()
        _uiState.update { it.copy(isConnected = false) }
    }

    fun healthCheck() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.healthCheck()
                .onSuccess { response ->
                    _uiState.update { it.copy(isLoading = false) }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun getSuggestion(code: String, cursor: Int, context: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.getSuggestion(code, cursor, context)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            currentSuggestion = response.suggestion
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun debugCode(code: String, logcat: String?, stacktrace: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            selectLeader(BotType.REVIEWER)
            repository.debugCode(code, logcat, stacktrace)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            debugResult = DebugResult(
                                bugType = response.bug,
                                line = response.line,
                                description = response.fix,
                                fix = response.fix,
                                patch = response.patch
                            )
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun refactorCode(code: String, targetArchitecture: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            selectLeader(BotType.OPTIMIZER)
            repository.refactorCode(code, targetArchitecture)
                .onSuccess { }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun generateArchitecture(appName: String, features: List<String>) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            selectLeader(BotType.CODER)
            repository.generateArchitecture(appName, features)
                .onSuccess { }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun generateTests(code: String, framework: String = "junit") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            selectLeader(BotType.REVIEWER)
            repository.generateTests(code, framework)
                .onSuccess { }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun reviewCode(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            selectLeader(BotType.REVIEWER)
            repository.reviewCode(code)
                .onSuccess { }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun sendMessage(text: String) {
        _uiState.update {
            it.copy(chatMessages = it.chatMessages + ChatMessage(text, true))
        }

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }

            val response = when {
                text.contains("debug", ignoreCase = true) -> {
                    repository.debugCode("", text, null)
                }
                text.contains("test", ignoreCase = true) -> {
                    repository.generateTests(text)
                }
                text.contains("refactor", ignoreCase = true) -> {
                    repository.refactorCode("", "MVVM")
                }
                text.contains("architecture", ignoreCase = true) -> {
                    repository.generateArchitecture(text, emptyList())
                }
                text.contains("review", ignoreCase = true) -> {
                    repository.reviewCode(text)
                }
                else -> repository.getSuggestion(text, 0, "")
            }

            response
                .onSuccess { aiResponse ->
                    val responseText = when (aiResponse) {
                        is SuggestResponse -> aiResponse.suggestion
                        is DebugResponse -> aiResponse.fix ?: "No issues found"
                        is RefactorResponse -> aiResponse.code
                        is ArchitectureResponse -> aiResponse.files.joinToString("\n")
                        is TestResponse -> aiResponse.tests.joinToString("\n")
                        is ReviewResponse -> "Score: ${aiResponse.score}"
                        else -> "Done"
                    }
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            chatMessages = it.chatMessages + ChatMessage(responseText, false)
                        )
                    }
                }
                .onFailure { e ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            chatMessages = it.chatMessages + ChatMessage("Error: ${e.message}", false)
                        )
                    }
                }
        }
    }

    fun createProject(name: String, description: String?) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.createProject(name, description)
                .onSuccess { projectDto ->
                    _uiState.update { it.copy(isLoading = false) }
                    loadProjects()
                }
                .onFailure { e ->
                    _uiState.update { it.copy(isLoading = false, error = e.message) }
                }
        }
    }

    fun loadProjects() {
        viewModelScope.launch {
            repository.getProjects()
                .onSuccess { projects ->
                    _uiState.update {
                        it.copy(
                            projects = projects.map { dto ->
                                Project(
                                    id = dto.id,
                                    name = dto.name,
                                    description = null,
                                    files = emptyList(),
                                    agents = emptyList(),
                                    createdAt = dto.lastModified,
                                    lastModified = dto.lastModified
                                )
                            }
                        )
                    }
                }
        }
    }

    fun selectProject(project: Project) {
        _uiState.update { it.copy(selectedProject = project) }
        selectLeader(BotType.CODER)
    }

    private fun selectLeader(botType: BotType) {
        requestCount++
        val leaderIndex = requestCount % 3
        val leader = when (leaderIndex) {
            0 -> BotType.CODER
            1 -> BotType.REVIEWER
            else -> BotType.OPTIMIZER
        }

        _uiState.update { state ->
            state.copy(
                currentLeader = leader,
                agents = state.agents.map { agent ->
                    agent.copy(
                        role = if (agent.type == leader) AgentRole.LEADER else AgentRole.WORKER,
                        isActive = agent.type == leader || agent.type == botType
                    )
                }
            )
        }
    }

    private fun handleStreamMessage(message: StreamMessage) {
        when (message) {
            is StreamMessage.Suggestion -> {
                _uiState.update { it.copy(currentSuggestion = message.text) }
            }
            is StreamMessage.Debug -> {
                _uiState.update {
                    it.copy(chatMessages = it.chatMessages + ChatMessage(message.result, false))
                }
            }
            is StreamMessage.Error -> {
                _uiState.update { it.copy(error = message.message) }
            }
            is StreamMessage.Complete -> {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        chatMessages = it.chatMessages + ChatMessage(message.result, false)
                    )
                }
            }
            is StreamMessage.Progress -> {
                _uiState.update {
                    it.copy(
                        chatMessages = it.chatMessages + ChatMessage(message.message, false)
                    )
                }
            }
        }
    }
}