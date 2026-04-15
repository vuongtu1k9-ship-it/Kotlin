# ARCHITECTURE.md - Kotlin Code Standards

## Quy tắc đặt tên

- **1 project = 1 tên riêng**
- **Lồng nhau tối đa 2 cấp**

## ViewModel + Handler + Logic

```kotlin
class GameViewModel {
  var state = GameState()
  fun handle(e: Event): State = when(e) { ... }
  fun onEvent(e: Event) { state = handle(e) }
}
```

---

# Operators

| # | Category | Operators |
|---|----------|-----------|
| 1 | DATA FLOW | `=`, `by`, `apply`, `also`, `let` |
| 2 | FUNCTION | `->`, `it`, `::`, `{ }` |
| 3 | NULL SAFETY | `?.`, `?:`, `!!` |
| 4 | TYPE SYSTEM | `:`, `as`, `as?`, `is` |
| 5 | LOOP/RANGE | `..`, `in`, `until`, `step`, `downTo` |
| 6 | META | `@`, `::class`, `vararg` |
| 7 | STRUCTURE | `<>`, `to`, `*`, `Pair`, `sealed` |
| 8 | CONTROL | `if`, `when`, `try-catch` |
| 9 | CHAINING | `.filter().map()`, `.let()`, `.also()` |
| 10 | PERFORMANCE | `lazy`, `remember`, `derivedState` |
| 11 | ICON+MENU | `ICON_*`, `MenuItem[]` |
| 12 | MVVM | `ViewModel`, `mutableStateOf`, `UiState` |
| 13 | FLAT COMPOSE | `StateHolder`, `1 State + N Component` |
| 14 | KTOR | `embeddedServer`, `routing`, `get`, `post` |
| 15 | UI TOOLKIT | `Column`, `Row`, `Box`, `LazyColumn` |

---

# 1. DATA FLOW

```kotlin
val name = "Kotlin"           // val gán
var count = 0                  // var gán
val heavy by lazy { loadData() }  // lazy
var text by remember { mutableStateOf("") }  // delegate
val user = User().apply { name = "Kotlin" }  // apply
val (a, b) = Pair(1, 2)       // destructuring
val list = emptyList<String>()  // typed
```

---

# 2. FUNCTION

```kotlin
{ x: Int -> x * x }            // lambda
list.map { it * 2 }           // it implicitly
list.sortedBy(String::length)   // method ref
fun String.greet() = "Hello $this"  // extension
fun String?.orEmpty() = this ?: ""  // nullable receiver
```

---

# 3. NULL SAFETY

```kotlin
user?.name          // safe call - null thì bỏ qua
user?.name ?: "G"   // fallback - null thì dùng "G"
user!!.id           // force - null thì crash
json?.data?.firstOrNull()  // chain
```

---

# 4. TYPE SYSTEM

```kotlin
val name: String = "Kotlin"      // explicit type
val str = v as? String ?: "def" // safe cast
if (x is String) x.length      // smart cast
when(x) { is Int -> x*2 }     // when + is
```

---

# 5. LOOP / RANGE

```kotlin
0..10             // 0 đến 10
0 until 10         // 0 đến 9
10 downTo 0 step 2 // 10,8,6,4,2,0
i in 0..10        // check in range
list.forEach { }    // iterate
```

---

# 6. META

```kotlin
@Composable fun B() { }    // annotation
@loop for (i in list) { break@loop }  // label
varargFunc(vararg s: String)  // vararg
val c = String::class    // reflection
```

---

# 7. STRUCTURE

```kotlin
class Box<T>(v: T)      // generic
"k" to "v"             // pair
arrayOf(*a, *b)         // spread
val (x,y) = Pair(1,2)   // destructure
sealed class Result { }  // sealed
```

---

# 8. CONTROL FLOW

```kotlin
val max = if(a>b) a else b       // if expression
when(x) { 1->"a"; else->"b" }   // when
try { } catch(e: Exception) { }  // try-catch
```

---

# UI Effects

```kotlin
animate().alpha(0f,1f).setDuration(300)
view.setOnTouchListener { _, e ->
    when(e.action) {
        MotionEvent.ACTION_DOWN -> scale(0.95f)
        MotionEvent.ACTION_UP -> scale(1f)
    }
}
remember { heavyComputation() }
```

---

# 9. CHAINING

```kotlin
// ✅ Chain operations - giảm lặp
list.filter { it.active }.map { it.name }.firstOrNull()

// ✅ Chain với null safety
user?.let { process(it) }
json?.data?.items?.firstOrNull() ?: emptyList()

// ✅ Chain with also/apply
User().also { it.name = "A" }.also { it.age = 10 }

// ✅ Custom chain
fun User.validate(): User = validate().save().notify()
```

