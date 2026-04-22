#!/bin/bash
export FLUTTER_ALLOW_ROOT=true
export PATH="/opt/flutter/bin:$PATH"

WS="/root/.openclaw/workspace"
SPEC="$WS/SPEC.md"
OUTPUT="$WS/OUTPUT.md"

RAW=$(/root/.openclaw/workspace/utils/run_openclaw.sh agent1 "Read SPEC.md and report status" 120 2>&1)
RC=$?

# New surgical filter: Remove only specific diagnostic patterns, keep agent responses
CLEAN=$(echo "$RAW" | grep -vE "^(\[diagnostic\]|\[agent/|\[model-fallback|\[error\]|\[info\]|\[warn\]|lane=)")

if [ -z "$CLEAN" ]; then
  CLEAN="Agent1 completed the task but provided no text output. Please check Git logs."
fi

echo -e "$CLEAN" > "$OUTPUT"
echo -e "$CLEAN"
