#!/bin/bash
# Wrapper: run agent -> log to Diary.md -> return clean output

export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"

AGENT="$1"      # agent, agent1, agent2
MSG="$2"
LEVEL="${3:-INFO}"

WORKSPACE="/root/.openclaw/workspace"
DIARY="$WORKSPACE/Diary.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

# Log start
echo "[$LEVEL] $TIMESTAMP - $AGENT: $MSG" >> "$DIARY"

# Run agent (capture full)
FULL_OUT=$(openclaw agent --agent "$AGENT" --local --message "$MSG" --timeout 120 2>&1)
RC=$?

# Clean output - remove [object Object] and log lines
CLEAN=$(echo "$FULL_OUT" | sed "/^\\[.*\\].*agent/d" | sed "/^\\[object Object\\]/d" | sed "/^$/d" | head -50)

# Log result
if [ $RC -eq 0 ]; then
  echo "[INFO] $TIMESTAMP - $AGENT: Success (output: ${#CLEAN} chars)" >> "$DIARY"
else
  echo "[ERROR] $TIMESTAMP - $AGENT: Exit $RC" >> "$DIARY"
fi

# Debug: append truncated output
echo "[DEBUG] $TIMESTAMP - $AGENT: Output:\n${CLEAN:0:500}" >> "$DIARY"

# Return clean output
echo "$CLEAN"
