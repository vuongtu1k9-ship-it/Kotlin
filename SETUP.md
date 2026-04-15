# Setup

## Prerequisites

- JDK 17 or higher
- Android SDK 35
- Gradle 8.9

## Clone Repository

```bash
git clone https://github.com/vuongtu1k9-ship-it/Kotlin.git
cd Kotlin
```

## Build Debug APK

```bash
./gradlew assembleDebug
```

APK location: `app/build/outputs/apk/debug/app-debug.apk`

## Build Release APK

```bash
./gradlew assembleRelease
```

## Run Tests

```bash
./gradlew test
```

## Clean Build

```bash
./gradlew clean
```

## Troubleshooting

### Android SDK not found
Set ANDROID_HOME environment variable:
```bash
export ANDROID_HOME=/path/to/sdk
```

### Java version issues
Use JDK 17:
```bash
export JAVA_HOME=/path/to/jdk-17
```