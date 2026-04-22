#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="/var/www/xiangqi-web"
RELEASES_DIR="$DEPLOY_ROOT/releases"
CURRENT_DIR="$DEPLOY_ROOT/current"
APP_NAME="xiangqi-web"
ECOSYSTEM_CONFIG="deploy/pm2/ecosystem.config.cjs"

log() { echo "[$(date +%H:%M:%S)] $*"; }
fail() { echo "❌ $*" >&2; exit 1; }

log "Checking for previous releases"
PREVIOUS_RELEASE=$(ls -1dt "$RELEASES_DIR"/* 2>/dev/null | head -n 2 | tail -n 1)

if [ -z "$PREVIOUS_RELEASE" ] || [ ! -d "$PREVIOUS_RELEASE" ]; then
  fail "No previous release found to rollback to."
fi

CURRENT_RELEASE=$(readlink -f "$CURRENT_DIR" || echo "none")
if [ "$PREVIOUS_RELEASE" == "$CURRENT_RELEASE" ]; then
  fail "Previous release is the same as current. Nothing to rollback."
fi

log "Rolling back to: $(basename "$PREVIOUS_RELEASE")"
ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_DIR"

log "Reloading PM2 process with previous code"
cd "$CURRENT_DIR"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$ECOSYSTEM_CONFIG" --env production --update-env
fi

log "✅ Rollback successful. Current release: $(basename "$PREVIOUS_RELEASE")" 