---

# 10. PERFORMANCE

```kotlin
// ✅ Lazy initialization - chỉ tính khi cần
val heavyData by lazy { computeExpensive() }

// ✅ Remember - cache kết quả
val cached by remember(key) { compute() }

// ✅ Derived state - tránh recompute không cần
val isEven by remember(counter) { counter % 2 == 0 }

// ✅ Launch coroutine - non-blocking
viewModelScope.launch { api.getData() }
```

---

# Smart + Clear + Carefully

## ✅ Smart - gọn, ngắn

```kotlin
// Thay vì if-else dài
val name = when {
    user?.name -> user.name
    user?.nick -> user.nick
    else -> "Guest"
}
// ✅ Viết gọn
val name = user?.name ?: user?.nick ?: "Guest"
```

## ✅ Clear - rõ ràng

```kotlin
// ✅ Đặt tên có ý nghĩa
val activeUsers = users.filter { it.isActive }

// ✅ Extension rõ ràng
fun String.isEmail() = contains("@") && contains(".")

## ✅ Data class rõ ràng
data class UserDto(
    val id: Int,          // ID rõ ràng
    val displayName: String,  // Tên hiển thị
    val avatarUrl: String?   // Null = placeholder
)
```

## ✅ Carefully - cẩn thận với null

```kotlin
// ⚠️ Không chắc chắn → dùng ?:
// ✅ An toàn
val len = str?.length ?: 0

// ⚠️ Cẩn thận với force
val id = user!!.id  // Chỉ khi CHẮC CHẮN không null
```

---

# 11. ICON + MENU

## ✅ Icon dùng làm biến

```kotlin
// ✅ Icon = biến - tái sử dụng
val ICON_MENU = R.drawable.ic_menu
val ICON_PLAY = R.drawable.ic_play
val ICON_SETTINGS = R.drawable.ic_settings
val ICONS = arrayOf(ICON_MENU, ICON_PLAY, ICON_SETTINGS)

// ✅ Icon trong data class
data class MenuItem(
    val icon: Int,         // R.drawable.*
    val label: String,
    val action: () -> Unit
)
```

## ✅ Menu Array

```kotlin
// ✅ Menu array - dễ quản lý
val menuItems = arrayOf(
    MenuItem(ICON_PLAY, "Chơi") { startGame() },
    MenuItem(ICON_SETTINGS, "Cài đặt") { openSettings() },
    MenuItem(ICON_MENU, "Menu") { showMenu() }
)

// ✅ Render menu
menuItems.forEach { item ->
    Image(item.icon, contentDescription = item.label)
    Text(item.label)
}
```

---

# Common Snippets

```kotlin
// State
var counter by remember { mutableIntStateOf(0) }

// Collection
val active = items.filter { it.active }.map { it.name }

// Data class
data class User(val id: Int, val name: String)

// Coroutines
viewModelScope.launch { state = api.getData() }

// Compose UI
Column {
    Text("Hello")
    Button(onClick = {}) { Text("Click") }
}
```

---

# MVVM Simple

## Pattern

```
User → ViewModel → State → UI
```

## MVVM trong Compose

```kotlin
// 1. State - data class
data class UiState(
    val isLoading: Boolean = false,
    val data: List<Item = emptyList(),
    val error: String? = null
)

// 2. ViewModel
class MyViewModel : ViewModel() {
    var state by mutableStateOf(UiState())
    
    fun loadData() {
        state = state.copy(isLoading = true)
        // fetch...
        state = state.copy(isLoading = false, data = result)
    }
    
    fun selectItem(id: Int) {
        // xử lý
        state = state.copy(selectedId = id)
    }
}

// 3. UI - observe state
@Composable
fun MyScreen(vm: MyViewModel) {
    val s = vm.state
    
    if (s.isLoading) {
        LoadingView()
    } else {
        SuccessView(s.data)
    }
}
```

## ViewModel Pattern

```kotlin
class GameViewModel : ViewModel() {
    // State
    var uiState by mutableStateOf(UiState())
    
    // Actions
    fun onMove(from: Pos, to: Pos) {
        uiState = uiState.copy(board = move(uiState.board, from, to))
    }
    
    fun onUndo() {
        uiState = uiState.copy(board = uiState.history.last())
    }
}
```

---

# Flat Compose

## Concept

"1 State + 1 Logic + N Component reuse"

## 1. State (giảm lặp)

```kotlin
data class UiState(
    val loading: Boolean = false,
    val count: Int = 0
)
```

