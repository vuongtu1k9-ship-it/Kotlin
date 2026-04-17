# DEPLOY_TO_GITHUB.md

## Overview
Guide for deploying to GitHub.

## Repository
**URL**: https://github.com/vuongtu1k9-ship-it/apk.git

## Steps

### 1. Clone Repository
```bash
cd /tmp
git clone https://github.com/vuongtu1k9-ship-it/apk.git
```

### 2. Copy Files
```bash
cp -r /root/.openclaw/workspace/* /tmp/apk/
```

### 3. Commit and Push
```bash
cd /tmp/apk
git add .
git commit -m "Add OpenClaw workspace"
git push origin main
```

## GitHub Secrets
Add these to repository secrets:
- BASE_URL
- TEST_USER_EMAIL
- TEST_USER_PASSWORD

---

_Last updated: 2026-04-16_