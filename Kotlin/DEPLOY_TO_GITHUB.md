# Hướng Dẫn Push Test Suite Lên GitHub

## Repository Mục Tiêu
**URL**: https://github.com/vuongtu1k9-ship-it/apk.git

## Các Files Đã Chuẩn Bị

Bộ test suite đã được tạo sẵn trong thư mục:
```
/root/.openclaw/workspace-main1/cotuong-xyz-tests/
```

Cấu trúc thư mục:
```
cotuong-xyz-tests/
├── .env.test.example
├── .gitignore
├── package.json
├── README.md
├── requirements.txt
├── .github/
│   └── workflows/
│       ├── api-tests.yml
│       └── e2e-tests.yml
├── tests/
│   ├── api/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_game.py
│   │   └── test_user.py
│   ├── e2e/
│   │   ├── playwright.config.ts
│   │   ├── test_login.spec.ts
│   │   └── test_game_flow.spec.ts
│   └── performance/
│       └── load-test.py
└── docs/
    └── TEST_PLAN.md
```

## Các Bước Để Push Lên GitHub

### Bước 1: Clone Repository Mục Tiêu

```bash
cd /tmp
git clone https://github.com/vuongtu1k9-ship-it/apk.git
```

### Bước 2: Copy Test Suite Vào Repository

```bash
# Copy toàn bộ nội dung từ cotuong-xyz-tests vào apk
cp -r /root/.openclaw/workspace-main1/cotuong-xyz-tests/* /tmp/apk/

# Hoặc copy với giữ cấu trúc thư mục test suite
cd /tmp/apk
mkdir -p cotuong-xyz-tests
cp -r /root/.openclaw/workspace-main1/cotuong-xyz-tests/* cotuong-xyz-tests/
```

Nếu bạn muốn đặt trực tiếp vào root repository:
```bash
cp -r /root/.openclaw/workspace-main1/cotuong-xyz-tests/* /tmp/apk/
```

### Bước 3: Commit và Push

```bash
cd /tmp/apk

# Kiểm tra status
git status

# Add tất cả files mới
git add .

# Commit với message rõ ràng
git commit -m "feat: add comprehensive test suite for cotuong.xyz

- API tests (pytest + httpx): auth, game, user endpoints
- E2E tests (Playwright): login, game flow
- Performance tests (Locust): load scenarios
- GitHub Actions CI/CD: API and E2E workflows
- Documentation: README, test plan, setup guide

This test suite covers:
- Authentication (login, register, logout)
- Game room management (create, join, leave)
- Move validation and game state
- User profile and statistics
- Performance testing scenarios
- Automated CI/CD pipelines"

# Push lên GitHub
git push origin main
# Hoặc nếu branch khác:
git push origin <branch-name>
```

### Bước 4: Cấu Hình GitHub Secrets

Để tests chạy được trên GitHub Actions, bạn cần thêm các secrets sau vào repository:

1. Vào repository: https://github.com/vuongtu1k9-ship-it/apk/settings/secrets/actions
2. Click "New repository secret"
3. Thêm các secrets:

```
BASE_URL = https://cotuong.xyz
# Hoặc nếu có staging: BASE_URL = https://staging.cotuong.xyz

TEST_USER_EMAIL = your_test_email@example.com
TEST_USER_PASSWORD = your_test_password
TEST_USERNAME = test_user

# Optional - second user for multiplayer tests
TEST_USER_2_EMAIL = test2@example.com
TEST_USER_2_PASSWORD = test2_password
TEST_USER_2_USERNAME = test_user2
```

**Lưu ý**: Tạo tài khoản test thực tế trên cotuong.xyz để dùng cho CI.

### Bước 5: Verify GitHub Actions

Sau khi push, vào tab "Actions" của repository để xem workflows chạy:

- **API Tests**: Trigger trên mỗi push vào main/develop
- **E2E Tests**: Trigger theo schedule hoặc push
- Kết quả sẽ hiển thị trong Actions tab

## Tùy Chọn: Push Trực Tiếp Từ Current Directory

Nếu bạn muốn thư mục test suite là một sub-folder trong repository:

```bash
cd /root/.openclaw/workspace-main1
git clone https://github.com/vuongtu1k9-ship-it/apk.git apk-temp
cd apk-temp

# Copy vào
cp -r ../cotuong-xyz-tests/* .

# Hoặc move cả thư mục
mv ../cotuong-xyz-tests .

git add .
git commit -m "Add cotuong.xyz test suite"
git push origin main
```

## Xử Lý Xung Đột Nếu Repository Đã Có Files

Nếu repository `apk` đã có files, bạn có thể:

**Option 1: Merge vào thư mục con**
```bash
cd /tmp/apk
mkdir -p tests/cotuong-xyz
cp -r /root/.openclaw/workspace-main1/cotuong-xyz-tests/* tests/cotuong-xyz/
git add .
git commit -m "Add cotuong.xyz test suite in tests/cotuong-xyz/"
```

**Option 2: Đặt ở root**
```bash
# Copy với prefix để tránh xung đột
cp -r /root/.openclaw/workspace-main1/cotuong-xyz-tests /tmp/apk/cotuong-tests
cd /tmp/apk
git add cotuong-tests
git commit -m "Add cotuong.xyz test suite (cotuong-tests/)"
```

## Troubleshooting

### Lỗi "Authentication failed"
```bash
# Kiểm tra remote URL
git remote -v

# Nếu cần update credential
git remote set-url origin https://<username>:<token>@github.com/vuongtu1k9-ship-it/apk.git
# Hoặc dùng SSH:
git remote set-url origin git@github.com:vuongtu1k9-ship-it/apk.git
```

### Lỗi "fatal: not a git repository"
```bash
# Chưa clone, clone lại
cd /tmp
rm -rf apk
git clone https://github.com/vuongtu1k9-ship-it/apk.git
```

### Lỗi "branch 'main' doesn't exist"
```bash
# Kiểm tra branches có sẵn
git branch -a

# Nếu chỉ có master:
git checkout master
git push origin master
# Hoặc rename:
git branch -M main
git push -u origin main
```

## Checklist Trước Khi Push

- [ ] Tất cả files đã copy đầy đủ
- [ ] `.env.test.example` không chứa real credentials
- [ ] `.gitignore` đã được thêm
- [ ] không có file nhạy cảm (real passwords, tokens)
- [ ] README.md hướng dẫn đầy đủ
- [ ] GitHub workflows files ở đúng đường dẫn `.github/workflows/`

## Cấu Trúc Repository Sau Khi Push

```
apk/
├── .github/
│   └── workflows/
│       ├── api-tests.yml
│       └── e2e-tests.yml
├── cotuong-xyz-tests/  (hoặc tests/cotuong-xyz/)
│   ├── .env.test.example
│   ├── .gitignore
│   ├── package.json
│   ├── README.md
│   ├── requirements.txt
│   ├── tests/
│   └── docs/
├── README.md (của repo gốc, giữ nguyên)
└── ... (files khác của repo)
```

## Liên Hệ Nếu Cần Hỗ Trợ

Nếu gặp vấn đề, hãy:
1. Kiểm tra lỗi cụ thể
2. Xem xét repository permissions (bạn có quyền push không?)
3. Verify network connectivity

---

**Tạo bởi**: OpenClaw Assistant
**Ngày**: 2025-04-03
**Mục đích**: Push test suite cho cotuong.xyz lên GitHub repository vuongtu1k9-ship-it/apk