## 2. Logic (nhẹ - không ViewModel)

```kotlin
class StateHolder {
    var state by mutableStateOf(UiState())
        private set

    fun inc() {
        state = state.copy(count = state.count + 1)
    }
}
```

## 3. Component (tái sử dụng)

```kotlin
@Composable
fun Counter(
    count: Int,
    onClick: () -> Unit
) {
    Button(onClick = onClick) {
        Text("$count")
    }
}
```

## 4. Screen (3 dòng - gọn nhất)

```kotlin
@Composable
fun Screen(vm: StateHolder = StateHolder()) {
    Counter(
        count = vm.state.count,
        onClick = vm::inc
    )
}
```

## Flat vs MVVM

| Aspect | MVVM | Flat Compose |
|--------|-----|-------------|
| Class | ViewModel | StateHolder (nhẹ hơn) |
| Screen | Nhiều boilerplate | 3 dòng |
| Logic | Trong ViewModel | Trong StateHolder |

---

# UI Toolkit

## Column

```kotlin
Column(
    modifier = Modifier.fillMaxSize(),
    verticalArrangement = Arrangement.Center,
    horizontalAlignment = Alignment.CenterHorizontally
) {
    Text("Hello")
    Button(onClick = {}) { Text("Click") }
}
```

## Row

```kotlin
Row(
    modifier = Modifier.fillMaxWidth(),
    horizontalArrangement = Arrangement.SpaceBetween,
    verticalAlignment = Alignment.CenterVertically
) {
    Text("A")
    Text("B")
}
```

## Box

```kotlin
Box(
    modifier = Modifier.fillMaxSize(),
    contentAlignment = Alignment.Center
) {
    Text("Center")
}
```

## LazyColumn

```kotlin
LazyColumn(
    items = list,
    modifier = Modifier.fillMaxSize()
) { item ->
    ItemRow(item)
}
```

## Modifier thường dùng

```kotlin
Modifier
    .fillMaxSize()       // Toàn màn hình
    .fillMaxWidth()      // Toàn chiều rộng
    .padding(16.dp)     // Padding
    .clickable { }     // Clickable
    .background(Color)  // Màu nền
    .shadow(4.dp)      // Đổ bóng
    .clip(RoundedCornerShape(8.dp))  // Bo tròn
```

---

# Ktor (Web Backend)

## Pattern

```
Request → Route → Response
```

## Ktor Server

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.ktor:ktor-server-core:3.0.0")
    implementation("io.ktor:ktor-server-netty:3.0.0")
    implementation("io.ktor:ktor-server-content-negotiation:3.0.0")
    implementation("io.ktor:ktor-serialization-gson:3.0.0")
    implementation("io.ktor:ktor-server-cors:3.0.0")
    implementation("io.ktor:ktor-server-call-logging:3.0.0")
}
```

## Basic Route

```kotlin
fun main() {
    embeddedServer(Netty, port = 8080) {
        routing {
            get("/") {
                call.respondText("Hello Ktor")
            }
            
            get("/api/users") {
                call.respond(users)
            }
            
            post("/api/user") {
                val user = call.receive<User>()
                users.add(user)
                call.respond(user)
            }
        }
    }.start(wait = true)
}
```

## Route with Params

```kotlin
get("/api/user/{id}") {
    val id = call.parameters["id"]?.toIntOrNull()
    val user = users.find { it.id == id }
    if (user != null) {
        call.respond(user)
    } else {
        call.respond(HttpStatusCode.NotFound)
    }
}
```

## JSON Response

```kotlin
@Serializable
data class User(val id: Int, val name: String)

get("/api/json") {
    call.respond(mapOf("user" to User(1, "Ktor")))
}
```

## Ktor Client (from Android)

```kotlin
// build.gradle.kts
dependencies {
    implementation("io.ktor:ktor-client-core:3.0.0")
    implementation("io.ktor:ktor-client-okhttp:3.0.0")
    implementation("io.ktor:ktor-client-content-negotiation:3.0.0")
    implementation("io.ktor:ktor-serialization-gson:3.0.0")
}

// Client usage
val client = HttpClient {
    install(ContentNegotiation) {
        gson()
    }
}

suspend fun getUsers(): List<User> {
    return client.get("http://localhost:8080/api/users")
        .body()
}
```

## Ktor vs Flat Compose

| Aspect | Flat Compose | Ktor |
|--------|-------------|------|
| Platform | Android UI | Web Backend |
| Response | Composable | JSON/Text |
| State | mutableStateOf | In-memory/DB |
| Deploy | APK | JAR/Docker |

---

# Data Flow

```
User → ViewModel → State → UI
```