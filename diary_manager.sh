#!/bin/bash
# Design Agent - Diary Manager

export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"
export TELEGRAM_BOT_TOKEN="8186873871:AAH5bIwORAuUliCpf7p6TQWQN6sCvNlez1w"

WS="/root/.openclaw/workspace"
DIARY="$WS/Diary.md"
SPEC="$WS/SPEC.md"
INPUT="$WS/INPUT.md"
OUTPUT="$WS/OUTPUT.md"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M")

# Init Diary if missing
if [ ! -f "$DIARY" ]; then
  cat > "$DIARY" << HEADER
# AGENT DIARY - Flutter Xiangqi
# Managed by Design Agent
# Created: $TIMESTAMP

========================================
📋 INPUT.md
========================================
HEADER
fi

# 1. Update INPUT section
if [ -s "$INPUT" ]; then
  INPUT_CONTENT=$(head -20 "$INPUT" | sed 's/^/  /')
  if grep -q "📋 INPUT.md" "$DIARY"; then
    sed -i "/📋 INPUT.md/,/^=/c\\📋 INPUT.md\n========================================\n$INPUT_CONTENT" "$DIARY"
  else
    sed -i "1i\\n========================================\n📋 INPUT.md\n========================================\n$INPUT_CONTENT" "$DIARY"
  fi
  echo "[INFO] $TIMESTAMP - Design: INPUT updated" >> "$DIARY"
fi

# 2. Update SPEC section
if [ -s "$SPEC" ]; then
  SPEC_CONTENT=$(head -60 "$SPEC" | sed 's/^/  /')
  if grep -q "📐 SPEC.md" "$DIARY"; then
    sed -i "/📐 SPEC.md/,/^=/c\\📐 SPEC.md\n========================================\n$SPEC_CONTENT" "$DIARY"
  else
    echo "" >> "$DIARY"
    echo "========================================" >> "$DIARY"
    echo "📐 SPEC.md" >> "$DIARY"
    echo "========================================" >> "$DIARY"
    echo "$SPEC_CONTENT" >> "$DIARY"
  fi
  echo "[INFO] $TIMESTAMP - Design: SPEC updated" >> "$DIARY"
fi

# 3. Run Code Agent
echo "[INFO] $TIMESTAMP - Design: Starting Code Agent..." >> "$DIARY"
CODE_OUT=$(timeout 90 openclaw agent --agent agent1 --local --message "Read SPEC.md, implement P0, write OUTPUT.md" --timeout 70 2>&1)
CODE_RC=$?
CODE_CLEAN=$(echo "$CODE_OUT" | grep -v '^\[.*\]' | grep -v '^$' | head -50)

if [ $CODE_RC -eq 0 ]; then
  echo "[INFO] $TIMESTAMP - agent1: Code phase success" >> "$DIARY"
else
  echo "[ERROR] $TIMESTAMP - agent1: Exit $CODE_RC" >> "$DIARY"
fi

# Save and update OUTPUT section
echo "$CODE_CLEAN" > "$OUTPUT"
if grep -q "📊 OUTPUT.md" "$DIARY"; then
  sed -i "/📊 OUTPUT.md/,/^=/c\\📊 OUTPUT.md\n========================================\n$(echo "$CODE_CLEAN" | head -80 | sed 's/^/  /')" "$DIARY"
else
  echo "" >> "$DIARY"
  echo "========================================" >> "$DIARY"
  echo "📊 OUTPUT.md (agent1)" >> "$DIARY"
  echo "========================================" >> "$DIARY"
  echo "$CODE_CLEAN" | head -80 >> "$DIARY"
fi

# 4. Run Test Agent
echo "[INFO] $TIMESTAMP - Design: Starting Test Agent..." >> "$DIARY"
TEST_OUT=$(timeout 45 openclaw agent --agent agent2 --local --message "Check build status from OUTPUT.md" --timeout 30 2>&1)
TEST_CLEAN=$(echo "$TEST_OUT" | grep -v '^\[.*\]' | grep -v '^$' | head -30)

# Append test result
echo "" >> "$DIARY"
echo "========================================" >> "$DIARY"
echo "✅ TEST RESULT - $(date '+%Y-%m-%d %H:%M')" >> "$DIARY"
echo "========================================" >> "$DIARY"
echo "$TEST_CLEAN" >> "$DIARY"

# 5. Check completion
if echo "$CODE_CLEAN" | grep -qi "completed\|all tasks"; then
  echo "[CRITICAL] $TIMESTAMP - Design: PROJECT COMPLETE - Clearing SPEC" >> "$DIARY"
  echo "# SPEC.md - COMPLETED $(date)" > "$SPEC"
fi

# 6. Telegram report (last 30 lines)
TELEGRAM_MSG="📋 *Diary Update* $(date '+%H:%M')\n\n$(tail -30 "$DIARY" | head -20 | sed 's/_/\\_/g; s/*/\\*/g; s/`/\\`/g')"
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=-1003647318348" \
  -d "text=${TELEGRAM_MSG}" \
  -d "parse_mode=MarkdownV2" > /dev/null 2>&1

echo "[INFO] $TIMESTAMP - Design: Telegram sent" >> "$DIARY"
echo "=== Diary Manager Cycle: DONE ==="
