#!/bin/bash
# Manual Pipeline Runner - Direct agent execution

WORKSPACE="/root/.openclaw/workspace"
LOG_FILE="$WORKSPACE/pipeline.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

cd "$WORKSPACE"

log "=== STARTING MANUAL PIPELINE ==="

# Step 1: Design - Create SPEC
log "Step 1: Design Agent - Creating SPEC..."
cat > SPEC.md << 'EOF'
# SPEC.md - Flutter Xiangqi App

## Project: Flutter Xiangqi (Cờ Tướng)

## Source Code:
- Android: /root/.openclaw/workspace/xiangqi-android/
- Web: /root/.openclaw/workspace/xiangqi-web-main/

## Tasks:
1. Copy game logic from xiangqi-android (engine, model)
2. Copy UI from xiangqi-web-main (board, pieces)
3. Convert to Flutter + Dart
4. Push to GitHub repo vuongtu1k9-ship-it/Flutter
5. Create GitHub Actions for build

## Implementation:
### Step 1: Analyze source code
- Read Board.kt, Piece.kt, Game.kt from xiangqi-android
- Read board.tsx, piece.tsx from web

### Step 2: Create Flutter structure
lib/
├── main.dart
├── models/
│   ├── board.dart
│   ├── piece.dart
│   └── game.dart
├── ai/
│   └── engine.dart
├── widgets/
│   ├── chess_board.dart
│   └── piece_widget.dart
└── utils/
    └── fen_pgn.dart

### Step 3: Convert Kotlin/TS to Dart
### Step 4: Push to GitHub
### Step 5: GitHub Actions build

## Priority: P0
EOF
log "SPEC.md created"

# Step 2: Code - Implement
log "Step 2: Code Agent - Running..."
# Use agent1 with --local to avoid gateway
openclaw agent --agent agent1 --local --message "Create Flutter xiangqi app. Read SPEC.md. Create lib/models/board.dart with Board class, lib/models/piece.dart with Piece class. Copy logic from xiangqi-android. Write to /root/.openclaw/workspace/Flutter/" --timeout 300 2>&1 | tail -20 >> "$LOG_FILE"

log "Step 2 complete"

# Step 3: Test - Verify  
log "Step 3: Test Agent - Running..."
openclaw agent --agent agent2 --local --message "Check if Flutter project at /root/.openclaw/workspace/Flutter/lib/ has models. Report status." --timeout 60 2>&1 | tail -10 >> "$LOG_FILE"

log "=== PIPELINE COMPLETE ==="