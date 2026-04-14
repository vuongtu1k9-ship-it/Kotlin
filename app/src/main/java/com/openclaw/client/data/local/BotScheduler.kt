package com.openclaw.client.data.local

import com.openclaw.client.domain.model.*
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BotScheduler @Inject constructor() {
    private val scope = CoroutineScope(Dispatchers.Default + SupervisorJob())
    private val _schedules = MutableStateFlow<List<Schedule>>(emptyList())
    val schedules: StateFlow<List<Schedule>> = _schedules.asStateFlow()
    
    private val _timerStates = MutableStateFlow<Map<String, TimerState>>(emptyMap())
    val timerStates: StateFlow<Map<String, TimerState>> = _timerStates.asStateFlow()
    
    private val _activeTimers = MutableSharedFlow<TimerEvent>()
    val activeTimers: SharedFlow<TimerEvent> = _activeTimers.asSharedFlow()
    
    private val jobs = mutableMapOf<String, Job>()
    
    fun createSchedule(
        task: String,
        durationMinutes: Int,
        botType: BotType,
        startNow: Boolean = true,
        startAt: Long? = null
    ): Schedule {
        val id = java.util.UUID.randomUUID().toString()
        val startTime = if (startNow) System.currentTimeMillis() else (startAt ?: System.currentTimeMillis())
        val endTime = startTime + (durationMinutes * 60 * 1000L)
        
        val schedule = Schedule(
            id = id,
            task = task,
            durationMinutes = durationMinutes,
            startTime = startTime,
            endTime = endTime,
            status = if (startNow) ScheduleStatus.RUNNING else ScheduleStatus.PENDING,
            assignedTo = botType,
            createdAt = System.currentTimeMillis()
        )
        
        _schedules.update { it + schedule }
        
        if (startNow) {
            startTimer(schedule, botType)
        }
        
        return schedule
    }
    
    fun createScheduleFromHours(task: String, durationHours: Int, botType: BotType): Schedule {
        return createSchedule(task, durationHours * 60, botType, startNow = true)
    }
    
    fun createScheduleWithDelay(task: String, durationMinutes: Int, botType: BotType, delayMinutes: Int): Schedule {
        val delayMillis = delayMinutes * 60 * 1000L
        val startAt = System.currentTimeMillis() + delayMillis
        return createSchedule(task, durationMinutes, botType, startNow = false, startAt = startAt)
    }
    
    fun cancelSchedule(scheduleId: String) {
        jobs[scheduleId]?.cancel()
        jobs.remove(scheduleId)
        
        _schedules.update { schedules ->
            schedules.map { schedule ->
                if (schedule.id == scheduleId) {
                    schedule.copy(status = ScheduleStatus.CANCELLED)
                } else schedule
            }
        }
        
        _timerStates.update { it - scheduleId }
    }
    
    fun pauseSchedule(scheduleId: String) {
        jobs[scheduleId]?.cancel()
        
        _schedules.update { schedules ->
            schedules.map { schedule ->
                if (schedule.id == scheduleId) {
                    schedule.copy(status = ScheduleStatus.PAUSED)
                } else schedule
            }
        }
        
        _timerStates.update { states ->
            states[scheduleId]?.let { state ->
                states + (scheduleId to state.copy(isRunning = false, isPaused = true))
            } ?: states
        }
    }
    
    fun resumeSchedule(scheduleId: String) {
        val schedule = _schedules.value.find { it.id == scheduleId } ?: return
        if (schedule.status != ScheduleStatus.PAUSED) return
        
        val timerState = _timerStates.value[scheduleId] ?: return
        if (timerState.remainingSeconds <= 0) return
        
        _schedules.update { schedules ->
            schedules.map { s ->
                if (s.id == scheduleId) {
                    s.copy(status = ScheduleStatus.RUNNING)
                } else s
            }
        }
        
        startCountdown(scheduleId, timerState.remainingSeconds, schedule.durationMinutes * 60L, schedule.assignedTo)
    }
    
    private fun startTimer(schedule: Schedule, botType: BotType) {
        val totalSeconds = schedule.durationMinutes * 60L
        
        _timerStates.update { it + (schedule.id to TimerState(
            scheduleId = schedule.id,
            remainingSeconds = totalSeconds,
            totalSeconds = totalSeconds,
            isRunning = true,
            isPaused = false
        ))}
        
        scope.launch {
            _activeTimers.emit(TimerEvent.Started(schedule.id, botType, totalSeconds))
        }
        
        startCountdown(schedule.id, totalSeconds, totalSeconds, botType)
    }
    
    private fun startCountdown(scheduleId: String, remaining: Long, total: Long, botType: BotType?) {
        jobs[scheduleId]?.cancel()
        
        jobs[scheduleId] = scope.launch {
            var seconds = remaining
            
            while (seconds > 0 && isActive) {
                _timerStates.update { states ->
                    states[scheduleId]?.let { state ->
                        states + (scheduleId to state.copy(remainingSeconds = seconds))
                    } ?: states
                }
                
                _activeTimers.emit(TimerEvent.Tick(scheduleId, seconds))
                
                delay(1000)
                seconds--
            }
            
            if (isActive) {
                _timerStates.update { states ->
                    states[scheduleId]?.let { state ->
                        states + (scheduleId to state.copy(
                            remainingSeconds = 0,
                            isRunning = false,
                            isPaused = false
                        ))
                    } ?: states
                }
                
                _schedules.update { schedules ->
                    schedules.map { s ->
                        if (s.id == scheduleId) {
                            s.copy(status = ScheduleStatus.COMPLETED)
                        } else s
                    }
                }
                
                botType?.let {
                    _activeTimers.emit(TimerEvent.Completed(scheduleId, it))
                }
            }
        }
    }
    
    fun getActiveSchedule(): Schedule? {
        return _schedules.value.find { it.status == ScheduleStatus.RUNNING }
    }
    
    fun getTimerState(scheduleId: String): TimerState? {
        return _timerStates.value[scheduleId]
    }
    
    fun listSchedules(): List<Schedule> = _schedules.value
    
    fun clearCompleted() {
        _schedules.update { schedules ->
            schedules.filter { it.status != ScheduleStatus.COMPLETED && it.status != ScheduleStatus.CANCELLED }
        }
    }
    
    fun shutdown() {
        scope.cancel()
    }
}

sealed class TimerEvent {
    data class Started(val scheduleId: String, val botType: BotType, val totalSeconds: Long) : TimerEvent()
    data class Tick(val scheduleId: String, val remainingSeconds: Long) : TimerEvent()
    data class Completed(val scheduleId: String, val botType: BotType) : TimerEvent()
    data class Cancelled(val scheduleId: String) : TimerEvent()
}