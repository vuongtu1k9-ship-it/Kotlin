# TOOLS.md - Available Tools

## Build Commands

```bash
# Set Java
export JAVA_HOME=/root/app/jdk-25.0.2+10

# Build debug APK
./gradlew assembleDebug -x test

# Build with options
./gradlew assembleDebug -x test --no-daemon --parallel --build-cache

# Clean
./gradlew clean
```

## Git Commands

```bash
# Status
git status

# Add and commit
git add .
git commit -m "Task: description"

# Push
git push origin matster

# Check remote
git remote -v
```

## File Operations

```bash
# Read file
cat path/to/file.kt

# Search in files
grep -r "pattern" /root/Kotlin/

# List files
ls -la /root/Kotlin/
```

## GitHub

```bash
# Check runs
gh run list

# Check artifacts
gh api repos/vuongtu1k9-ship-it/Kotlin/actions/artifacts
```