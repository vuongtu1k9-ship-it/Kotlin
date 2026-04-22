# RELEASE CREATION GUIDE

## Cach tao GitHub Release voi APK

## Steps (A den Z)

### A. Check Auth
```bash
gh auth status
```
Neu chua login: `gh auth login`

### B. Clone Repo
```bash
cd /tmp
git clone --depth 1 --branch cotuong https://github.com/vuongtu1k9-ship-it/Flutter.git
cd Flutter
```

### C. Find Build
```bash
gh run list --status success --limit 1
```

### D. Download Artifact
```bash
gh run download RUN_ID -n app-release
```

### E. Create Release
```bash
gh release create v1.0.0 --title "Ten App v1.0.0" --notes "Mo ta" --target cotuong
```

### F. Upload APK
```bash
gh release upload v1.0.0 app-release.apk --clobber
```

### G. Verify
```bash
gh release list
```

## Commands
| Action | Command |
|--------|---------|
| List releases | gh release list |
| View release | gh release view v1.0.0 |
| Upload | gh release upload TAG FILE |
| Download run | gh run download RUN_ID -n app-release |

## Errors
- "not logged in": `gh auth login`
- "no such file": Check artifact name
- "not a git repo": Clone repo first
- "already exists": Use --clobber

## URLs
- Releases: github.com/OWNER/REPO/releases
- Download: github.com/OWNER/REPO/releases/download/v1.0.0/app-release.apk