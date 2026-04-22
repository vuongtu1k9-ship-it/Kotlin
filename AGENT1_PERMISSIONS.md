# 🛡️ Agent 1 (Coder) Permission & Capability Profile

## 1. GitHub Access (Infrastructure)
- **Protocol**: SSH (Secure Shell)
- **Authentication**: Using SSH key stored at `/root/.ssh/id_ed25519`.
- **Remote URL**: `git@github.com:vuongtu1k9-ship-it/Flutter.git`
- **Branch Permissions**:
    - Full Read/Write access to branch `cotuong`.
    - Permission to push commits, pull updates, and rebase.
- **Action**: Agent 1 is AUTHORIZED to perform `git add`, `git commit`, and `git push origin cotuong`.

## 2. File System Access (Workspace)
- **Root Directory**: `/root/.openclaw/workspace/Flutter`
- **Read/Write Permissions**: Full access to all files within the project directory.
- **Core Files Access**:
    - `INPUT.md`: Read-only (Requirement source).
    - `SPEC.md`: Read-only (Technical guidance).
    - `OUTPUT.md`: Read/Write (Progress reporting).
    - `Diary.md`: Read/Write (Logging events via Design Agent).

## 3. Tooling & Execution
- **Flutter SDK**: Authorized to run `flutter pub get` and other flutter commands (with `FLUTTER_ALLOW_ROOT=true`).
- **Git CLI**: Authorized to manage versions and push to GitHub.
- **Bash**: Authorized to run shell scripts for automation within the workspace.

## 4. Operational Constraints (The Laws)
- **No Local Build**: FORBIDDEN to build APK locally on the server (due to RAM limits). MUST rely on GitHub Actions.
- **Commit Standard**: MUST use the format `[Mode] Description` (e.g., `[God mode] Fix board rendering`).
- **Verification**: MUST NOT report `SUCCESS` in `OUTPUT.md` until the GitHub Action run for the pushed commit is marked as `completed success`.
- **Directory Structure**: MUST place code according to:
    - UI $\rightarrow$ `lib/views` or `lib/widgets`.
    - Logic $\rightarrow$ `lib/providers` or `lib/controllers`.
    - Models $\rightarrow$ `lib/models`.

## 5. Error Recovery Rights
- **Self-Healing**: Authorized to read GitHub Action logs $\rightarrow$ Fix code $\rightarrow$ Push again.
- **Retry Limit**: Maximum 3 attempts per task. If still failing, must log to `Diary.md` and escalate to Design Agent.

## 📜 Mandatory Git Audit Log
To prevent silent failures, Agent 1 MUST record every git command executed in the `OUTPUT.md` file using the following format:

```bash
[GIT COMMAND]: git add .
[GIT STATUS]: changes staged
[GIT COMMIT]: git commit -m "[God mode] ..."
[GIT PUSH]: git push origin cotuong
[GIT RESULT]: success/fail
```

If Agent 1 does not provide this audit log, the task will be marked as FAIL regardless of the status.
