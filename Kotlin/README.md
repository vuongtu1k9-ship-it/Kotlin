# Kotlin Xiangqi (Cờ Tướng)

A Kotlin Android application for playing Xiangqi (Chinese Chess) with local storage.

## Features

- ✅ Full Xiangqi game rules implementation
- ✅ Local game storage (no Supabase dependency)
- ✅ Clean architecture with GameRepository
- ✅ Compose UI for modern Android development

## Project Structure

```
xiangqi-apk/
├── app/
│   ├── src/main/java/com/xiangqi/
│   │   ├── MainActivity.kt          # Main entry point
│   │   ├── data/
│   │   │   ├── GameRepository.kt    # Local game storage
│   │   │   ├── Models.kt             # Game data models
│   │   ├── game/
│   │   │   ├── XiangqiEngine.kt     # Game logic and rules
│   │   ├── ui/
│   │   │   └── GameScreen.kt        # UI components
```

## Changes Made

### Removed Supabase Integration
- ❌ Removed `SupabaseClient.kt`
- ❌ Removed Supabase dependencies from `build.gradle`
- ❌ Removed Supabase URL/key from `BuildConfig`

### Added Local Storage
- ✅ Implemented `GameRepository` for in-memory game storage
- ✅ Updated `MainActivity.kt` to use local repository
- ✅ Game data now stored locally instead of in Supabase

### Fixed Issues
- ✅ Fixed board display rendering
- ✅ Fixed piece movement validation
- ✅ Fixed turn management
- ✅ Fixed check/checkmate detection

## How to Build

```bash
cd xiangqi-apk
./gradlew assembleDebug

# APK will be at: xiangqi-apk/app/build/outputs/apk/debug/app-debug.apk
```

## How to Push to GitHub

```bash
# Add remote (if not already added)
git remote add origin https://github.com/your-username/kotlin-xiangqi.git

# Commit changes
git add .
git commit -m "Remove Supabase, add local GameRepository"

# Push to GitHub
git push -u origin master
```

## Next Steps

1. Upload APK to GitHub Releases
2. Update GitHub Actions workflow
3. Add CI/CD pipeline for automated testing
4. Add multiplayer support
5. Add AI opponent

## License

MIT License - Free to use and modify
