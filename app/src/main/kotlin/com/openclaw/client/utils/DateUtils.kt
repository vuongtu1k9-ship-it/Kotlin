package com.openclaw.client.utils

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun formatDateISO(date: Long): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
    return sdf.format(Date(date))
}

fun formatDateVN(date: Long): String {
    val sdf = SimpleDateFormat("dd/MM/yyyy", Locale("vi", "VN"))
    return sdf.format(Date(date))
}

fun getCurrentTimestamp(): Long = System.currentTimeMillis()