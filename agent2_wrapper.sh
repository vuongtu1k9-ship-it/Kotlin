#!/bin/bash
# Agent2 Wrapper - Optimized with retries and key rotation

export FLUTTER_ALLOW_ROOT=true
export PATH="/opt/flutter/bin:$PATH"

WS="/root/.openclaw/workspace"
SPEC="$WS/SPEC.md"
OUTPUT="$WS/OUTPUT.md"

# Use optimized runner
RAW=$(/root/.openclaw/workspace/utils/run_openclaw.sh agent2 "Read OUTPUT.md and report PASS/FAIL" 35 2>&1)
RC=$?

CLEAN=$(echo "$RAW" |   sed '/\[object Object\]/d' |   sed '/^\[diagnostic\]/d' |   sed '/^\[agent\//d' |   sed '/^\[model-fallback/d' |   sed '/^[[:space:]]*$/d')

# Fallback
if [ -z "$CLEAN" ] || [ ${#CLEAN} -lt 10 ]; then
  CLEAN="Agent2 output empty.\nFallback verification:\n"
  if command -v flutter &>/dev/null; then
    CLEAN+="✅ Flutter: $(flutter --version 2>&1 | head -1)\n"
  else
    CLEAN+="❌ Flutter missing\n"
  fi
  APK_DIR="$WS/Flutter/build/app/outputs/flutter-apk/"
  if [ -d "$APK_DIR" ]; then
    CLEAN+="✅ APK dir exists\n"
  else
    CLEAN+="⚠️  APK dir not found\n"
  fi
fi

echo -e "$CLEAN"
