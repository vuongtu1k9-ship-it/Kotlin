#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-xiangqi-web}"
# Target Server: 192.168.80.139
DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/xiangqi-web}"
RELEASES_DIR="$DEPLOY_ROOT/releases"
SHARED_DIR="$DEPLOY_ROOT/shared"
CURRENT_DIR="$DEPLOY_ROOT/current"
RELEASE_NAME="${RELEASE_NAME:-$(date +%Y%m%d_%H%M%S)}"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_NAME"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
WORKSPACE="${GITHUB_WORKSPACE:-$(pwd)}"
ECOSYSTEM_CONFIG="deploy/pm2/ecosystem.config.cjs"
HEALTH_URL_LOCAL="${HEALTH_URL_LOCAL:-http://127.0.0.1:3001/health}"
HEALTH_URL_EDGE="${HEALTH_URL_EDGE:-http://127.0.0.1/health}"
EDGE_HEALTH_HOST="${EDGE_HEALTH_HOST:-cotuong.xyz}"

log() { echo "[$(date +%H:%M:%S)] $*"; }
fail() { echo "❌ $*" >&2; exit 1; }

[ -d "$WORKSPACE" ] || fail "Workspace not found: $WORKSPACE"
command -v rsync >/dev/null 2>&1 || fail "rsync is required on the deployment target"
command -v pm2 >/dev/null 2>&1 || fail "pm2 is required on the deployment target"
command -v npm >/dev/null 2>&1 || fail "npm is required on the deployment target"
command -v curl >/dev/null 2>&1 || fail "curl is required on the deployment target"
command -v sudo >/dev/null 2>&1 || log "WARN: sudo not found, may have issues killing port"

log "Preparing persistent data structure at /data/xiangqi"
if [ ! -d "/data/xiangqi" ]; then
  log "Attempting to create /data/xiangqi using sudo..."
  sudo mkdir -p /data/xiangqi || log "WARN: Failed to create /data/xiangqi. Using fallback."
  sudo chown -R $(whoami):$(whoami) /data/xiangqi 2>/dev/null || true
fi

# Initialize sub-structure (works if /data/xiangqi was created or falls back to local data/)
DATA_DIR="/data/xiangqi"
[ -d "$DATA_DIR" ] && [ -w "$DATA_DIR" ] || DATA_DIR="$SHARED_DIR/data"

mkdir -p "$DATA_DIR/avatars" "$DATA_DIR/uploads" "$DATA_DIR/uploads/puzzles" "$DATA_DIR/uploads/videos"
ln -sfn puzzles "$DATA_DIR/uploads/co-the"
mkdir -p "$RELEASES_DIR" "$SHARED_DIR" "$SHARED_DIR/logs"
if [ ! -f "$SHARED_DIR/.env" ]; then
  fail "Missing shared env file: $SHARED_DIR/.env. Please create it on the server using the instructions in docs/DEPLOYMENT.md"
fi

log "Creating release: $RELEASE_NAME"
mkdir -p "$RELEASE_DIR"

log "Syncing workspace to release directory"
rsync -a --delete \
  --exclude '.git' \
  --exclude '.github' \
  --exclude '.openclaw' \
  --exclude 'coverage' \
  --exclude 'next/.next' \
  --exclude 'releases' \
  --exclude 'shared' \
  --exclude 'current' \
  --exclude 'node_modules' \
  --exclude 'uploads' \
  --exclude 'data' \
  "$WORKSPACE/" "$RELEASE_DIR/"

log "Linking shared runtime assets"
ln -sfn "$SHARED_DIR/.env" "$RELEASE_DIR/.env"
rm -rf "$RELEASE_DIR/uploads" "$RELEASE_DIR/data"
ln -sfn "$DATA_DIR/uploads" "$RELEASE_DIR/uploads"
ln -sfn "$DATA_DIR" "$RELEASE_DIR/data"
for f in vapid.txt env_secret.txt pikafish.nnue; do
  if [ -f "$SHARED_DIR/$f" ]; then
    ln -sfn "$SHARED_DIR/$f" "$RELEASE_DIR/$f"
  fi
done

log "Linking shared secrets"
mkdir -p "$SHARED_DIR/config/secrets"
mkdir -p "$RELEASE_DIR/config"
ln -sfn "$SHARED_DIR/config/secrets" "$RELEASE_DIR/config/secrets"

log "Installing dependencies and building in release directory"
cd "$RELEASE_DIR"

# SPEED OPTIMIZATION: Reuse node_modules from previous release if available
if [ -d "$CURRENT_DIR/node_modules" ]; then
  log "Reusing node_modules from current release to speed up npm install"
  cp -rp "$CURRENT_DIR/node_modules" "$RELEASE_DIR/"
  npm install --include=dev --no-audit --prefer-offline
else
  log "No existing node_modules found. Performing fresh npm ci."
  npm ci --include=dev
fi

export BUILD_NAME="$RELEASE_NAME"
npm run build

log "Linking dist assets to persistent storage"
mkdir -p "$RELEASE_DIR/dist"
ln -sfn "$DATA_DIR/uploads" "$RELEASE_DIR/dist/uploads"

log "Atomic symlink swap"
ln -sfn "$RELEASE_DIR" "$CURRENT_DIR"

