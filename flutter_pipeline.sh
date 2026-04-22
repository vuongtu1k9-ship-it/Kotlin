#!/bin/bash
export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"
WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/flutter_pipeline.log"
INPUT_FILE="$WORKSPACE/INPUT.md"
SPEC_FILE="$WORKSPACE/SPEC.md"
OUTPUT_FILE="$WORKSPACE/OUTPUT.md"

log() {
  echo "[$(date +%Y-%m-%d %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

run_design_phase() {
  log "=== DESIGN PHASE ==="
  
  # Design agent reads INPUT.md, creates/updates SPEC.md
  log "Running Design Agent (agent)..."
  openclaw agent --agent agent --local --message "
    Đọc INPUT.md tại $INPUT_FILE
    Phân tích yêu cầu Flutter project
    Tạo/ cập nhật SPEC.md với:
    - Tên dự án
    - Danh sách tasks (checklist)
    - Progress status
    - Gửi SPEC.md lên Telegram
    
    Lưu vào: $SPEC_FILE
  " --timeout 120 2>&1 | tail -10 >> "$LOG_FILE"
  
  if [ ! -s "$SPEC_FILE" ]; then
    log "ERROR: SPEC.md không được tạo"
    return 1
  fi
  
  log "SPEC.md đã tạo/cập nhật"
  return 0
}

run_code_phase() {
  log "=== CODE PHASE ==="
  
  # Code agent reads SPEC.md, implements
  log "Running Code Agent (agent1)..."
  openclaw agent --agent agent1 --local --message "
    Đọc SPEC.md tại $SPEC_FILE
    Triển khai code Flutter dựa trên SPEC
    Workspace: $WORKSPACE/Flutter/
    Ghi kết quả vào $OUTPUT_FILE
    
    Nếu Flutter SDK ok: flutter pub get, build
    Nếu lỗi: ghi lỗi vào OUTPUT
  " --timeout 300 2>&1 | tail -10 >> "$LOG_FILE"
  
  log "Code phase hoàn tất"
}

run_test_phase() {
  log "=== TEST PHASE ==="
  
  # Test agent reads SPEC.md and OUTPUT.md, reports
  log "Running Test Agent (agent2)..."
  openclaw agent --agent agent2 --local --message "
    Đọc SPEC.md tại $SPEC_FILE
    Đọc OUTPUT.md từ Code Agent
    Kiểm tra Flutter build tại $WORKSPACE/Flutter/
    
    Báo cáo: PASS/FAIL
    Nếu FAIL: lý do + hướng khắc phục
    Gửi báo cáo lên Telegram
  " --timeout 120 2>&1 | tail -10 >> "$LOG_FILE"
  
  log "Test phase hoàn tất"
}

check_completion() {
  # Check if all tasks in SPEC.md are done
  # If all checked [x], clear SPEC content
  if grep -q "✅ All tasks completed" "$SPEC_FILE" 2>/dev/null; then
    log "All tasks completed! Clearing SPEC.md content..."
    echo "# SPEC.md - COMPLETED" > "$SPEC_FILE"
    echo "Timestamp: $(date)" >> "$SPEC_FILE"
    echo "" >> "$SPEC_FILE"
    echo "All tasks finished." >> "$SPEC_FILE"
    
    # Stop pipeline
    log "Pipeline finished. Exiting."
    exit 0
  fi
}

# Main cycle
log "Flutter Pipeline Started"

while true; do
  run_design_phase
  run_code_phase
  run_test_phase
  check_completion
  
  log "Cycle complete. Waiting 30s before next cycle..."
  sleep 30
done
