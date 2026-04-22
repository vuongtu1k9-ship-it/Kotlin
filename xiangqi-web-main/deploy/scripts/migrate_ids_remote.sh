#!/bin/bash
# Exit on error
set -e

HOST=${1:-192.168.1.23}
USER=${2:-root}
PROJECT_DIR="/var/www/xiangqi-web"

echo "--------------------------------------------------"
echo "🚀 Migrating IDs on ${USER}@${HOST}"
echo "--------------------------------------------------"

ssh -t ${USER}@${HOST} << EOF
  set -e
  cd ${PROJECT_DIR}
  
  echo ">>> [1/3] Syncing with remote branch..."
  git fetch origin
  BRANCH=\$(git rev-parse --abbrev-ref HEAD)
  git reset --hard origin/\$BRANCH
  
  echo ">>> [2/3] Installing dependencies..."
  npm install
  
  echo ">>> [3/3] Running migration script..."
  node server/scripts/migrate_ids.mjs
  
  echo "--------------------------------------------------"
  echo "✅ Migration successful on ${HOST}!"
  echo "--------------------------------------------------"
EOF
