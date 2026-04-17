# GitHub Actions Cleanup Guide

## 🗑️ Delete Workflow Runs

### 1. **Delete via CLI**
```bash
# Delete a single run
gh api -X DELETE "repos/{owner}/{repo}/actions/runs/{run_id}"

# Example
gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/24547349566"
```

### 2. **Delete Multiple Runs**
```bash
# Get all run IDs
gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq '.workflow_runs[].id'

# Delete all runs (example)
for run_id in $(gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq '.workflow_runs[].id'); do
  gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/$run_id"
  echo "Deleted run: $run_id"
done
```

### 3. **Delete via GitHub UI**
- Go to: [https://github.com/vuongtu1k9-ship-it/Kotlin/actions](https://github.com/vuongtu1k9-ship-it/Kotlin/actions)
- Click on a run
- Click **"Delete run"** (trash icon)

---

## 🔄 Re-run Workflows

### 1. **Re-run a Failed Workflow**
```bash
gh run rerun {run_id} --failed
```

### 2. **Re-run All Failed Jobs**
```bash
gh run rerun {run_id}
```

---

## 🛠️ Manage Workflows

### 1. **List All Workflows**
```bash
gh workflow list --repo vuongtu1k9-ship-it/Kotlin
```

### 2. **Delete a Workflow File**
```bash
# Delete via GitHub API
gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/contents/.github/workflows/{workflow_file}" \
  -f message="Remove workflow" \
  -f sha=$(gh api "repos/vuongtu1k9-ship-it/Kotlin/contents/.github/workflows/{workflow_file}" --jq '.sha')

# Example
gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/contents/.github/workflows/android.yml" \
  -f message="Remove duplicate workflow" \
  -f sha=$(gh api "repos/vuongtu1k9-ship-it/Kotlin/contents/.github/workflows/android.yml" --jq '.sha')
```

### 3. **Disable a Workflow**
```bash
gh workflow disable {workflow_id} --repo vuongtu1k9-ship-it/Kotlin
```

---

## 📌 Notes
- **CLI requires `gh` and `jq`** (install via `sudo apt install gh jq`).
- **GitHub UI** is the easiest for manual cleanup.
- **Delete runs before disabling workflows** to avoid clutter.
- **Re-run workflows** after fixing issues.