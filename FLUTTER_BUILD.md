# FLUTTER BUILD GUIDE - COMPLETE

## Overview
Cach build Flutter app thanh APK qua GitHub Actions.

## Build Steps (A → Z)

### 1. ALWAYS Create Project First
```
flutter create --org com.appname --project-name appname --platforms android .
```
- WITHOUT this: "unsupported Gradle project" error
- Creates android/ folder

### 2. Workflow File
```yaml
name: Flutter CI
on:
  push:
    branches: [ cotuong ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.19.5'
      - name: Create project
        run: |
          rm -rf *
          rm -rf .*
          flutter create --org com.x1k9 --project-name xiangqi --platforms android .
      - name: Install dependencies
        run: flutter pub get
      - name: Build APK
        run: flutter build apk --release
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-release
          path: build/app/outputs/flutter-apk/app-release.apk
```

### 3. Commands Reference
| Action | Command |
|--------|---------|
| Create project | flutter create --org com.x --name x --platforms android . |
| Get deps | flutter pub get |
| Analyze | flutter analyze |
| Build | flutter build apk --release |

## Common Errors Fix

### "unsupported Gradle project"
- Cause: No android/ folder
- Fix: Run flutter create first

### "analyze failure"  
- Fix: Check Dart syntax

## Artifact Download
```
gh run download RUN_ID -n app-release
```

## APK Location After Build
```
build/app/outputs/flutter-apk/app-release.apk
```