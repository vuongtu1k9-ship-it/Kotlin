#!/bin/bash
# Exit on error
set -e

HOST=${1:-192.168.1.23}
USER=${2:-root}
PROJECT_DIR="/var/www/xiangqi-web"

echo "--------------------------------------------------"
echo "🚀 Final Migration on ${USER}@${HOST}"
echo "--------------------------------------------------"

ssh -t ${USER}@${HOST} << EOF
  set -e
  cd ${PROJECT_DIR}
  
  echo ">>> Syncing with remote branch..."
  git fetch origin
  BRANCH=\$(git rev-parse --abbrev-ref HEAD)
  git reset --hard origin/\$BRANCH
  
  echo ">>> Running final migration script..."
  node server/scripts/final_migration.mjs
  
  echo ">>> Restarting backend to pick up collection changes..."
  if command -v pm2 >/dev/null 2>&1; then
    pm2 restart xiangqi
  fi
  
  echo "--------------------------------------------------"
  echo "✅ Final migration complete on ${HOST}!"
  echo "--------------------------------------------------"
EOF
