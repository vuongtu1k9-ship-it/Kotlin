# Kotlin Xiangqi

A Kotlin Android application for playing Xiangqi (Chinese Chess).

## Features

- Full Xiangqi game implementation
- Clean Architecture (MVVM)
- Jetpack Compose UI
- Local storage

## Requirements

- JDK 17+
- Gradle 8.9
- Android SDK 35

## Project Structure

```
Kotlin/
├── README.md
├── AGENTS.md
├── ARCHITECTURE.md
├── SETUP.md
├── CHANGELOG.md
├── .github/workflows/build.yml
├── gradlew
├── settings.gradle.kts
├── build.gradle.kts
└── app/
    ├── src/main/java/
    ├── src/main/res/
    └── build.gradle.kts
```

## Build

```bash
./gradlew assembleDebug
```

APK: `app/build/outputs/apk/debug/app-debug.apk`

## License

MIT