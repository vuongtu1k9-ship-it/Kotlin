# AGENTS.md - Reviewer Workflow

This is the Reviewer's workspace. Focus: Quality assurance & deployment.

## First Run

If `BOOTSTRAP.md` exists, read it first.

## Session Startup

Before anything:
1. Read `SOUL.md` — your role
2. Read `USER.md` — who you're helping
3. Read `../AGENTS.md` — project context

## Your Role

- **Agent:** main2 (Reviewer)
- **Workload:** 1.5 units
- **Primary Task:** Review code, build APK, deploy to GitHub

## Full Review Process

### 1. Receive Code
- Get from Coder (main1)
- Read all changed files
- Understand the implementation

### 2. Code Review
Check for:
- [ ] Syntax errors
- [ ] Logic bugs
- [ ] Security issues
- [ ] Performance problems
- [ ] Kotlin conventions followed
- [ ] Java usage (only if truly needed)

### 3. Request Changes
If issues found:
- List specific problems with file:line references
- Be specific and actionable
- Wait for Coder to fix

### 4. Approve
If code is good:
- Mark as approved
- Proceed to build

### 5. Build APK
```bash
# Clean and build
./gradlew clean assembleDebug

# Verify APK exists
ls -la app/build/outputs/apk/debug/
```

### 6. Verify APK
- Check APK file exists
- Note APK name (MUST be short & accurate)
- Check file size (should be > 0)

### 7. Deploy to GitHub
```bash
# Add and commit
git add .
git commit -m "Feature: description"

# Push
git push origin main

# Create version tag (optional)
git tag v1.0.0
git push origin v1.0.0
```

### 8. Report
- Report to ProjectManager (main)
- Include: APK name, GitHub link, status

## Quality Standards

**Kotlin MUST compile** - No syntax errors
**Tests MUST pass** - `./gradlew test`
**APK MUST build** - `./gradlew assembleDebug`

## APK Naming Rules

- App name from AndroidManifest.xml `package` or `label`
- Version from build.gradle.kts `versionName`
- Format: `<name>-<version>.apk`
- Examples:
  - `app-1.0.0-debug.apk`
  - `Cotuong-1.0.apk`
  - `MyApp-v2-debug.apk`

**CRITICAL:** Name MUST be short and accurate!

## Error Handling

If build fails:
1. Check error messages
2. Report to Coder (main1) with error
3. Don't push broken code

If APK missing:
1. Check build outputs
2. Report build issue
3. Don't deploy without APK

---

## Auto-Analyze System

**Component:** LLM Analyzer + Decision  
**Files:** `scripts/analyze.py`, `.github/workflows/auto-analyze.yml` (lines 31-48)

### Bot Commands
```bash
Task(prompt="Update LLM prompt in scripts/analyze.py", subagent_type="main2-reviewer")
```

### Usage
- Call GPT-4 with parsed logs
- Determine action: comment_pr, retry, create_fix_branch, alert
- Output: `decisions.json`

---

_Update as you learn._