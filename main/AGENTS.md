# AGENTS.md - Project Management Workflow

This is the workspace for Kotlin/Android project management.

## First Run

If `BOOTSTRAP.md` exists, follow it to understand your role, then delete it.

## Session Startup

Before anything:
1. Read `SOUL.md` — your role
2. Read `USER.md` — who you're helping
3. Read `memory/` for recent context

## Project Info

- **Language:** Kotlin (MANDATORY), Java only if truly needed
- **Platform:** Android
- **Build:** Gradle 9.4.1 with JDK 25
- **App Name:** Short and accurate

## Team Roles

| Agent | Name | Workload | Role |
|-------|------|----------|------|
| main | ProjectManager | 0.5 | Plan, coordinate |
| main1 | Coder | 1.5 | Write Kotlin code |
| main2 | Reviewer | 1.5 | Review, build APK, deploy |

---

# CODING WORKFLOW (Task → Deploy)

## Input Format

Task description from user.

## Step 1: Coder (main1) - Generate Code

Coder receives task and outputs **ONLY JSON**:
```json
{
  "file": "Game.kt",
  "path": "app/src/main/kotlin/game/",
  "code": "/* Kotlin code here */"
}
```

**Rules:**
- Output ONLY JSON
- No explanation
- No extra text

## Step 2: Reviewer (main2) - Fix Code

Reviewer receives JSON from Coder and outputs **ONLY JSON**:
```json
{
  "file": "Game.kt",
  "path": "app/src/main/kotlin/game/",
  "code": "/* Fixed Kotlin code */"
}
```

**Reviewer tasks:**
1. Fix compile errors
2. Add missing imports
3. Simplify code
4. Ensure builds with Gradle
5. Do NOT change structure

## Step 3: Write File

Reviewer writes file:
```bash
file=$(jq -r '.file' output.json)
path=$(jq -r '.path' output.json)
code=$(jq -r '.code' output.json)
mkdir -p "$path"
echo "$code" > "$path/$file"
```

## Step 4: Build APK

```bash
./gradlew assembleDebug -x test --no-daemon --parallel --build-cache
```

**Gradle options:**
```
org.gradle.daemon=false
org.gradle.parallel=true
org.gradle.jvmargs=-Xmx1g -XX:+UseG1GC
```

## Step 5: Error Handling

If build fails:
1. Get error log: `grep -i "error" build.log | tail -20`
2. Send error to Reviewer (main2) for fixing
3. Rebuild (max 2-3 iterations)

## Step 6: Deploy to GitHub

After successful build:
```bash
git add .
git commit -m "Task: description"
git push origin main
```

---

# BUILD COMMANDS

```bash
# Set Java
export JAVA_HOME=/root/app/jdk-25.0.2+10

# Build debug APK
./gradlew assembleDebug -x test

# Build with options
./gradlew assembleDebug -x test --no-daemon --parallel --build-cache

# Clean
./gradlew clean

# Check errors
grep -i "error" build.log | tail -20
```

---

# EXISTING FILES

- Game.kt
- Board.kt

These are existing files in the project. Read them first before making changes.

---

# QUALITY STANDARDS

- Kotlin MUST compile
- Tests must pass
- APK must build
- No structure changes unless required

---

_Update workflow as needed._