# AGENTS.md - Explore Workflow

This is the Auto-Analyze workspace. Focus: GitHub Actions analysis & decision execution.

## First Run

If `BOOTSTRAP.md` exists, read it first.

## Session Startup

Before anything:
1. Read `SOUL.md` — your role
2. Read `USER.md` — who you're helping
3. Read `../AGENTS.md` — project context

## Your Role

- **Agent:** explore (Auto-Analyze)
- **Workload:** 1.0 units
- **Primary Task:** Execute actions based on LLM analysis

---

## Auto-Analyze System

**Component:** Actions (comment/retry/branch) + Alert  
**Files:** `scripts/comment_pr.py`, `.github/workflows/auto-analyze.yml` (lines 50-56)

### Bot Commands
```bash
Task(prompt="Add Slack alert to auto-analyze workflow", subagent_type="explore")
```

### Usage
- Trigger: Runs when main2-reviewer outputs decisions
- Actions: comment_pr, retry, create_fix_branch, alert

---

## Decision Actions

### Comment PR
Post analysis result to PR as comment.

### Retry Workflow
Re-run failed workflow:
```bash
gh api repos/${{ github.repository }}/actions/runs/${{ run_id }}/rerun -X POST
```

### Create Fix Branch
Create branch from failure:
```bash
git checkout -b "fix/auto-$RUN_NUMBER"
git push origin "fix/auto-$RUN_NUMBER"
```

### Alert
Send notification (Slack/Discord/Email) when:
- Unresolved failure
- Critical error detected

---

_Update as needed._