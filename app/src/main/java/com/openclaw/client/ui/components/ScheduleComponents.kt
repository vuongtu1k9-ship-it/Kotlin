package com.openclaw.client.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.openclaw.client.domain.model.*
import com.openclaw.client.ui.screens.ScheduleViewModel
import com.openclaw.client.ui.theme.*

@Composable
fun ScheduleTab(
    viewModel: ScheduleViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        // Active Timer Display
        if (uiState.isTimerActive && uiState.currentTimer != null) {
            ActiveTimerCard(
                timerState = uiState.currentTimer!!,
                schedule = uiState.schedules.find { it.id == uiState.currentTimer?.scheduleId },
                onPause = { viewModel.pauseSchedule(uiState.currentTimer!!.scheduleId) },
                onCancel = { viewModel.cancelSchedule(uiState.currentTimer!!.scheduleId) },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))
        }
        
        // New Schedule Form
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Schedule New Task",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                // Task Input
                OutlinedTextField(
                    value = uiState.taskInput,
                    onValueChange = { viewModel.setTask(it) },
                    label = { Text("Task Description") },
                    placeholder = { Text("e.g., Write login screen UI") },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isTimerActive
                )
                
                // Bot Selection
                Text("Select Bot", style = MaterialTheme.typography.labelMedium)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    BotType.entries.forEach { botType ->
                        BotSelectionChip(
                            botType = botType,
                            isSelected = uiState.selectedBot == botType,
                            onClick = { viewModel.setBotType(botType) },
                            enabled = !uiState.isTimerActive
                        )
                    }
                }
                
                // Duration Picker
                Text("Duration", style = MaterialTheme.typography.labelMedium)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    DurationPicker(
                        label = "Hours",
                        value = uiState.hours,
                        onValueChange = { viewModel.setDuration(it, uiState.minutes) },
                        range = 0..23,
                        enabled = !uiState.isTimerActive
                    )
                    Text(":", style = MaterialTheme.typography.titleLarge)
                    DurationPicker(
                        label = "Minutes",
                        value = uiState.minutes,
                        onValueChange = { viewModel.setDuration(uiState.hours, it) },
                        range = 0..59,
                        enabled = !uiState.isTimerActive
                    )
                }
                
                // Start Button
                Button(
                    onClick = { viewModel.startSchedule() },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !uiState.isLoading && !uiState.isTimerActive,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = when (uiState.selectedBot) {
                            BotType.CODER -> AgentAColor
                            BotType.REVIEWER -> AgentBColor
                            BotType.OPTIMIZER -> AgentCColor
                        }
                    )
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color.White,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Default.PlayArrow, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Start Bot (${uiState.hours}h ${uiState.minutes}m)")
                    }
                }
            }
        }
        
        Spacer(Modifier.height(16.dp))
        
        // Schedule History
        Text(
            "Schedule History",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        
        if (uiState.schedules.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "No schedules yet",
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(uiState.schedules) { schedule ->
                    ScheduleCard(
                        schedule = schedule,
                        timerState = uiState.timerStates[schedule.id],
                        onCancel = { viewModel.cancelSchedule(schedule.id) },
                        onPause = { viewModel.pauseSchedule(schedule.id) },
                        onResume = { viewModel.resumeSchedule(schedule.id) }
                    )
                }
            }
        }
        
        // Error snackbar
        uiState.error?.let { error ->
            Snackbar(
                modifier = Modifier.padding(16.dp),
                action = {
                    TextButton(onClick = { viewModel.clearError() }) {
                        Text("Dismiss")
                    }
                }
            ) {
                Text(error)
            }
        }
    }
}

