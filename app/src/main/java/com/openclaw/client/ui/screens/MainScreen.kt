package com.openclaw.client.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.openclaw.client.domain.model.*
import com.openclaw.client.ui.components.ScheduleTab
import com.openclaw.client.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    var codeText by remember { mutableStateOf("") }
    var inputText by remember { mutableStateOf("") }
    var logcatInput by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("OpenClaw AI") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                ),
                actions = {
                    IconButton(onClick = { viewModel.connect() }) {
                        Icon(
                            if (uiState.isConnected) Icons.Default.CloudDone else Icons.Default.CloudOff,
                            contentDescription = "Connect"
                        )
                    }
                    IconButton(onClick = { viewModel.healthCheck() }) {
                        Icon(Icons.Default.BugReport, contentDescription = "Health")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            AgentStatusBar(
                agents = uiState.agents,
                modifier = Modifier.fillMaxWidth()
            )

            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Editor") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Chat") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Debug") }
                )
                Tab(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    text = { Text("Projects") }
                )
                Tab(
                    selected = selectedTab == 4,
                    onClick = { selectedTab = 4 },
                    text = { Text("Timer") }
                )
            }

            when (selectedTab) {
                0 -> EditorTab(
                    code = codeText,
                    onCodeChange = { codeText = it },
                    suggestion = uiState.currentSuggestion,
                    onSendCode = { viewModel.getSuggestion(it, 0, "") }
                )
                1 -> ChatTab(
                    messages = uiState.chatMessages,
                    input = inputText,
                    onInputChange = { inputText = it },
                    onSend = { viewModel.sendMessage(inputText) },
                    isLoading = uiState.isLoading
                )
                2 -> DebugTab(
                    code = codeText,
                    logcat = logcatInput,
                    onLogcatChange = { logcatInput = it },
                    debugResult = uiState.debugResult,
                    onDebug = { viewModel.debugCode(codeText, logcatInput, null) }
                )
                3 -> ProjectsTab(
                    projects = uiState.projects,
                    onCreateProject = { name, desc -> viewModel.createProject(name, desc) },
                    onSelectProject = { viewModel.selectProject(it) }
                )
                4 -> ScheduleTab()
            }
        }
    }
}

@Composable
fun AgentStatusBar(
    agents: List<AgentStatus>,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surface)
            .padding(8.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        agents.forEach { agent ->
            AgentChip(agent = agent)
        }
    }
}

@Composable
fun AgentChip(agent: AgentStatus) {
    val color = when (agent.type) {
        BotType.CODER -> AgentAColor
        BotType.REVIEWER -> AgentBColor
        BotType.OPTIMIZER -> AgentCColor
    }

    Surface(
        color = if (agent.isActive) color.copy(alpha = 0.3f) else Color.Gray.copy(alpha = 0.2f),
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.padding(4.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(
                        if (agent.isActive) SuccessColor else Color.Gray,
                        MaterialTheme.shapes.small
                    )
            )
            Spacer(Modifier.width(4.dp))
            Text(
                text = "${agent.type.name} ${if (agent.role == AgentRole.LEADER) "👑" else ""}",
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}

@Composable
fun EditorTab(
    code: String,
    onCodeChange: (String) -> Unit,
    suggestion: String?,
    onSendCode: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        BasicTextField(
            value = code,
            onValueChange = onCodeChange,
            textStyle = TextStyle(
                fontFamily = FontFamily.Monospace,
                fontSize = 14.sp,
                color = CodeEditorText
            ),
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(CodeEditorBackground)
                .padding(16.dp)
        )

        if (suggestion != null) {
            Surface(
                color = SuccessColor.copy(alpha = 0.1f),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)
            ) {
                Text(
                    text = suggestion,
                    style = MaterialTheme.typography.bodyMedium,
                    color = SuccessColor,
                    modifier = Modifier.padding(8.dp)
                )
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ActionButton("Suggest", AgentAColor) { onSendCode(code) }
            ActionButton("Refactor", AgentBColor) { }
            ActionButton("Review", AgentCColor) { }
        }
    }
}

@Composable
fun ActionButton(text: String, color: Color, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = color),
        modifier = Modifier.weight(1f)
    ) {
        Text(text)
    }
}

