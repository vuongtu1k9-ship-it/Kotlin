# AGENT TRAINING GUIDE - PRO

## 3 Agents System

### agent (Design) - MUST DO:
- Read INPUT.md thoroughly
- Create SPEC.md with CLEAR steps
- Define file structure explicitly
- Specify dependencies in pubspec.yaml
- Call agent1 after SPEC created

### agent1 (Code) - MUST DO:
- Create Flutter project: flutter create --org com.xiangqi --project-name xiangqi
- Create lib/models/ with Dart files
- Write clean Dart code (not Kotlin converted)
- Run flutter analyze before push
- Push to GitHub branch cotuong

### agent2 (Test) - MUST DO:
- Check GitHub Actions result
- If FAIL: report error + call agent1 to fix
- If PASS: verify APK exists
- Report final result

## Build Rules

### Flutter Projects:
1. flutter create --org com.appname --project-name appname --platforms android .
2. flutter pub get
3. flutter analyze
4. flutter build apk --release
5. Upload artifact to release

## Common Fixes

### "unsupported Gradle project":
- Run flutter create first to generate android/ files
- Do NOT just have lib/ files

### "analyze failure":
- Fix Dart syntax errors
- Remove duplicate class definitions
- Check imports

### Import structure:
```dart
import 'package:flutter/material.dart';
import 'models/piece.dart';
import 'models/board.dart';
```

## GitHub Actions Workflow:
```yaml
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

## Success Criteria

- Build status: SUCCESS
- APK file: EXISTS
- Code: compiles without errors