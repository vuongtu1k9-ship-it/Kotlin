# GitHub & Git Workflow Guide

This guide outlines how to work with the repository using the GitHub CLI (`gh`), SSH keys, and our standard development workflow.

## 1. GitHub CLI (`gh`)

The GitHub CLI is local to your terminal and allows you to manage issues, PRs, and workflows without leaving your code.

### Installation
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install gh
```

### Initial Login
```bash
gh auth login
```
Follow the prompts (choose **SSH** as the preferred protocol).

### Useful Commands
- **List Issues**: `gh issue list`
- **View Issue**: `gh issue view <id>`
- **Create Issue**: `gh issue create --title "Bug Name" --body "Steps to reproduce..."`
- **Monitor Deploys**: `gh run list` (shows the status of GitHub Actions)

---

## 2. SSH for Git

Using SSH instead of HTTPS identifies your computer to GitHub securely without requiring you to enter a password for every operation.

### Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```
Press Enter to accept the default location.

### Add to GitHub
1. Copy your public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
2. Go to **Settings > SSH and GPG keys** on GitHub.
3. Click **New SSH key** and paste the content.

### Test Connection
```bash
ssh -T git@github.com
```

---

## 3. Development Workflow

We use a two-tier branching strategy to separate active development from stable production.

### Branches
- **`main`**: The "Development" branch. All new features and bug fixes go here first. Pushing to `main` triggers a deploy to the **Dev Server** (`dev.cotuong.xyz`).
- **`production`**: The "Stable" branch. This represents the live site. Pushing to `production` triggers a deploy to the **Production Server** (`cotuong.xyz`).

### Standard Update Cycle
1.  **Work on Local**: Make changes and test locally.
2.  **Push to Main**:
    ```bash
    git add .
    git commit -m "feat: add new feature"
    git push origin main
    ```
3.  **Verify on Dev**: Check `https://dev.cotuong.xyz/` to ensure everything works in a real environment.
4.  **Merge to Production**:
    ```bash
    git checkout production
    git pull origin production --rebase
    git merge main
    git push origin production
    git checkout main
    ```

### Emergency Fixes
If production is broken, you can push directly to the `production` branch to fix it immediately, then later merge those changes back into `main`.

---

## 4. Best Practices
- **Commit Messages**: Use prefixes like `fix:`, `feat:`, `docs:`, or `refactor:`.
- **Sync Often**: Pull the latest changes from `main` often to avoid large merge conflicts.
- **Atomic Commits**: Keep each commit focused on a single change or fix.
