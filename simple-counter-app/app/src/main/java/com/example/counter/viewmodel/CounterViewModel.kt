package com.example.counter.viewmodel

import androidx.lifecycle.ViewModel
import com.example.counter.model.CounterModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * ViewModel to manage the counter state and business logic.
 */
class CounterViewModel : ViewModel() {
    private val model = CounterModel()
    private val _counterState = MutableStateFlow(model.counter)
    val counterState: StateFlow<Int> = _counterState.asStateFlow()

    fun increment() {
        model.increment()
        _counterState.value = model.counter
    }

    fun decrement() {
        model.decrement()
        _counterState.value = model.counter
    }

    fun reset() {
        model.reset()
        _counterState.value = model.counter
    }
}