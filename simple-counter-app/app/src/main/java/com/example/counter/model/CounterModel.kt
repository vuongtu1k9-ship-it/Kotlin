package com.example.counter.model

/**
 * Model class to manage the counter data.
 * Ensures the counter value is never less than 0.
 */
class CounterModel {
    private var _counter: Int = 0

    val counter: Int
        get() = _counter

    fun increment() {
        _counter += 1
    }

    fun decrement() {
        if (_counter > 0) {
            _counter -= 1
        }
    }

    fun reset() {
        _counter = 0
    }
}