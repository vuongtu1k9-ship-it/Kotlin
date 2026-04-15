package com.sample.counter

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

// 1. UiState (giảm lặp)
data class CounterState(
    val count: Int = 0
)

// 2. StateHolder (Logic - nhẹ hơn ViewModel)
class CounterHolder {
    var state by mutableIntStateOf(0)
        private set

    fun inc() { state++ }
    fun dec() { state-- }
    fun reset() { state = 0 }
}

// 3. Component (tái sử dụng)
@Composable
fun CounterView(
    count: Int,
    onInc: () -> Unit,
    onDec: () -> Unit,
    onReset: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "$count",
            style = MaterialTheme.typography.displayLarge
        )

        Button(onClick = onInc) { Text("+") }
        Button(onClick = onDec) { Text("-") }
        Button(onClick = onReset) { Text("Reset") }
    }
}

// 4. Screen (3 dòng - gọn nhất)
@Composable
fun CounterScreen(holder: CounterHolder = CounterHolder()) {
    CounterView(
        count = holder.state,
        onInc = holder::inc,
        onDec = holder::dec,
        onReset = holder::reset
    )
}