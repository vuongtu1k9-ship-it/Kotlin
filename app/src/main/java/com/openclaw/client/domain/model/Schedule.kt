package com.openclaw.client.domain.model

data class Schedule(
    val id: String,
    val task: String,
    val durationMinutes: Int,
    val startTime: Long,
    val endTime: Long?,
    val status: ScheduleStatus,
    val assignedTo: BotType?,
    val createdAt: Long
)

enum class ScheduleStatus {
    PENDING,
    RUNNING,
    PAUSED,
    COMPLETED,
    CANCELLED
}

data class TimerState(
    val scheduleId: String,
    val remainingSeconds: Long,
    val totalSeconds: Long,
    val isRunning: Boolean,
    val isPaused: Boolean
) {
    val progress: Float get() = if (totalSeconds > 0) remainingSeconds.toFloat() / totalSeconds else 0f
    
    fun formatTime(): String {
        val hours = remainingSeconds / 3600
        val minutes = (remainingSeconds % 3600) / 60
        val seconds = remainingSeconds % 60
        return if (hours > 0) String.format("%02d:%02d:%02d", hours, minutes, seconds)
        else String.format("%02d:%02d", minutes, seconds)
    }
}

data class ScheduleRequest(
    val task: String,
    val durationHours: Int,
    val startNow: Boolean = true,
    val startAt: Long? = null
)