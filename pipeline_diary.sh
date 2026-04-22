#!/bin/bash
# Main Pipeline: Design -> Code -> Test -> Diary

export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"

WS="/root/.openclaw/workspace"
DIARY="$WS/Diary.md"
LOG="$WS/pipeline.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

log() { echo "[$(date)] $*" | tee -a "$LOG"; }

# Ensure Diary exists
if [ ! -f "$DIARY" ]; then
  cat > "$DIARY" << "HEADER"
# AGENT DIARY - Flutter Xiangqi
# Unified: INPUT + SPEC + OUTPUT + Agent Logs
# Created: $TIMESTAMP
HEADER
fi

# Step 1: Design (agent)
log "=== DESIGN PHASE ==="
DESIGN_OUT=$("$WS/agent_wrapper.sh" agent "Doc INPUT.md va tao/update SPEC.md chi tiet" INFO)
echo "$DESIGN_OUT" > "$WS/SPEC.md"
echo "[INFO] $(date) - Design: SPEC.md updated" >> "$DIARY"

# Step 2: Code (agent1)  
log "=== CODE PHASE ==="
CODE_OUT=$("$WS/agent_wrapper.sh" agent1 "Doc SPEC.md, run flutter pub get, build, ghi OUTPUT.md" INFO)
echo "$CODE_OUT" > "$WS/OUTPUT.md"
echo "[INFO] $(date) - Code: OUTPUT.md written" >> "$DIARY"

# Step 3: Test (agent2)
log "=== TEST PHASE ==="
TEST_OUT=$("$WS/agent_wrapper.sh" agent2 "Doc SPEC.md va OUTPUT.md, bao cao PASS/FAIL" INFO)
echo "$TEST_OUT" >> "$DIARY"

log "=== CYCLE COMPLETE ==="
