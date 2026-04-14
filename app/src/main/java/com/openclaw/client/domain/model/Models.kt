package com.openclaw.client.domain.model

sealed class StreamMessage {
    data class Suggestion(val text: String) : StreamMessage()
    data class Debug(val result: String) : StreamMessage()
    data class Error(val message: String) : StreamMessage()
    data class Complete(val result: String) : StreamMessage()
    data class Progress(val message: String) : StreamMessage()
}

enum class BotType {
    CODER,
    REVIEWER,
    OPTIMIZER
}

enum class AgentRole {
    LEADER,
    WORKER
}

data class AgentStatus(
    val type: BotType,
    val role: AgentRole,
    val isActive: Boolean,
    val lastTask: String?
)

data class Project(
    val id: String,
    val name: String,
    val description: String?,
    val files: List<KotlinFile>,
    val agents: List<AgentStatus>,
    val createdAt: Long,
    val lastModified: Long
)

data class KotlinFile(
    val name: String,
    val path: String,
    val content: String,
    val type: FileType
)

enum class FileType {
    ACTIVITY,
    FRAGMENT,
    VIEWMODEL,
    MODEL,
    REPOSITORY,
    USE_CASE,
    UTILITY,
    RESOURCE,
    OTHER
}

data class CodeContext(
    val currentFile: String?,
    val cursorPosition: Int,
    val surroundingCode: String,
    val imports: List<String>
)

data class Task(
    val id: String,
    val type: TaskType,
    val input: String,
    val output: String?,
    val status: TaskStatus,
    val assignedTo: BotType?,
    val createdAt: Long
)

enum class TaskType {
    SUGGEST,
    DEBUG,
    REFACTOR,
    ARCHITECTURE,
    TEST,
    REVIEW
}

enum class TaskStatus {
    PENDING,
    RUNNING,
    COMPLETED,
    FAILED
}

data class DebugResult(
    val bugType: String?,
    val line: Int?,
    val description: String?,
    val fix: String?,
    val patch: String?
)

data class ReviewResult(
    val issues: List<CodeIssue>,
    val score: Int,
    val suggestions: List<String>
)

data class CodeIssue(
    val severity: IssueSeverity,
    val message: String,
    val line: Int?,
    val suggestion: String?
)

enum class IssueSeverity {
    ERROR,
    WARNING,
    INFO
}