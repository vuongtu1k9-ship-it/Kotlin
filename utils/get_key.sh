#!/bin/bash
KEY_FILE="/root/.openclaw/workspace/.api_keys"
INDEX_FILE="/tmp/openclaw_key_index"

if [ ! -f "$INDEX_FILE" ]; then
    echo 0 > "$INDEX_FILE"
fi

INDEX=$(cat "$INDEX_FILE")
KEYS=($(cat "$KEY_FILE"))
NUM_KEYS=${#KEYS[@]}

KEY=${KEYS[$INDEX]}
NEXT_INDEX=$(( (INDEX + 1) % NUM_KEYS ))
echo $NEXT_INDEX > "$INDEX_FILE"

echo "$KEY"