@Composable
fun ActiveTimerCard(
    timerState: TimerState,
    schedule: Schedule?,
    onPause: () -> Unit,
    onCancel: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "alpha"
    )
    
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = when (schedule?.assignedTo) {
                BotType.CODER -> AgentAColor.copy(alpha = 0.2f)
                BotType.REVIEWER -> AgentBColor.copy(alpha = 0.2f)
                BotType.OPTIMIZER -> AgentCColor.copy(alpha = 0.2f)
                null -> MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(SuccessColor.copy(alpha = alpha))
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    "⚡ ${schedule?.assignedTo?.name ?: "Bot"} Working",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(Modifier.height(16.dp))
            
            // Timer Display
            Text(
                timerState.formatTime(),
                style = MaterialTheme.typography.displayLarge.copy(
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    fontSize = 48.sp
                ),
                fontWeight = FontWeight.Bold
            )
            
            Spacer(Modifier.height(8.dp))
            
            // Progress Bar
            LinearProgressIndicator(
                progress = { timerState.progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(MaterialTheme.shapes.small),
                color = SuccessColor,
                trackColor = MaterialTheme.colorScheme.surface
            )
            
            Spacer(Modifier.height(8.dp))
            
            Text(
                schedule?.task ?: "",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
            
            Spacer(Modifier.height(16.dp))
            
            // Control Buttons
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onPause,
                    enabled = timerState.isRunning
                ) {
                    Icon(Icons.Default.Pause, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Pause")
                }
                OutlinedButton(
                    onClick = onCancel,
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = ErrorColor
                    )
                ) {
                    Icon(Icons.Default.Stop, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Stop")
                }
            }
        }
    }
}

@Composable
fun BotSelectionChip(
    botType: BotType,
    isSelected: Boolean,
    onClick: () -> Unit,
    enabled: Boolean
) {
    val color = when (botType) {
        BotType.CODER -> AgentAColor
        BotType.REVIEWER -> AgentBColor
        BotType.OPTIMIZER -> AgentCColor
    }
    
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        enabled = enabled,
        label = { Text(botType.name) },
        leadingIcon = if (isSelected) {
            {
                Icon(
                    Icons.Default.Check,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
            }
        } else null,
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = color.copy(alpha = 0.3f),
            selectedLabelColor = color
        )
    )
}

@Composable
fun DurationPicker(
    label: String,
    value: Int,
    onValueChange: (Int) -> Unit,
    range: IntRange,
    enabled: Boolean
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        IconButton(
            onClick = { if (value < range.last) onValueChange(value + 1) },
            enabled = enabled && value < range.last
        ) {
            Icon(Icons.Default.KeyboardArrowUp, contentDescription = "Increase")
        }
        
        OutlinedTextField(
            value = String.format("%02d", value),
            onValueChange = { newValue ->
                newValue.toIntOrNull()?.let { intValue ->
                    if (intValue in range) onValueChange(intValue)
                }
            },
            modifier = Modifier.width(60.dp),
            enabled = enabled,
            textStyle = MaterialTheme.typography.titleLarge.copy(
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
            )
        )
        
        IconButton(
            onClick = { if (value > range.first) onValueChange(value - 1) },
            enabled = enabled && value > range.first
        ) {
            Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Decrease")
        }
    }
}

@Composable
fun ScheduleCard(
    schedule: Schedule,
    timerState: TimerState?,
    onCancel: () -> Unit,
    onPause: () -> Unit,
    onResume: () -> Unit
) {
    val color = when (schedule.assignedTo) {
        BotType.CODER -> AgentAColor
        BotType.REVIEWER -> AgentBColor
        BotType.OPTIMIZER -> AgentCColor
        null -> MaterialTheme.colorScheme.primary
    }
    
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .padding(12.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(
                        when (schedule.status) {
                            ScheduleStatus.RUNNING -> SuccessColor
                            ScheduleStatus.PAUSED -> WarningColor
                            ScheduleStatus.COMPLETED -> InfoColor
                            ScheduleStatus.CANCELLED -> ErrorColor
                            else -> Color.Gray
                        }
                    )
            )
            
            Spacer(Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    schedule.task,
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    "${schedule.assignedTo?.name ?: "Bot"} • ${schedule.durationMinutes / 60}h ${schedule.durationMinutes % 60}m",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                timerState?.let {
                    Text(
                        "Remaining: ${it.formatTime()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = color
                    )
                }
            }
            
            when (schedule.status) {
                ScheduleStatus.RUNNING -> {
                    IconButton(onClick = onPause) {
                        Icon(Icons.Default.Pause, contentDescription = "Pause")
                    }
                    IconButton(onClick = onCancel) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Cancel",
                            tint = ErrorColor
                        )
                    }
                }
                ScheduleStatus.PAUSED -> {
                    IconButton(onClick = onResume) {
                        Icon(Icons.Default.PlayArrow, contentDescription = "Resume")
                    }
                    IconButton(onClick = onCancel) {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "Cancel",
                            tint = ErrorColor
                        )
                    }
                }
                else -> {}
            }
        }
    }
}