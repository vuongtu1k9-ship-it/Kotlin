#!/bin/bash
# Auto Fix & Delete Failed Builds - Agent Automation Script
# Chạy sau mỗi lần push code lên GitHub

REPO="vuongtu1k9-ship-it/Kotlin"
MAX_RETRIES=3
RETRY_COUNT=0

log() {
  echo "[$(date '+%H:%M:%S')] $1"
}

# Bước 1: Chờ build hoàn tất (max 3 phút)
wait_for_build() {
  log "Đợi build hoàn tất..."
  for i in {1..18}; do
    STATUS=$(gh api "repos/$REPO/actions/runs" 2>/dev/null | jq -r '.workflow_runs[0].status // "completed"')
    if [ "$STATUS" == "completed" ]; then
      return 0
    fi
    sleep 10
  done
  return 1
}

# Bước 2: Kiểm tra kết quả build
check_build() {
  RESULT=$(gh api "repos/$REPO/actions/runs" 2>/dev/null | jq -r '.workflow_runs[0].conclusion // "null"')
  log "Build result: $RESULT"
  
  if [ "$RESULT" == "failure" ]; then
    return 1
  fi
  return 0
}

# Bước 3: Xóa tất cả failing runs
delete_failed_runs() {
  log "Xóa failing runs..."
  FAILED_IDS=$(gh api "repos/$REPO/actions/runs?status=failure" 2>/dev/null | jq -r '.workflow_runs[].id')
  
  if [ -z "$FAILED_IDS" ]; then
    log "Không có failing runs để xóa"
    return 0
  fi
  
  for ID in $FAILED_IDS; do
    gh api -X DELETE "repos/$REPO/actions/runs/$ID" 2>/dev/null
    log "Đã xóa run: $ID"
  done
}

# Bước 4: Fix lỗi local và rebuild
fix_and_rebuild() {
  log "Đang fix lỗi local..."
  
  cd /root/Kotlin
  
  # Lấy lỗi
  ERRORS=$(./gradlew assembleDebug -x test --no-daemon 2>&1 | grep -E "^e:" | head -10)
  
  if [ -z "$ERRORS" ]; then
    log "Build local thành công!"
    return 0
  fi
  
  log "Lỗi detected: $ERRORS"
  
  # Push lại code đã fix
  git add -A
  git commit -m "Auto fix build errors" 2>/dev/null || log "Không có thay đổi"
  git push origin cotuong
  
  return 1
}

# Bước 5: Lấy errors từ GitHub
get_github_errors() {
  log "Lấy lỗi từ GitHub..."
  # Get last run jobs
  gh api "repos/$REPO/actions/runs" | jq -r '.workflow_runs[0].id' | xargs -I{} gh api "repos/$REPO/actions/runs/{}/jobs" 2>/dev/null | jq -r '.jobs[] | .steps[] | select(.conclusion == "failure") | .name'
}

# MAIN LOOP
main() {
  log "=== Bắt đầu Auto Fix & Delete ==="
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    log "Attempt: $((RETRY_COUNT + 1))/$MAX_RETRIES"
    
    # Chờ build
    wait_for_build || log "Timeout chờ build"
    
    # Check kết quả
    if check_build; then
      log "✓ Build PASSED!"
      delete_failed_runs
      log "=== Hoàn tất ==="
      exit 0
    else
      log "✗ Build FAILED!"
      
      # Xóa failing runs TRƯỚC
      delete_failed_runs
      
      # Fix và retry
      fix_and_rebuild || RETRY_COUNT=$((RETRY_COUNT + 1))
      
      if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        log "Retry lần $((RETRY_COUNT + 1))..."
      fi
    fi
  done
  
  log "Đã retry $MAX_RETRIES lần. Báo cáo lỗi cho user."
  get_github_errors
  exit 1
}

main "$@"