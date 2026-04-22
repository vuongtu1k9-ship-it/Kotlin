# Flutter Support - He thong 3 Agents

## Cong nghe ho tro:
- **Android Native**: Kotlin + Jetpack Compose
- **Cross Platform**: Flutter + Dart

---

## Flutter Agent Pipeline

```
USER -> agent (Design) -> agent1 (Code) -> agent2 (Test) -> GitHub -> Flutter Build -> APK
```

---

## Flutter Project Template

### Buoc 1: Gui yeu cau

```
Du an: TEN_APP
Platform: Flutter

Tinh nang:
- F1
- F2

UI:
- Man 1: mo ta
- Man 2: mo ta

Stack:
- Flutter 3.x
- Provider/Riverpod (state management)
- Min SDK Android 21

Uu tien: P0 (must have), P1 (nice to have)
```

---

## Flutter Build Rules

### CAN:
- Build tren GitHub Actions (uu tien)
- Build local tren server (neu RAM du)

### KHONG:
- Khong build local tren server (neu RAM khong du)

### Build Commands:
```bash
# GitHub Actions (uu tien)
flutter pub get
flutter build apk --release

# Local test (neu can)
flutter analyze
flutter test
```

---

## Project Structure (Flutter)
```
lib/
├── main.dart
├── screens/
├── widgets/
├── providers/
├── models/
├── services/
└── utils/
```

## State Management
- **Nho**: Dung Provider hoac Riverpod
- **Async**: FutureProvider, StreamProvider

## Code Quality
- flutter analyze (khong co loi)
- flutter test (unit tests)
- Widget tests cho UI chinh

## GitHub Actions (Flutter)
```yaml
- uses: subosito/flutter-action@v2
- run: flutter pub get
- run: flutter build apk --release
```
