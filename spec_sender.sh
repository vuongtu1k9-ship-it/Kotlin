#!/bin/bash
export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"
WORKSPACE="/root/.openclaw/workspace"
SPEC_FILE="$WORKSPACE/SPEC.md"

echo "Starting SPEC sender loop..."

while true; do
  if [ -s "$SPEC_FILE" ]; then
    echo "$(date): Sending SPEC to Telegram..."
    # Send SPEC.md content via agent
    CONTENT=$(cat "$SPEC_FILE")
    openclaw agent --agent agent --local --message "PHOTO SPEC.md:\n\n$CONTENT" --timeout 30 2>&1 | tail -5
  else
    echo "$(date): SPEC.md empty, skipping send"
  fi
  
  echo "Sleeping 5 minutes..."
  sleep 300
done
