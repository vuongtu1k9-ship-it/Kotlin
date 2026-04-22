#!/bin/bash
# Design Agent Wrapper - Integrated with Logging Hierarchy and Anti-Lying Verification

export MISTRAL_API_KEY=$(/root/.openclaw/workspace/utils/get_key.sh)
export TELEGRAM_BOT_TOKEN="8186873871:AAH5bIwORAuUliCpf7p6TQWQN6sCvNlez1w"

WS="/root/.openclaw/workspace"
DIARY="$WS/Diary.md"
SPEC="$WS/SPEC.md"
INPUT="$WS/INPUT.md"
OUTPUT="$WS/OUTPUT.md"
LOG_FILE="$WS/design_agent.log"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# Utility to map agent output to Diary levels
map_to_diary() {
    local agent_name="$1"
    local output="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M")
    
    if echo "$output" | grep -q "\[STATUS: CRITICAL\]" || echo "$output" | grep -q "\[LEVEL: 0\]"; then
        echo "[0] 🚨 Khẩn cấp [$timestamp] - $agent_name: $output" >> "$DIARY"
    elif echo "$output" | grep -q "\[STATUS: FAIL\]" || echo "$output" | grep -q "\[LEVEL: 3\]"; then
        echo "[3] ❌ Lỗi [$timestamp] - $agent_name: $output" >> "$DIARY"
    elif echo "$output" | grep -q "\[STATUS: SUCCESS\]" || echo "$output" | grep -q "\[LEVEL: 6\]"; then
        echo "[6] ℹ️ Thông tin [$timestamp] - $agent_//Agent name: $output" >> "$DIARY"
    else
        echo "[6] ℹ️ Thông tin [$timestamp] - $agent_name: $output" >> "$DIARY"
    fi
}

# Init Diary
if [ ! -f "$DIARY" ]; then
  cat > "$DIARY" << 'HEADER'
# AGENT DIARY - OpenClaw
# Manager: Design Agent
========================================
HEADER
  log "Diary created"
fi

# STEP 1: INPUT & SPEC
log "=== STEP 1: INPUT+SPEC ==="
if [ -s "$INPUT" ]; then
  log "INPUT updated"
  echo "# SPEC.md generated at $TIMESTAMP" > "$SPEC"
fi

# STEP 2: AGENT1 (Coder)
log "=== STEP 2: AGENT1 ==="
# Capture commit hash before running Agent 1
PRE_COMMIT=$(git -C "$WS/Flutter" rev-parse HEAD 2>/dev/null)

AGENT1_OUTPUT=$("$WS/agent1_wrapper.sh" agent1 2>&1)
AGENT1_RC=$?
echo "$AGENT1_OUTPUT" > "$OUTPUT"

# ANTI-LYING VERIFICATION
POST_COMMIT=$(git -C "$WS/Flutter" rev-parse HEAD 2>/dev/null)

if [ "$PRE_COMMIT" == "$POST_COMMIT" ]; then
    if echo "$AGENT1_OUTPUT" | grep -qi "SUCCESS\|PASS\|Completed"; then
        log "🚨 ALERT: Agent 1 reported success but NO commit was made!"
        echo "[2] 🔴 Quan trọng [$(date '+%Y-%m-%d %H:%M')] - Agent 1: Lying detected! Reported success but no code changes pushed." >> "$DIARY"
        AGENT1_RC=1 # Force failure
    fi
fi

map_to_diary "Agent1" "$AGENT1_OUTPUT"
log "Agent1 finished (RC=$AGENT1_RC)"

# STEP 3: AGENT2 (Tester)
log "=== STEP 3: AGENT2 ==="
AGENT2_OUTPUT=$("$WS/agent2_wrapper.sh" agent2 2>&1)
AGENT2_RC=$?
map_to_diary "Agent2" "$AGENT2_OUTPUT"
log "Agent2 finished (RC=$AGENT2_RC)"

# STEP 4: CHECK COMPLETION
if echo "$AGENT2_OUTPUT" | grep -qi "PASS"; then
  echo "[0] 🚨 Khẩn cấp [$TIMESTAMP] - PROJECT COMPLETE" >> "$DIARY"
  log "PROJECT COMPLETE"
fi

# STEP 5: Telegram
LAST=$(tail -20 "$DIARY")
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"   -d "chat_id=-1003647318348"   -d "text=📋 *Diary Update* \n\n$LAST"   -d "parse_mode=Markdown" > /dev/null 2>&1

log "=== DESIGN CYCLE DONE ==="
