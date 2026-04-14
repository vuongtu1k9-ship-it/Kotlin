# TOOLS.md - Project Management & Development Tools

## Available Tools

### Build Tools

- **Gradle** (`./gradlew`) - Build system for Android projects
- **Android SDK** - Mobile development toolkit

### Languages & Frameworks

- **Kotlin** - Primary programming language (MUST use)
- **Java** - Supporting language (only if truly needed)
- **Jetpack Compose** - Modern UI toolkit
- **Android Views** - Traditional UI framework (avoid unless needed)

### Key Commands

```bash
# Build
./gradlew assembleDebug    # Debug APK
./gradlew assembleRelease   # Release APK
./gradlew build            # Full build

# Run
./gradlew run               # Run (if applicable)

# Test
./gradlew test              # Run unit tests
./gradlew testDebugUnitTest # Debug tests

# Clean
./gradlew clean             # Clean build outputs
./gradlew cleanBuildCache   # Clean build cache

# Other
./gradlew dependencies      # View dependencies
./gradlew tasks             # List all available tasks
./gradlew lint              # Run lint checks
```

## Project Structure

```
/root/app/
├── app/           # Main application module
├── src/           # Source code (Java/Kotlin)
├── res/           # Resources (layouts, drawables, values)
├── build/         # Build outputs
├── Kotlin/       # Kotlin source files
├── tasks/        # Task files for project management
├── build.gradle.kts  # Module build config
└── settings.gradle.kts  # Project settings
```

## GitHub Commands

```bash
# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Add remote
git remote add origin <github-url>

# Push to GitHub
git push -u origin main

# Create branch
git checkout -b feature/<name>

# Commit changes
git add .
git commit -m "Description"

# Push branch
git push -u origin feature/<name>
```

## Development Notes

- Use Kotlin for all new code (MANDATORY)
- Java only when truly necessary
- Follow Android coding conventions
- Keep UI logic in Compose where possible
- Use ViewModel for state management
- App name must be SHORT and ACCURATE

## Workflow Tools

### Task Management
- Create tasks in `tasks/` directory
- Format: `task-YYYY-MM-DD.md`
- Track: todo, in-progress, done

### Code Review
- Review before merging
- Check: syntax, logic, security
- Verify: builds, tests pass

### APK Naming
Format: `<appname>-<version>.apk`
- Version from `build.gradle.kts`
- App name from `AndroidManifest.xml`