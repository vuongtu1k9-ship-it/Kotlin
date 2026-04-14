package com.openclaw.client.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.openclaw.client.data.local.BotScheduler
import com.openclaw.client.data.local.TimerEvent
import com.openclaw.client.data.repository.OpenClawRepository
import com.openclaw.client.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ScheduleUiState(
    val schedules: List<Schedule> = emptyList(),
    val timerStates: Map<String, TimerState> = emptyMap(),
    val selectedBot: BotType = BotType.CODER,
    val taskInput: String = "",
    val hours: Int = 5,
    val minutes: Int = 0,
    val isTimerActive: Boolean = false,
    val currentTimer: TimerState? = null,
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ScheduleViewModel @Inject constructor(
    private val scheduler: BotScheduler,
    private val repository: OpenClawRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ScheduleUiState())
    val uiState: StateFlow<ScheduleUiState> = _uiState.asStateFlow()
    
    init {
        viewModelScope.launch {
            scheduler.schedules.collect { schedules ->
                _uiState.update { it.copy(schedules = schedules) }
            }
        }
        
        viewModelScope.launch {
            scheduler.timerStates.collect { states ->
                _uiState.update { 
                    val active = states.values.find { it.isRunning }
                    it.copy(timerStates = states, currentTimer = active, isTimerActive = active?.isRunning == true)
                }
            }
        }
        
        viewModelScope.launch {
            scheduler.activeTimers.collect { event ->
                handleTimerEvent(event)
            }
        }
    }
    
    fun setTask(task: String) {
        _uiState.update { it.copy(taskInput = task) }
    }
    
    fun setBotType(botType: BotType) {
        _uiState.update { it.copy(selectedBot = botType) }
    }
    
    fun setDuration(hours: Int, minutes: Int) {
        _uiState.update { it.copy(hours = hours, minutes = minutes) }
    }
    
    fun startSchedule() {
        val state = _uiState.value
        if (state.taskInput.isBlank()) {
            _uiState.update { it.copy(error = "Please enter a task") }
            return
        }
        
        val totalMinutes = state.hours * 60 + state.minutes
        if (totalMinutes <= 0) {
            _uiState.update { it.copy(error = "Please set a duration") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            val schedule = scheduler.createScheduleFromHours(
                task = state.taskInput,
                durationHours = state.hours,
                botType = state.selectedBot
            )
            
            // Activate the bot
            repository.connectWebSocket("ws://YOUR_SERVER:3000")
            repository.sendCodeUpdate(state.taskInput, "schedule_${schedule.id}")
            
            _uiState.update { 
                it.copy(
                    isLoading = false,
                    taskInput = "",
                    hours = 5,
                    minutes = 0
                )
            }
        }
    }
    
    fun startWithDelay(hours: Int, minutes: Int) {
        val state = _uiState.value
        if (state.taskInput.isBlank()) {
            _uiState.update { it.copy(error = "Please enter a task") }
            return
        }
        
        val totalMinutes = state.hours * 60 + state.minutes
        if (totalMinutes <= 0) {
            _uiState.update { it.copy(error = "Please set a duration") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            scheduler.createScheduleWithDelay(
                task = state.taskInput,
                durationMinutes = totalMinutes,
                botType = state.selectedBot,
                delayMinutes = hours * 60 + minutes
            )
            
            _uiState.update { it.copy(isLoading = false) }
        }
    }
    
    fun cancelSchedule(scheduleId: String) {
        scheduler.cancelSchedule(scheduleId)
    }
    
    fun pauseSchedule(scheduleId: String) {
        scheduler.pauseSchedule(scheduleId)
    }
    
    fun resumeSchedule(scheduleId: String) {
        scheduler.resumeSchedule(scheduleId)
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    private fun handleTimerEvent(event: TimerEvent) {
        when (event) {
            is TimerEvent.Completed -> {
                viewModelScope.launch {
                    // Bot finished, disconnect
                    repository.disconnectWebSocket()
                }
            }
            is TimerEvent.Cancelled -> {
                repository.disconnectWebSocket()
            }
            else -> {}
        }
    }
}