#!/bin/bash
# Read-Only wrapper for agent1/agent2 - chặn mọi attempt ghi Diary.md

export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"
export BLOCK_DIARY_WRITE=1  # Flag để agent biết cấm ghi

AGENT="$1"
MSG="$2"

# Run agent normally - it will see BLOCK_DIARY_WRITE=1
openclaw agent --agent "$AGENT" --local --message "$MSG" --timeout 120 2>&1
