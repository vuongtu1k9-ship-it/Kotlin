# Kế Hoạch Test Cho cotuong.xyz

## Tổng Quan
Website: https://cotuong.xyz/ - Cờ Tướng Online
Loại: Trò chơi chiến thuật trực tuyến (Chinese Chess / Xiangqi)

## Các Loại Test Cần Thực Hiện

### 1. API Testing
- Authentication endpoints (login, register, logout)
- Game management (create room, join room, leave room)
- Move validation API
- Match history
- User profile
- Leaderboard/ranking

### 2. End-to-End (E2E) UI Testing
- User registration/login flow
- Creating/joining game rooms
- Making moves on the board
- Game flow (start, play, end, draw/resign)
- Real-time updates (WebSocket)

### 3. Performance Testing
- Concurrent users load testing
- API response times
- WebSocket connection stability

### 4. Security Testing
- XSS vulnerabilities
- SQL injection checks
- Session management
- Input validation

## Công Cụ Đề Xuất
- **API Testing**: pytest + requests/httpx, or Postman/Newman
- **E2E Testing**: Playwright hoặc Selenium
- **Performance**: k6 hoặc Locust
- **Security**: OWASP ZAP, custom scripts

## Cấu Trúc Repository Test
```
cotuong-xyz-tests/
├── README.md
├── requirements.txt (hoặc package.json)
├── .env.example
├── tests/
│   ├── api/
│   │   ├── test_auth.py
│   │   ├── test_game.py
│   │   ├── test_moves.py
│   │   └── conftest.py
│   ├── e2e/
│   │   ├── test_login.spec.ts
│   │   ├── test_game_flow.spec.ts
│   │   └── playwright.config.ts
│   └── performance/
│       ├── load-test.js
│       └── scenarios/
├── reports/
│   ├── allure-results/
│   ├── html/
│   └── json/
├── .github/
│   └── workflows/
│       ├── api-tests.yml
│       ├── e2e-tests.yml
│       └── performance-tests.yml
└── docs/
    ├── TEST_PLAN.md
    ├── API_ENDPOINTS.md (cần khảo sát thực tế)
    └── RUN_TESTS.md
```

## Giai Đoạn Thực Hiện

1. **Khảo sát API** - Phân tích network traffic khi sử dụng website
2. **Viết test cases** - Dựa trên nghiệp vụ game cờ tướng
3. **Implement tests** - Code thực tế
4. **CI/CD setup** - GitHub Actions chạy test tự động
5. **Báo cáo** - Generate test reports với Allure hoặc HTML

## Ghi Chú
- Cần crawl/thăm dò để biết chính xác API endpoints
- WebSocket endpoints cần test đặc biệt
- Test data cần chuẩn bị sẵn (tài khoản test, thế cờ mẫu)
