#!/usr/bin/env bash
set -euxo pipefail

# Configuration for PRODUCTION
PROD_SERVER=${PROD_SERVER_IP:-"192.168.80.139"}
PROD_PATH="/var/www/xiangqi-web"
APP_NAME="xiangqi-web"

echo "🚀 Starting Deployment to PRODUCTION ($PROD_SERVER)..."

# 1. Build Frontend locally
echo "📦 Building frontend..."
npm run build

# 2. Sync files to prod server
echo "📦 Syncing files to $PROD_SERVER..."
rsync -avz \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'uploads' \
  --exclude '.env*' \
  --exclude 'local.config.cjs' \
  --exclude 'scripts/purge-games.mjs' \
  -e ssh ./ "$PROD_SERVER:$PROD_PATH/current/"


# 3. Handle remote tasks
echo "🔧 Running remote tasks on $PROD_SERVER..."
ssh "$PROD_SERVER" << EOF
  cd "$PROD_PATH/current"
  
  # Install dependencies if package.json changed
  npm install --production
  
  # Migrate config from MongoDB to JSON and Cleanup
  echo "📦 Migrating site_config from MongoDB to JSON..."
  node scripts/migrate-and-cleanup.mjs
  
  # Ensure secrets are NOT in JSON
  echo "🔒 Cleaning up secrets from JSON..."
  node scripts/cleanup-json-secrets.mjs
  
  # Sync Bots and Recalculate Elo
  echo "🤖 Syncing AI bots and recalculating Elo..."
  node scripts/sync-official-bots.mjs
  node scripts/recalculate-elo.mjs
  
  # Clear Cache
  echo "🧹 Flushing Redis cache..."
  redis-cli flushall
  
  # Update Nginx config
  echo "📄 Updating Nginx configuration..."
  sudo cp deploy/nginx/xiangqi-web.conf /etc/nginx/sites-available/xiangqi-web
  sudo ln -sf /etc/nginx/sites-available/xiangqi-web /etc/nginx/sites-enabled/xiangqi-web
  sudo nginx -t && sudo systemctl reload nginx
  
  # Restart PM2
  echo "🔄 Restarting PM2 process $APP_NAME..."
  pm2 restart "$APP_NAME" || pm2 start deploy/pm2/ecosystem.config.cjs --name "$APP_NAME"
EOF

echo "✅ Deployment to PRODUCTION complete!"
