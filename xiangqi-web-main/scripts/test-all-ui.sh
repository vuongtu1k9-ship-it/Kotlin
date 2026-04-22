#!/bin/bash

# Xiangqi E2E Test Runner 
# ------------------------

# Ensure we're in the correct directory
cd "$(dirname "$0")/.." || exit

echo "📦 Installing Playwright for E2E testing..."
npm install playwright --no-save

echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

echo "🧪 Running Premium UI & Logic E2E Test..."
# Note: we use node to run the .mjs script
node scripts/test-premium-ui.mjs

echo "✅ Test completed! Check the 'test-results/' directory for screenshots."
