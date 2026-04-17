# SPEC.md - Task Specification

## Task Overview
**Yêu cầu**: Xóa 3 failing GitHub Actions runs và auto fix build cho repo `vuongtu1k9-ship-it/Kotlin`.

## Repository
- **Repo**: `vuongtu1k9-ship-it/Kotlin`
- **Branch**: `main`

## Steps
### 1. Check Failing Runs
- Lệnh:
  ```bash
  gh api "repos/vuongtu1k9-ship-it/Kotlin/actions/runs" | jq '.workflow_runs[0:3] | .[] | {id, conclusion, display_title}'
  ```
- Mục tiêu: Lấy **3 runs mới nhất** có `conclusion = "failure"`.

### 2. Delete Failing Runs
- Lệnh:
  ```bash
  gh api -X DELETE "repos/vuongtu1k9-ship-it/Kotlin/actions/runs/[ID]"
  ```
- Mục tiêu: Xóa **3 runs** có `conclusion = "failure"`.

### 3. Auto Fix Build
- Lệnh:
  ```bash
  /root/.openclaw/workspace/utils/auto_fix_build.sh
  ```
- Mục tiêu: Chạy script để **fix build** (tối đa 3 lần retry).

## Output Requirements
- **JSON output**:
  ```json
  {
    "deleted_runs": ["id1", "id2", "id3"],
    "auto_fix_status": "success|failed",
    "retry_count": <số lần retry>,
    "error": "nếu có"
  }
  ```

## Notes
- Nếu không có failing runs → báo `"deleted_runs": []`.
- Nếu auto fix thất bại → báo `"auto_fix_status": "failed"` và `"error"`.

---
**Agent**: agent1 (Code)
**Next Step**: Thực hiện các lệnh trên và trả về JSON output.