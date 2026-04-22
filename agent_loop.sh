#!/bin/bash
# Continuous Agent Loop v3 - Design Agent as Manager

LOOP_DIR="/root/.openclaw/workspace"
LOG_FILE="$LOOP_DIR/agent_loop.log"
INPUT_FILE="$LOOP_DIR/INPUT.md"
SPEC_FILE="$LOOP_DIR/SPEC.md"

log() {
    echo "[$(date +%Y-%m-%d %H:%M:%S)] $1" | tee -a "$LOG_FILE"
}

is_valid_input() {
    if [[ ! -s "$INPUT_FILE" ]]; then return 1; fi
    local content
    content=$(cat "$INPUT_FILE")
    if echo "$content" | grep -q "Project Name: \[TEN PROJECT\]"; then return 1; fi
    if [[ ${#content} -lt 200 ]]; then return 1; fi
    return 0
}

# Main loop
log "Agent Loop v3 Started (Design Agent Manager)"

while true; do
    if is_valid_input; then
        log "Valid input detected - Running Design Agent pipeline..."
        
        # Run Design Agent (which calls agent1 & agent2)
        /root/.openclaw/workspace/design_wrapper.sh >> "$LOG_FILE" 2>&1
        
        log "Pipeline cycle complete. Waiting for next input..."
    else
        log "Waiting for valid INPUT..."
    fi
    
    sleep 30
done
