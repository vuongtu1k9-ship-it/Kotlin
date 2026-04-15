#!/bin/bash
# Script tự động push test suite lên GitHub repository
# Repository: https://github.com/vuongtu1k9-ship-it/apk.git

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================================"
echo "   🚀 Deploy cotuong.xyz Test Suite to GitHub"
echo "================================================"
echo ""

# Source directory (where test suite is)
SOURCE_DIR="/root/.openclaw/workspace-main1/cotuong-xyz-tests"

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo -e "${RED}❌ Source directory not found: $SOURCE_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Source directory found${NC}"

# Step 1: Create temp workspace
WORKSPACE="/tmp/cotuong-deploy-$(date +%s)"
echo -e "${GREEN}✓ Creating workspace: $WORKSPACE${NC}"
mkdir -p "$WORKSPACE"
cd "$WORKSPACE"

# Step 2: Clone repository
REPO_SSH="git@github.com:vuongtu1k9-ship-it/apk.git"
echo ""
echo -e "${YELLOW}📦 Cloning repository...${NC}"
if git clone "$REPO_SSH" . 2>&1 | grep -q "fatal"; then
    echo -e "${RED}❌ Failed to clone repository${NC}"
    echo "Make sure:"
    echo "  1. SSH key is added to GitHub"
    echo "  2. You have access to the repository"
    echo "  3. SSH agent is running"
    exit 1
fi
echo -e "${GREEN}✓ Repository cloned${NC}"

# Step 3: Check current branch
BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD)
echo -e "${GREEN}✓ Current branch: $BRANCH${NC}"

# Step 4: Copy test suite files
echo ""
echo -e "${YELLOW}📋 Copying test suite files...${NC}"
cp -r "$SOURCE_DIR"/* .
echo -e "${GREEN}✓ Files copied${NC}"

# Step 5: Show what will be committed
echo ""
echo -e "${YELLOW}📁 Files to be committed:${NC}"
git status --short

# Step 6: Git add
echo ""
echo -e "${YELLOW}➕ Staging files...${NC}"
git add .

# Step 7: Commit
COMMIT_MSG="feat: add comprehensive test suite for cotuong.xyz

✅ API Tests (pytest + httpx)
- Authentication (login, register, logout)
- Game rooms (create, join, leave)
- User profiles and statistics
- Move validation

✅ E2E Tests (Playwright)
- Login/register flows
- Complete game flow
- UI interactions

✅ Performance Tests (Locust)
- Load testing scenarios
- Concurrent user simulation

✅ CI/CD (GitHub Actions)
- API tests workflow
- E2E tests workflow

✅ Documentation
- README with full setup guide
- Test plan with 3-person assignment
- API endpoint discovery guide

🤖 Automated deployment via push script"
echo ""
echo -e "${YELLOW}💾 Committing...${NC}"
git commit -m "$COMMIT_MSG" || echo -e "${YELLOW}⚠️  No changes to commit${NC}"

# Step 8: Push
echo ""
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
if git push origin "$BRANCH"; then
    echo ""
    echo "================================================"
    echo -e "${GREEN}✅ ✅ ✅  DEPLOYMENT SUCCESSFUL! ✅ ✅ ✅${NC}"
    echo "================================================"
    echo ""
    echo "📊 Repository: https://github.com/vuongtu1k9-ship-it/apk"
    echo "🌿 Branch: $BRANCH"
    echo ""
    echo "🔗 Next steps:"
    echo "   1. View Actions: https://github.com/vuongtu1k9-ship-it/apk/actions"
    echo "   2. Add Secrets (required for CI):"
    echo "      https://github.com/vuongtu1k9-ship-it/apk/settings/secrets/actions"
    echo ""
    echo "   Required secrets:"
    echo "   - BASE_URL=https://cotuong.xyz"
    echo "   - TEST_USER_EMAIL=your_email"
    echo "   - TEST_USER_PASSWORD=your_password"
    echo "   - TEST_USERNAME=your_username"
    echo ""
    echo "   3. Check test results in Actions tab"
    echo ""
    echo "📚 To view locally:"
    echo "   cd /tmp/cotuong-deploy-* && pytest tests/api/ -v"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed!${NC}"
    echo "Possible causes:"
    echo "  - No push permission"
    echo "  - Branch protection rules"
    echo "  - Network issues"
    exit 1
fi
