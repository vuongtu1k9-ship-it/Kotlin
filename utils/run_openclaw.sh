#!/bin/bash
# Wrapper to run openclaw with retries, backoff, and key rotation

# Args: agent_id, message, timeout
AGENT_ID=$1
MESSAGE=$2
TIMEOUT=$3

MAX_RETRIES=3
BACKOFF=(2 5 10)

for (( i=0; i<=${MAX_RETRIES}; i++ )); do
    # 1. Key Rotation
    export MISTRAL_API_KEY=$(/root/.openclaw/workspace/utils/get_key.sh)
    
    # 2. Random Delay (0.5s to 2s)
    # Use double quotes for the format string in printf
    DELAY=$(awk 'BEGIN {srand(); printf "%.2f", 0.5 + rand() * 1.5}')
    sleep $DELAY
    
    # 3. Execute
    RAW=$(timeout $TIMEOUT /usr/bin/openclaw agent --agent "$AGENT_ID" --local --message "$MESSAGE" --timeout $TIMEOUT 2>&1)
    RC=$?
    
    # 4. Check for Rate Limit (429 or specific string)
    if echo "$RAW" | grep -qiE "rate limit|Too Many Requests|429"; then
        if [ $i -lt ${MAX_RETRIES} ]; then
            SLEEP_TIME=${BACKOFF[$i]}
            echo "[WARN] Rate limit hit. Retrying in ${SLEEP_TIME}s... (Attempt $((i+1))/${MAX_RETRIES})" >&2
            sleep $SLEEP_TIME
            continue
        fi
    fi
    
    echo "$RAW"
    exit $RC
done
