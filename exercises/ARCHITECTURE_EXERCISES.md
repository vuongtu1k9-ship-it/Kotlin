# ARCHITECTURE.md Exercises

Bài tập thực hành để học thuộc và áp dụng các khái niệm trong **ARCHITECTURE.md**.

---

## Bài 1: Viết một ViewModel đơn giản
**Yêu cầu**:
Tạo một `CounterViewModel` với:
- Trạng thái `count` (kiểu `Int`, mặc định là `0`).
- Hàm `increment()` để tăng `count` lên 1.
- Hàm `decrement()` để giảm `count` đi 1.

**Gợi ý**:
```kotlin
class CounterViewModel : ViewModel() {
    var count by mutableStateOf(0)
    fun increment() { /* ... */ }
    fun decrement() { /* ... */ }
}
```

**Giải pháp**:
```kotlin
class CounterViewModel : ViewModel() {
    var count by mutableStateOf(0)
    fun increment() { count++ }
    fun decrement() { count-- }
}
```

---

## Bài 2: Sử dụng Flat Compose
**Yêu cầu**:
Tạo một màn hình `CounterScreen` sử dụng `StateHolder` với:
- Một nút **"+"** để tăng `count`.
- Một nút **"–"** để giảm `count`.
- Hiển thị giá trị `count` ở giữa màn hình.

**Gợi ý**:
```kotlin
class CounterStateHolder {
    var count by mutableStateOf(0)
    fun increment() { count++ }
    fun decrement() { count-- }
}

@Composable
fun CounterScreen(vm: CounterStateHolder = CounterStateHolder()) {
    // TODO: Hiển thị count và 2 nút
}
```

**Giải pháp**:
```kotlin
@Composable
fun CounterScreen(vm: CounterStateHolder = CounterStateHolder()) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Count: ${vm.count}")
        Row {
            Button(onClick = vm::increment) { Text("+") }
            Spacer(modifier = Modifier.width(16.dp))
            Button(onClick = vm::decrement) { Text("–") }
        }
    }
}
```

---

## Bài 3: Viết một route Ktor
**Yêu cầu**:
Tạo một route Ktor để quản lý danh sách `tasks` với:
- `GET /tasks`: Trả về danh sách tất cả tasks.
- `POST /tasks`: Thêm task mới vào danh sách.

**Gợi ý**:
```kotlin
val tasks = mutableListOf<String>()

embeddedServer(Netty, port = 8080) {
    routing {
        get("/tasks") {
            call.respond(tasks)
        }
        post("/tasks") {
            val task = call.receive<String>()
            tasks.add(task)
            call.respond("Task added: $task")
        }
    }
}.start(wait = true)
```

**Giải pháp**:
```kotlin
val tasks = mutableListOf<String>()

fun main() {
    embeddedServer(Netty, port = 8080) {
        routing {
            get("/tasks") {
                call.respond(tasks)
            }
            post("/tasks") {
                val task = call.receive<String>()
                tasks.add(task)
                call.respond("Task added: $task")
            }
        }
    }.start(wait = true)
}
```

---

## Bài 4: Null Safety
**Yêu cầu**:
Viết hàm `getUserName` nhận vào một `User?` và trả về:
- Tên người dùng nếu `user` không null.
- `"Unknown"` nếu `user` là null hoặc `user.name` là null.

**Gợi ý**:
```kotlin
data class User(val name: String?)

fun getUserName(user: User?): String {
    return user?.name ?: "Unknown"
}
```

**Giải pháp**:
```kotlin
data class User(val name: String?)

fun getUserName(user: User?): String {
    return user?.name ?: "Unknown"
}
```

---

## Bài 5: Sử dụng LazyColumn
**Yêu cầu**:
Tạo một `LazyColumn` hiển thị danh sách `items` (kiểu `List<String>`).
Mỗi item hiển thị một `Text` với nội dung là giá trị của item.

**Gợi ý**:
```kotlin
@Composable
fun ItemList(items: List<String>) {
    LazyColumn {
        items(items) { item ->
            Text(item)
        }
    }
}
```

**Giải pháp**:
```kotlin
@Composable
fun ItemList(items: List<String>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize()
    ) {
        items(items) { item ->
            Text(
                text = item,
                modifier = Modifier.padding(16.dp)
            )
            Divider()
        }
    }
}
```

---