log "Updating Nginx configuration"
NGINX_CONF_FILE="${NGINX_CONF_FILE:-xiangqi-web.conf}"
NGINX_CONF_SRC="$RELEASE_DIR/deploy/nginx/$NGINX_CONF_FILE"
NGINX_CONF_DEST="/etc/nginx/sites-available/$APP_NAME"
if [ -f "$NGINX_CONF_SRC" ]; then
  sudo cp "$NGINX_CONF_SRC" "$NGINX_CONF_DEST"
  sudo ln -sf "$NGINX_CONF_DEST" "/etc/nginx/sites-enabled/$APP_NAME"
  # Remove default if exists
  sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  
  if sudo nginx -t; then
    log "Nginx configuration is valid, reloading..."
    sudo systemctl reload nginx || sudo service nginx reload
  else
    log "WARN: Nginx configuration is invalid, skipping reload."
  fi
else
  log "WARN: Nginx configuration file not found at $NGINX_CONF_SRC"
fi

log "Ensuring no previous UI tests are running"
# Kill scripts/test-all-ui.sh if it's running in background
pkill -f "scripts/test-all-ui.sh" || true
# Kill any standalone run_log_current.txt generators if any
pkill -f "run_log" || true

log "Ensuring PM2 is managing the correct version (SUDO kill + PM2 Clean)"
# Kill anything on the port first
sudo fuser -k 3001/tcp 2>/dev/null || true
sleep 2

# Try to stop and delete the app from both current user and sudo pm2
pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
sudo pm2 delete "$APP_NAME" >/dev/null 2>&1 || true

log "Starting new PM2 process"
# Explicitly export BUILD_NAME to ensure PM2 picks it up
export BUILD_NAME="$RELEASE_NAME"
pm2 start "$ECOSYSTEM_CONFIG" --only "$APP_NAME" --env production --update-env
pm2 save >/dev/null 2>&1 || true

log "Attempting to purge Varnish cache (if present)"
sudo varnishadm "ban req.url ~ ." >/dev/null 2>&1 || log "WARN: varnishadm not found or failed, skipping cache purge."

log "Running health checks"
OK=0
for i in {1..60}; do
  LOCAL_HEALTH=$(curl -fsS --connect-timeout 5 "$HEALTH_URL_LOCAL" 2>/dev/null || true)
  EDGE_HEALTH=$(curl -fsS --connect-timeout 5 -H "Host: ${EDGE_HEALTH_HOST}" "$HEALTH_URL_EDGE" 2>/dev/null || true)
  
  if [ -z "$LOCAL_HEALTH" ]; then
    if [ "$i" -eq 1 ] || [ $((i % 5)) -eq 0 ]; then
      log "[$i/60] Local health check empty. Wait..."
    fi
  elif [ -z "$EDGE_HEALTH" ]; then
    if [ "$i" -eq 1 ] || [ $((i % 5)) -eq 0 ]; then
      log "[$i/60] Edge health check empty (Host: $EDGE_HEALTH_HOST). Wait..."
    fi
  else
    # Improved version parsing (handles JSON quotes)
    FOUND_VERSION=$(echo "$LOCAL_HEALTH" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || true)
    
    if [ "$FOUND_VERSION" = "$RELEASE_NAME" ]; then
      log "Health checks passed and version verified: $RELEASE_NAME"
      OK=1
      break
    else
      if [ "$i" -eq 1 ] || [ $((i % 5)) -eq 0 ]; then
        log "[$i/60] Health check passed but version MISMATCH (found: '$FOUND_VERSION', expected: '$RELEASE_NAME'). Wait..."
      fi
    fi
  fi
  sleep 1
done

if [ "$OK" -eq 0 ]; then
    log "❌ Health checks failed. Diagnostics:"
    log "PM2 Status (Summary):"
    pm2 status "$APP_NAME" --no-colors || true
    
    log "Detailed PM2 Info:"
    pm2 show "$APP_NAME" --no-colors || true
    
    log "Recent Application Logs (PM2 stream):"
    pm2 logs "$APP_NAME" --lines 100 --nostream || true
    
    # Try to find the log files from pm2 show and tail them if possible
    OUT_LOG=$(pm2 show "$APP_NAME" | grep "out log path" | awk '{print $NF}' || echo "")
    ERR_LOG=$(pm2 show "$APP_NAME" | grep "error log path" | awk '{print $NF}' || echo "")
    
    if [ -f "$OUT_LOG" ]; then
       log "Direct tail of OUT log ($OUT_LOG):"
       tail -n 50 "$OUT_LOG" 2>/dev/null || true
    fi
    if [ -f "$ERR_LOG" ]; then
       log "Direct tail of ERR log ($ERR_LOG):"
       tail -n 50 "$ERR_LOG" 2>/dev/null || true
    fi
    
    fail "Deployment verification failed after 40s."
fi

log "🔍 Running Quality Gate verification..."
TEST_MODE="${TEST_MODE:-quick}"
# Pass the base URL and Host header to verify-deploy.mjs
# verify-deploy.mjs will handle the /health suffix and ignore SSL errors for local IP
if ! node scripts/verify-deploy.mjs --url="$HEALTH_URL_EDGE" --host="$EDGE_HEALTH_HOST" --mode="$TEST_MODE"; then
    log "❌ Quality Gate failed. Monitoring logs for diagnostics..."
    pm2 logs "$APP_NAME" --lines 50 --nostream || true
    fail "Quality Gate failed on Production environment (Mode: $TEST_MODE)."
fi

log "Cleaning old releases (keep last $KEEP_RELEASES)"
if [ -d "$RELEASES_DIR" ]; then
  ls -1dt "$RELEASES_DIR"/* 2>/dev/null | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf
fi

log "Deployment successful: $RELEASE_NAME"
