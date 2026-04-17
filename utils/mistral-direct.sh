#!/bin/bash
# Mistral Direct API - bypass OpenClaw formatter
# Usage: ./mistral-direct.sh "prompt"

MISTRAL_API_KEY="${MISTRAL_API_KEY:-${MISTRAL_API_KEY_2}}"
MODEL="${MODEL:-mistral-small-latest}"

if [ -z "$1" ]; then
  echo "Usage: $0 \"prompt\""
  exit 1
fi

RESPONSE=$(curl -s -X POST "https://api.mistral.ai/v1/chat/completions" \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$1\"}]}")

echo "$RESPONSE" | grep -o '"content":"[^"]*' | sed 's/"content":"//' | head -1