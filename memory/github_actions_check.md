# GitHub Actions Check & Debug Guide

## 🔍 Check GitHub Actions Status

### 1. **List Recent Workflow Runs**
```bash
gh run list --repo vuongtu1k9-ship-it/Kotlin --workflow="Android CI" --limit 5
```

**Output Example:**
```
STATUS    CONCLUSION  NAME       WORKFLOW    BRANCH    COMMIT_MSG                              ID          TIME
completed failure     Android CI  Android CI  cotuong   Fix: Update Kotlin to 1.9.22       24547349566  3m
```

---

### 2. **View Logs of a Failed Run**
```bash
gh run view <RUN_ID> --log-failed --repo vuongtu1k9-ship-it/Kotlin
```

**Example:**
```bash
gh run view 24547349566 --log-failed --repo vuongtu1k9-ship-it/Kotlin
```

---

### 3. **Re-run a Failed Workflow**
```bash
gh run rerun <RUN_ID> --failed --repo vuongtu1k9-ship-it/Kotlin
```

**Example:**
```bash
gh run rerun 24547349566 --failed
```

---

### 4. **Check Full Logs (if needed)**
```bash
gh run view <RUN_ID> --log --repo vuongtu1k9-ship-it/Kotlin
```

---

## 🛠️ Common Fixes for GitHub Actions

### 1. **Compose Compiler Version Mismatch**
**Error:**
```
This version (1.5.10) of the Compose Compiler requires Kotlin version 1.9.22
```

**Fix:**
Update `kotlinCompilerExtensionVersion` in `build.gradle.kts`:
```kotlin
composeOptions {
    kotlinCompilerExtensionVersion = "1.5.11" // Latest compatible with Kotlin 1.9.22
}
```

**Command:**
```bash
sed -i 's/kotlinCompilerExtensionVersion = "1.5.10"/kotlinCompilerExtensionVersion = "1.5.11"/g' app/build.gradle.kts
```

---

### 2. **Missing Resources (AAPT Error)**
**Error:**
```
AAPT: error: resource mipmap/ic_launcher not found
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
resource style/Theme.Material3.DayNight not found
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

### 4. **Enable AndroidX**
**Error:**
```
The `android.useAndroidX` property is not enabled
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
- **Re-run failed workflows** after fixes:
  ```bash
gh run rerun <RUN_ID> --failed
  ```