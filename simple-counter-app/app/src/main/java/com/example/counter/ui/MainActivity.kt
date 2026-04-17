package com.example.counter

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.counter.ui.theme.SimpleCounterAppTheme
import com.example.counter.viewmodel.CounterViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: CounterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SimpleCounterAppTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    CounterScreen(viewModel = viewModel)
                }
            }
        }
    }
}

@Composable
fun CounterScreen(viewModel: CounterViewModel) {
    val counter by viewModel.counterState.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = counter.toString(),
            fontSize = 48.sp
        )

        Button(
            onClick = { viewModel.increment() },
            modifier = Modifier.padding(8.dp)
        ) {
            Text(text = "Tăng (+1)")
        }

        Button(
            onClick = { viewModel.decrement() },
            modifier = Modifier.padding(8.dp)
        ) {
            Text(text = "Giảm (-1)")
        }

        Button(
            onClick = { viewModel.reset() },
            modifier = Modifier.padding(8.dp)
        ) {
            Text(text = "Reset")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun CounterScreenPreview() {
    SimpleCounterAppTheme {
        CounterScreen(viewModel = CounterViewModel())
    }
}