@Composable
fun ChatTab(
    messages: List<ChatMessage>,
    input: String,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    isLoading: Boolean
) {
    Column(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(messages) { message ->
                ChatBubble(message = message)
            }

            if (isLoading) {
                item {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(8.dp))
                        Text("AI is thinking...", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = input,
                onValueChange = onInputChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Type Kotlin code or command...") }
            )
            Spacer(Modifier.width(8.dp))
            IconButton(
                onClick = onSend,
                enabled = input.isNotBlank() && !isLoading
            ) {
                Icon(Icons.Default.Send, contentDescription = "Send")
            }
        }
    }
}

@Composable
fun ChatBubble(message: ChatMessage) {
    val isUser = message.isUser
    val backgroundColor = if (isUser) AgentAColor.copy(alpha = 0.2f) else AgentBColor.copy(alpha = 0.2f)
    val alignment = if (isUser) Alignment.End else Alignment.Start

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Surface(
            color = backgroundColor,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier
                .widthIn(max = 300.dp)
                .padding(4.dp)
        ) {
            Text(
                text = message.text,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(12.dp)
            )
        }
    }
}

data class ChatMessage(val text: String, val isUser: Boolean, val timestamp: Long = System.currentTimeMillis())

@Composable
fun DebugTab(
    code: String,
    logcat: String,
    onLogcatChange: (String) -> Unit,
    debugResult: DebugResult?,
    onDebug: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(8.dp)
    ) {
        OutlinedTextField(
            value = logcat,
            onValueChange = onLogcatChange,
            label = { Text("Logcat / Stacktrace") },
            modifier = Modifier
                .fillMaxWidth()
                .height(150.dp),
            textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 12.sp)
        )

        Spacer(Modifier.height(8.dp))

        Button(
            onClick = onDebug,
            colors = ButtonDefaults.buttonColors(containerColor = ErrorColor),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.BugReport, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Analyze Bug")
        }

        Spacer(Modifier.height(16.dp))

        if (debugResult != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (debugResult.bugType != null) ErrorColor.copy(alpha = 0.1f) else SuccessColor.copy(alpha = 0.1f)
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "Bug Analysis",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (debugResult.bugType != null) ErrorColor else SuccessColor
                    )
                    Spacer(Modifier.height(8.dp))
                    debugResult.bugType?.let {
                        Text("Type: $it", style = MaterialTheme.typography.bodyMedium)
                    }
                    debugResult.line?.let {
                        Text("Line: $it", style = MaterialTheme.typography.bodyMedium)
                    }
                    debugResult.description?.let {
                        Text("Description: $it", style = MaterialTheme.typography.bodyMedium)
                    }
                    debugResult.fix?.let {
                        Text("Fix: $it", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

@Composable
fun ProjectsTab(
    projects: List<Project>,
    onCreateProject: (String, String?) -> Unit,
    onSelectProject: (Project) -> Unit
) {
    var showDialog by remember { mutableStateOf(false) }
    var projectName by remember { mutableStateOf("") }
    var projectDesc by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.End
        ) {
            FloatingActionButton(
                onClick = { showDialog = true },
                containerColor = SuccessColor
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Project")
            }
        }

        if (projects.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text("No projects yet", style = MaterialTheme.typography.bodyLarge)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(projects) { project ->
                    ProjectCard(project = project, onClick = { onSelectProject(project) })
                }
            }
        }
    }

    if (showDialog) {
        AlertDialog(
            onDismissRequest = { showDialog = false },
            title = { Text("Create Project") },
            text = {
                Column {
                    OutlinedTextField(
                        value = projectName,
                        onValueChange = { projectName = it },
                        label = { Text("Project Name") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = projectDesc,
                        onValueChange = { projectDesc = it },
                        label = { Text("Description (optional)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        onCreateProject(projectName, projectDesc.ifBlank { null })
                        showDialog = false
                        projectName = ""
                        projectDesc = ""
                    }
                ) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ProjectCard(project: Project, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.Default.Folder,
                contentDescription = null,
                tint = AgentAColor,
                modifier = Modifier.size(40.dp)
            )
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(project.name, style = MaterialTheme.typography.titleMedium)
                Text(
                    "${project.files.size} files",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}