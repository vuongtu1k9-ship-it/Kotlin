#!/usr/bin/env bash
set -euxo pipefail

# Configuration
DEV_SERVER=${DEV_SERVER_IP:-"192.168.1.23"}
DEV_PATH="/var/www/xiangqi-web-dev"
APP_NAME="xiangqi-web-dev"

echo "🚀 Starting Deployment to Dev ($DEV_SERVER)..."

# 1. Build Frontend locally
echo "📦 Building frontend..."
npm run build

# 2. Sync files to dev server
echo "📦 Syncing files to $DEV_SERVER..."
# Note: We sync the whole 'current' structure as expected by PM2 ecosystem config
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'uploads' \
  --exclude 'data' \
  --exclude '.git' \
  ./ "$DEV_SERVER:$DEV_PATH/current/"

# 3. Handle remote tasks
echo "🔧 Running remote tasks on $DEV_SERVER..."
ssh "$DEV_SERVER" << EOF
  cd "$DEV_PATH/current"
  
  # Install dependencies if package.json changed
  npm install --production
  
  # Migrate config from MongoDB to JSON and Cleanup
  echo "📦 Migrating site_config from MongoDB to JSON..."
  node scripts/migrate-and-cleanup.mjs
  
  # Ensure secrets are NOT in JSON
  echo "🔒 Cleaning up secrets from JSON..."
  node scripts/cleanup-json-secrets.mjs
  
  # Update Nginx config
  echo "📄 Updating Nginx configuration..."
  sudo cp deploy/nginx/dev-xiangqi-web.conf /etc/nginx/sites-available/xiangqi-web-dev
  sudo ln -sf /etc/nginx/sites-available/xiangqi-web-dev /etc/nginx/sites-enabled/xiangqi-web-dev
  sudo nginx -t && sudo systemctl reload nginx
  
  # Restart PM2
  echo "🔄 Restarting PM2 process $APP_NAME..."
  pm2 restart "$APP_NAME" || pm2 start deploy/pm2/ecosystem.config.cjs --name "$APP_NAME"
EOF

echo "✅ Deployment to Dev complete!"
