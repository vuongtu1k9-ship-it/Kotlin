# ARCHITECTURE.md Flashcards

Dùng để học thuộc các khái niệm và cú pháp trong **ARCHITECTURE.md** của dự án Kotlin/Android.

---

## Flashcard 1: MVVM Pattern
**Mặt trước:**
> MVVM trong Kotlin/Android gồm những thành phần nào? Mô tả vai trò của từng thành phần.

**Mặt sau:**
> - **ViewModel**: Chứa logic xử lý sự kiện và trạng thái (ví dụ: `GameViewModel`).
> - **State**: Dữ liệu hiện tại của ứng dụng (ví dụ: `GameState`).
> - **UI**: Hiển thị trạng thái và tương tác với người dùng (ví dụ: `Composable`).
> - **Luồng dữ liệu**: `User → ViewModel → State → UI`.

---

## Flashcard 2: Null Safety
**Mặt trước:**
> Giải thích ý nghĩa của các toán tử sau và cho ví dụ: `?.`, `?:`, `!!`

**Mặt sau:**
> - `?.`: **Safe call** – Bỏ qua nếu đối tượng là `null`.
>   Ví dụ: `user?.name` → Trả về `null` nếu `user` là `null`.
> - `?:`: **Elvis operator** – Giá trị mặc định nếu `null`.
>   Ví dụ: `user?.name ?: "Guest"` → Trả về `"Guest"` nếu `user?.name` là `null`.
> - `!!`: **Force unwrap** – Ép buộc không `null` (crash nếu `null`).
>   Ví dụ: `user!!.id` → Crash nếu `user` là `null`.

---

## Flashcard 3: Flat Compose
**Mặt trước:**
> Flat Compose khác gì so với MVVM? Ưu điểm của Flat Compose là gì?

**Mặt sau:**
> - **Flat Compose**:
>   - Sử dụng `StateHolder` thay vì `ViewModel` (nhẹ hơn).
>   - Screen chỉ cần **3 dòng code** (gọn nhẹ).
>   - Tái sử dụng component dễ dàng.
> - **MVVM**:
>   - Phù hợp cho ứng dụng phức tạp, nhiều logic.
>   - Boilerplate nhiều hơn.
> - **Ưu điểm Flat Compose**:
>   - Code ngắn gọn, dễ bảo trì.
>   - Phù hợp cho màn hình đơn giản.

---

## Flashcard 4: Ktor Backend
**Mặt trước:**
> Ktor là gì? Cấu trúc cơ bản của một route trong Ktor như thế nào?

**Mặt sau:**
> - **Ktor**: Framework backend cho Kotlin, dùng để xây dựng API web.
> - **Cấu trúc route cơ bản**:
>   ```kotlin
>   embeddedServer(Netty, port = 8080) {
>       routing {
>           get("/api/users") {
>               call.respond(users)  // Trả về danh sách users
>           }
>           post("/api/user") {
>               val user = call.receive<User>()  // Nhận dữ liệu từ client
>               users.add(user)
>               call.respond(user)  // Trả về user vừa thêm
>           }
>       }
>   }.start(wait = true)
>   ```

---

## Flashcard 5: UI Toolkit (Compose)
**Mặt trước:**
> Liệt kê 4 thành phần layout cơ bản trong Compose và giải thích ngắn gọn.

**Mặt sau:**
> 1. **Column**: Sắp xếp các thành phần theo chiều dọc.
>    Ví dụ: `Column { Text("A"); Text("B") }`
> 2. **Row**: Sắp xếp các thành phần theo chiều ngang.
>    Ví dụ: `Row { Text("A"); Text("B") }`
> 3. **Box**: Chứa các thành phần chồng lên nhau.
>    Ví dụ: `Box { Text("Center") }`
> 4. **LazyColumn**: Hiển thị danh sách hiệu quả (tối ưu bộ nhớ).
>    Ví dụ: `LazyColumn(items = list) { item -> ItemRow(item) }`

---

## Flashcard 6: Data Class và Sealed Class
**Mặt trước:**
> Data class và sealed class dùng để làm gì? Cho ví dụ.

**Mặt sau:**
> - **Data class**: Lưu trữ dữ liệu (tự động sinh `toString()`, `equals()`, `hashCode()`).
>   Ví dụ:
>   ```kotlin
>   data class User(val id: Int, val name: String)
>   ```
> - **Sealed class**: Định nghĩa các loại dữ liệu cố định (dùng với `when`).
>   Ví dụ:
>   ```kotlin
>   sealed class Result {
>       data class Success(val data: String) : Result()
>       data class Error(val message: String) : Result()
>   }
>   ```

---

## Flashcard 7: Coroutines
**Mặt trước:**
> Coroutines trong Kotlin dùng để làm gì? Ví dụ về cách sử dụng.

**Mặt sau:**
> - **Coroutines**: Xử lý tác vụ bất đồng bộ (ví dụ: gọi API, đọc file).
> - **Ví dụ**:
>   ```kotlin
>   viewModelScope.launch {  // Chạy trong background
>       val data = api.getData()  // Gọi API
>       state = state.copy(data = data)  // Cập nhật state
>   }
>   ```

---

## Flashcard 8: Modifier trong Compose
**Mặt trước:**
> Modifier trong Compose dùng để làm gì? Liệt kê 5 modifier thường dùng.

**Mặt sau:**
> - **Modifier**: Tùy chỉnh giao diện và hành vi của thành phần Compose.
> - **5 modifier thường dùng**:
>   1. `fillMaxSize()`: Chiêm toàn bộ không gian.
>   2. `padding(16.dp)`: Thêm khoảng cách xung quanh.
>   3. `clickable { }`: Thêm sự kiện click.
>   4. `background(Color.Blue)`: Đặt màu nền.
>   5. `clip(RoundedCornerShape(8.dp))`: Bo tròn góc.

---

## Flashcard 9: Null Safety trong Collection
**Mặt trước:**
> Làm thế nào để xử lý null safety khi làm việc với danh sách? Cho ví dụ.

**Mặt sau:**
> - Sử dụng `?.`, `?:`, `filterNotNull()` để xử lý `null`.
> - Ví dụ:
>   ```kotlin
>   val names = users.map { it.name }  // Có thể chứa null
>   val safeNames = users.mapNotNull { it.name }  // Loại bỏ null
>   val firstName = users.firstOrNull()?.name ?: "Unknown"
>   ```

---

## Flashcard 10: State trong Compose
**Mặt trước:**
> Trong Compose, `remember` và `mutableStateOf` dùng để làm gì? Cho ví dụ.

**Mặt sau:**
> - `remember`: Lưu trữ giá trị qua các lần recomposition.
> - `mutableStateOf`: Tạo state có thể thay đổi (kích hoạt recomposition khi thay đổi).
> - Ví dụ:
>   ```kotlin
>   @Composable
>   fun Counter() {
>       var count by remember { mutableStateOf(0) }
>       Button(onClick = { count++ }) {
>           Text("Count: $count")
>       }
>   }
>   ```