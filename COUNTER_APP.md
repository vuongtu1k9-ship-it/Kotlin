# CounterApp - Flat Compose Sample

## Cấu trúc

```
CounterApp.kt
├── CounterState (UiState)
├── CounterHolder (Logic)
├── CounterView (Component)
└── CounterScreen (Screen)
```

## Flat Compose Pattern

### 1. State
```kotlin
data class CounterState(
    val count: Int = 0
)
```

### 2. Holder (Logic - nhẹ hơn ViewModel)
```kotlin
class CounterHolder {
    var state by mutableIntStateOf(0)
        private set

    fun inc() { state++ }
    fun dec() { state-- }
}
```

### 3. Component (tái sử dụng)
```kotlin
@Composable
fun CounterView(
    count: Int,
    onInc: () -> Unit,
    onDec: () -> Unit
) {
    Column {
        Text("$count")
        Button(onClick = onInc) { Text("+") }
    }
}
```

### 4. Screen (3 dòng)
```kotlin
@Composable
fun CounterScreen(holder: CounterHolder = CounterHolder()) {
    CounterView(
        count = holder.state,
        onInc = holder::inc,
        onDec = holder::dec
    )
}
```

## Build

```bash
cd /root/Kotlin && ./gradlew assembleDebug
```

## Files

- `app/src/main/java/com/sample/counter/CounterApp.kt`
- `app/src/main/java/com/sample/counter/MainActivity.kt`
- `app/src/main/AndroidManifest.xml`