# Fix Commands for Common Android Build Errors

## 🚨 Common Errors & Fixes

### 1. **Compose Compiler Version Mismatch**
**Error:**
```
This version (1.5.3) of the Compose Compiler requires Kotlin version 1.9.10 but you appear to be using Kotlin version 1.9.20.
```

**Fix:**
Update `kotlinCompilerExtensionVersion` in `build.gradle.kts`:
```kotlin
composeOptions {
    kotlinCompilerExtensionVersion = "1.5.10" // Compatible with Kotlin 1.9.20
}
```

**Command:**
```bash
sed -i 's/kotlinCompilerExtensionVersion = "1.5.3"/kotlinCompilerExtensionVersion = "1.5.10"/g' app/build.gradle.kts
```

---

### 2. **Missing Launcher Icons**
**Error:**
```
AAPT: error: resource mipmap/ic_launcher (aka com.cotuong:mipmap/ic_launcher) not found.
```

**Fix:**
Create default launcher icons:
```bash
mkdir -p app/src/main/res/mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" | base64 -d > app/src/main/res/mipmap-mdpi/ic_launcher.png
cp app/src/main/res/mipmap-mdpi/ic_launcher.png app/src/main/res/mipmap-{hdpi,xhdpi,xxhdpi,xxxhdpi}/
```

---

### 3. **Missing Material3 Theme**
**Error:**
```
resource style/Theme.Material3.DayNight not found.
```

**Fix:**
Create `themes.xml`:
```xml
<!-- app/src/main/res/values/themes.xml -->
<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.CoTuong" parent="Theme.Material3.DayNight">
    </style>
</resources>
```

**Command:**
```bash
mkdir -p app/src/main/res/values
echo '<resources xmlns:tools="http://schemas.android.com/tools"><style name="Theme.CoTuong" parent="Theme.Material3.DayNight"></style></resources>' > app/src/main/res/values/themes.xml
```

---

### 4. **Remove Problematic Workflow**
**Error:**
Workflow fails due to misconfiguration.

**Fix:**
Remove the workflow file:
```bash
rm -f .github/workflows/android-ci.yml
```

---

### 5. **Enable AndroidX**
**Error:**
```
The `android.useAndroidX` property is not enabled.
```

**Fix:**
Add to `gradle.properties`:
```properties
android.useAndroidX=true
android.enableJetifier=true
```

**Command:**
```bash
echo -e "android.useAndroidX=true\nandroid.enableJetifier=true" >> gradle.properties
```

---

## 📌 Notes
- Always **clean build** after fixing:
  ```bash
  ./gradlew clean assembleDebug
  ```
- Check **GitHub Actions logs** for detailed errors.
- Use `--stacktrace` for deeper insights:
  ```bash
  ./gradlew assembleDebug --stacktrace
  ```