## Bài 6: Data Class và Sealed Class
**Yêu cầu**:
1. Tạo một `data class` tên `Product` với các trường:
   - `id: Int`
   - `name: String`
   - `price: Double`
2. Tạo một `sealed class` tên `Result` với 2 loại:
   - `Success`: Chứa một `Product`.
   - `Error`: Chứa một `message: String`.

**Gợi ý**:
```kotlin
data class Product(val id: Int, val name: String, val price: Double)

sealed class Result {
    data class Success(val product: Product) : Result()
    data class Error(val message: String) : Result()
}
```

**Giải pháp**:
```kotlin
data class Product(val id: Int, val name: String, val price: Double)

sealed class Result {
    data class Success(val product: Product) : Result()
    data class Error(val message: String) : Result()
}
```

---

## Bài 7: Coroutines
**Yêu cầu**:
Viết một hàm `fetchData` sử dụng coroutine để:
1. Giả lập việc gọi API với `delay(1000)`.
2. Trả về chuỗi `"Data loaded"` sau khi delay.

**Gợi ý**:
```kotlin
suspend fun fetchData(): String {
    delay(1000)
    return "Data loaded"
}
```

**Giải pháp**:
```kotlin
suspend fun fetchData(): String {
    delay(1000)  // Giả lập thời gian gọi API
    return "Data loaded"
}

// Sử dụng trong ViewModel
class MyViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {
            val data = fetchData()
            println(data)  // In ra "Data loaded"
        }
    }
}
```

---

## Bài 8: Modifier trong Compose
**Yêu cầu**:
Tạo một `Text` với các modifier sau:
- `fillMaxWidth()`: Chiêm toàn bộ chiều rộng.
- `padding(16.dp)`: Thêm khoảng cách.
- `background(Color.LightGray)`: Màu nền.
- `clickable { }`: Thêm sự kiện click.

**Gợi ý**:
```kotlin
@Composable
fun StyledText() {
    Text(
        text = "Click me!",
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .background(Color.LightGray)
            .clickable { }
    )
}
```

**Giải pháp**:
```kotlin
@Composable
fun StyledText() {
    Text(
        text = "Click me!",
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .background(Color.LightGray)
            .clickable { println("Clicked!") },
        textAlign = TextAlign.Center
    )
}
```

---

## Bài 9: State trong Compose
**Yêu cầu**:
Tạo một `Composable` tên `ToggleButton` với:
- Một nút có nội dung `"ON"` hoặc `"OFF"`.
- Khi click, chuyển đổi giữa `ON` và `OFF`.

**Gợi ý**:
```kotlin
@Composable
fun ToggleButton() {
    var isOn by remember { mutableStateOf(false) }
    Button(onClick = { isOn = !isOn }) {
        Text(if (isOn) "ON" else "OFF")
    }
}
```

**Giải pháp**:
```kotlin
@Composable
fun ToggleButton() {
    var isOn by remember { mutableStateOf(false) }
    Button(
        onClick = { isOn = !isOn },
        modifier = Modifier.padding(16.dp)
    ) {
        Text(if (isOn) "ON" else "OFF")
    }
}
```

---

## Bài 10: Kết hợp LazyColumn và State
**Yêu cầu**:
Tạo một `LazyColumn` hiển thị danh sách `items` (kiểu `List<String>`) với:
- Một nút **"Add Item"** ở đầu màn hình.
- Khi click nút, thêm một item mới (`"Item ${items.size + 1}"`) vào danh sách.

**Gợi ý**:
```kotlin
@Composable
fun DynamicList() {
    var items by remember { mutableStateOf(listOf("Item 1")) }
    Column {
        Button(onClick = { /* Thêm item mới */ }) {
            Text("Add Item")
        }
        LazyColumn {
            items(items) { item ->
                Text(item)
            }
        }
    }
}
```

**Giải pháp**:
```kotlin
@Composable
fun DynamicList() {
    var items by remember { mutableStateOf(listOf("Item 1")) }
    Column {
        Button(
            onClick = { items = items + "Item ${items.size + 1}" },
            modifier = Modifier.padding(16.dp)
        ) {
            Text("Add Item")
        }
        LazyColumn(
            modifier = Modifier.weight(1f)
        ) {
            items(items) { item ->
                Text(
                    text = item,
                    modifier = Modifier.padding(16.dp)
                )
                Divider()
            }
        }
    }
}
```