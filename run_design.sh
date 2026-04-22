#!/bin/bash
export MISTRAL_API_KEY="TcXMHr0QtY0AIZv2Wrp4sxsuLnIxMzHy"
WORKSPACE="/root/.openclaw/workspace"
SPEC_FILE="$WORKSPACE/SPEC.md"

INPUT_CONTENT=$(cat "$WORKSPACE/INPUT.md" 2>/dev/null || echo "No input")

MESSAGE="Doc INPUT.md va tao SPEC.md chi tiet. Luu vao $SPEC_FILE. Tasks checklist, progress, next steps."

OUTPUT=$(openclaw agent --agent agent --local --message "$MESSAGE" --timeout 60 2>&1)

# Extract markdown block
SPEC_CONTENT=$(echo "$OUTPUT" | sed -n '/```markdown/,/```/p' | grep -v '```')

if [ -z "$SPEC_CONTENT" ]; then
  SPEC_CONTENT=$(echo "$OUTPUT" | sed -n '/# SPEC.md/,/^$/p' | head -80)
fi

if [ -n "$SPEC_CONTENT" ]; then
  echo "$SPEC_CONTENT" > "$SPEC_FILE"
else
  echo "# SPEC.md - Flutter Xiangqi" > "$SPEC_FILE"
  echo "" >> "$SPEC_FILE"
  echo "**Status**: Pending design..." >> "$SPEC_FILE"
  echo "" >> "$SPEC_FILE"
  date >> "$SPEC_FILE"
fi

echo "SPEC.md created: $(wc -l < "$SPEC_FILE") lines"
head -30 "$SPEC_FILE"
