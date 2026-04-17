# Debug Commands for Android Build Errors

## 🔍 Common Debug Commands

### 1. **Check Gradle Build with Stacktrace & Debug**
```bash
./gradlew assembleDebug --stacktrace --debug
```

### 2. **Check GitHub Actions Logs**
```bash
gh run view <RUN_ID> --log-failed --repo <REPO>
```

### 3. **List Recent Workflow Runs**
```bash
gh run list --repo <REPO> --workflow="Android CI" --limit 5
```

### 4. **Re-run Failed Jobs**
```bash
gh run rerun <RUN_ID> --failed
```

### 5. **Check AAPT Errors (Resource Linking)**
```bash
./gradlew processDebugResources --stacktrace
```

### 6. **Clean Build**
```bash
./gradlew clean assembleDebug
```

### 7. **Check Dependency Tree**
```bash
./gradlew :app:dependencies
```

---

## 🛠️ Common Fixes

### 1. **Missing Resources (AAPT Error)**
- **Fix**: Ensure all resources (e.g., `mipmap/ic_launcher`, `values/themes.xml`) exist.
- **Command**:
  ```bash
  mkdir -p app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
  echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" | base64 -d > app/src/main/res/mipmap-mdpi/ic_launcher.png
  ```

### 2. **Missing Material3 Theme**
- **Fix**: Ensure `themes.xml` exists and uses a valid parent theme.
- **Example**:
  ```xml
  <style name="Theme.CoTuong" parent="Theme.Material3.DayNight">
  </style>
  ```

### 3. **Missing Dependencies**
- **Fix**: Ensure `build.gradle.kts` includes all required dependencies.
- **Example**:
  ```kotlin
  dependencies {
      implementation("androidx.compose.material3:material3:1.2.1")
      implementation("com.google.android.material:material:1.12.0")
  }
  ```

### 4. **AndroidX Not Enabled**
- **Fix**: Ensure `gradle.properties` includes:
  ```properties
  android.useAndroidX=true
  android.enableJetifier=true
  ```

---

## 📌 Notes
- Always check **GitHub Actions logs** for detailed errors.
- Use `--stacktrace` and `--debug` for deeper insights.
- Ensure **all resources** (icons, themes, XML files) are present.
- **Clean build** (`./gradlew clean`) if issues persist.