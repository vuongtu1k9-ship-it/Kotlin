#!/bin/bash
# Exit on error
set -e

HOST=${1:-192.168.1.23}
USER=${2:-root}
PROJECT_DIR="/var/www/xiangqi-web"

echo "--------------------------------------------------"
echo "🚀 Debugging Room on ${USER}@${HOST}"
echo "--------------------------------------------------"

ssh -t ${USER}@${HOST} << EOF
  set -e
  cd ${PROJECT_DIR}
  
  echo ">>> Syncing with remote branch..."
  git fetch origin
  BRANCH=\$(git rev-parse --abbrev-ref HEAD)
  git reset --hard origin/\$BRANCH
  
  echo ">>> Running debug script..."
  node server/scripts/debug_room.mjs
  
  echo "--------------------------------------------------"
  echo "✅ Debug complete on ${HOST}!"
  echo "--------------------------------------------------"
EOF
