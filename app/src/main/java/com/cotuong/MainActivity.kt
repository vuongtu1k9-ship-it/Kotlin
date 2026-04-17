package com.cotuong

import android.content.Context
import android.media.AudioAttributes
import android.media.SoundPool
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    // SoundPool cho hiệu ứng âm thanh
    private lateinit var soundPool: SoundPool
    private var soundMoveId = 0
    private var soundCaptureId = 0
    private var soundWinId = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Khởi tạo SoundPool
        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_GAME)
            .build()
        
        soundPool = SoundPool.Builder()
            .setMaxStreams(3)
            .setAudioAttributes(audioAttributes)
            .build()
        
        // Tải file âm thanh
        soundMoveId = soundPool.load(this, R.raw.sound_move, 1)
        soundCaptureId = soundPool.load(this, R.raw.sound_capture, 1)
        soundWinId = soundPool.load(this, R.raw.sound_win, 1)

        setContent {
            MaterialTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    ChessView(soundPool, soundMoveId, soundCaptureId, soundWinId)
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        soundPool.release() // Giải phóng SoundPool khi activity bị hủy
    }
}