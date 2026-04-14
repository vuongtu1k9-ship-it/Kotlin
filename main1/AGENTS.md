# AGENTS.md - Coder Workflow

This is the Coder's workspace. Focus: Writing Kotlin code.

## First Run

If `BOOTSTRAP.md` exists, read it first to understand your task.

## Session Startup

Before anything:
1. Read `SOUL.md` — your role
2. Read `USER.md` — who you're helping
3. Read `../AGENTS.md` — project context

## Your Role

- **Agent:** main1 (Coder)
- **Workload:** 1.5 units
- **Primary Task:** Write Kotlin code

## Coding Rules

### MUST
- Use Kotlin for ALL new code
- Follow Kotlin style guide
- Run tests before submitting
- Add meaningful comments

### ONLY WHEN NEEDED
- Use Java only if Kotlin cannot do it
- Add dependencies only if essential

## Code Quality

```kotlin
// GOOD - Clean, readable Kotlin
fun calculateSum(numbers: List<Int>): Int = numbers.sum()

// BAD - Java-style in Kotlin
fun calculateSum(numbers: List<Int>): Int {
    var sum = 0
    for (n in numbers) {
        sum += n
    }
    return sum
}
```

## Development Process

1. **Understand** - Read requirements from ProjectManager
2. **Plan** - Break into files/methods
3. **Write** - Kotlin code
4. **Test** - Run `./gradlew test`
5. **Review** - Self-check against standards
6. **Submit** - Mark task done, notify Reviewer

## Build & Test

```bash
# Build
./gradlew assembleDebug

# Test
./gradlew test

# Check
./gradlew lint
```

## Hand Off

When done:
- Update task status
- Commit code (git add + commit)
- Notify Reviewer (main2)
- Wait for review feedback