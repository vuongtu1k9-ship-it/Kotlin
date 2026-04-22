# Tài Liệu Phát Triển Client Đa Nền Tảng
## cotuong.xyz — Android · iOS · Web

> **Phiên bản tài liệu:** 1.0  
> **Cập nhật:** Tháng 4, 2026  
> **Base URL:** `https://cotuong.xyz`  
> **API Prefix:** `/api`  
> **WebSocket:** Socket.IO v4 (tương thích với WS thuần)

---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Xác Thực & Quản Lý Phiên](#2-xác-thực--quản-lý-phiên)
3. [REST API Reference](#3-rest-api-reference)
4. [Socket.IO Real-time API](#4-socketio-real-time-api)
5. [Tích Hợp Android (Kotlin)](#5-tích-hợp-android-kotlin)
6. [Tích Hợp iOS (Swift)](#6-tích-hợp-ios-swift)
7. [Quản Lý Token & Làm Mới Phiên](#7-quản-lý-token--làm-mới-phiên)
8. [Push Notifications](#8-push-notifications)
9. [Xử Lý Lỗi Chuẩn](#9-xử-lý-lỗi-chuẩn)
10. [Checklist Tích Hợp](#10-checklist-tích-hợp)

---

## 1. Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────┐
│                    cotuong.xyz Server                   │
│                                                         │
│  ┌─────────────┐    ┌──────────────┐  ┌─────────────┐  │
│  │  Express.js  │    │  Socket.IO   │  │  MongoDB    │  │
│  │  REST API    │    │  Real-time   │  │  + Redis    │  │
│  └──────┬──────┘    └──────┬───────┘  └─────────────┘  │
└─────────┼─────────────────┼───────────────────────────-─┘
          │ HTTPS/REST       │ WSS/Socket.IO
    ┌─────▼─────┐      ┌────▼──────┐      ┌───────────┐
    │  Web SPA  │      │  Android  │      │    iOS    │
    │ (React)   │      │  (Kotlin) │      │  (Swift)  │
    └───────────┘      └───────────┘      └───────────┘
```

### Giao Thức

| Kênh | Giao Thức | Mục Đích |
|------|-----------|----------|
| REST API | HTTPS + JSON | Truy vấn dữ liệu, đăng nhập, hồ sơ |
| Real-time | Socket.IO over WSS | Phòng cờ, chat, hiện diện trực tuyến |
| Push | FCM (Android) / APNs (iOS) / WebPush (Web) | Thông báo nền |

### Xác Thực

Server dùng **JWT** (`APP_JWT_SECRET`). Token được gửi qua:
- **Cookie** `xq_token` (HttpOnly, Secure) — Web
- **Header** `Authorization: Bearer <token>` — Mobile
- **Socket handshake** `auth.token` — WebSocket

---

## 2. Xác Thực & Quản Lý Phiên

### 2.1 Đăng Ký Tài Khoản

```
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "minSix123",
  "name": "Nguyễn Văn A"
}
```

**Response thành công (200):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "u_abc123",
    "name": "Nguyễn Văn A",
    "email": "player@example.com",
    "provider": "local",
    "elo": 1200,
    "picture": null,
    "inventory": { "coins": 0, "ring": 0, "bear": 0, "candy": 0 }
  }
}
```

**Lỗi có thể xảy ra:**
| Code | Ý nghĩa |
|------|---------|
| `BAD_EMAIL` | Email không hợp lệ hoặc bị chặn spam |
| `WEAK_PASSWORD` | Mật khẩu dưới 6 ký tự |
| `EMAIL_TAKEN` | Email đã tồn tại |
| `TOO_MANY_REQUESTS` | Vược giới hạn 5 lần/phút |

---

### 2.2 Đăng Nhập Email/Mật Khẩu

```
POST /api/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "player@example.com",
  "password": "minSix123"
}
```

**Response:**
```json
{
  "ok": true,
  "token": "eyJ...",
  "user": { "uid": "...", "name": "...", "elo": 1350, ... }
}
```

> ⚠️ **Mobile**: Lưu `token` vào Keychain (iOS) hoặc EncryptedSharedPreferences (Android). Không lưu vào plain SharedPreferences.

---

### 2.3 Đăng Nhập Google OAuth

**Luồng PKCE (Web redirect):**
```
GET /api/oauth/google/start  →  redirect đến Google
GET /api/oauth/google/callback  →  server set cookie, redirect về /
```

**Luồng API (Mobile — dùng Google Sign-In SDK):**
```
POST /api/auth/google
Content-Type: application/json
```
```json
{
  "credential": "<Google ID Token từ SDK>"
}
```
**Response:** Giống đăng nhập thường, trả về `token` + `user`.

---

### 2.4 Đăng Nhập Khách (Guest)

```
POST /api/auth/guest
```
**Response:**
```json
{
  "ok": true,
  "token": "eyJ...",
  "user": {
    "uid": "guest_xxx",
    "name": "Guest",
    "provider": "guest"
  }
}
```

> Khách **không thể** ngồi vào bàn đấu thật. Dùng để xem lobby và theo dõi ván cờ.

---

### 2.5 Lấy Thông Tin Người Dùng Hiện Tại

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "uid": "u_abc123",
    "name": "Nguyễn Văn A",
    "email": "...",
    "picture": "/api/avatars/u_abc123",
    "provider": "local",
    "elo": 1350,
    "sysRole": "user",
    "inventory": { "coins": 120, "ring": 2, "bear": 0, "candy": 5 },
    "loginStreak": 3,
    "lastDailyRewardAt": 1712500000000
  }
}
```

> Endpoint này tự động cấp phần thưởng hàng ngày nếu chưa nhận trong ngày.

---

### 2.6 Đăng Xuất

```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:** `{ "ok": true }`

> Mobile: Sau khi nhận `ok: true`, xóa token khỏi bộ nhớ an toàn.

---

### 2.7 Đổi Mật Khẩu

```
POST /api/auth/password
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "oldPassword": "oldPass123",
  "newPassword": "newPass456"
}
```

---

## 3. REST API Reference

### 3.1 Thông Tin Server

```
GET /health
```
```json
{
  "ok": true,
  "version": "v2.4.1",
  "uptime": 3600,
  "redis": { "connected": true },
  "mongodb": { "connected": true }
}
```

```
GET /site-settings
```
```json
{
  "ok": true,
  "settings": {
    "site.guestAllowed": true,
    "chat.enabled": true,
    "ai.enabled": true,
    "elo.ranks": [...]
  }
}
```

---

### 3.2 Người Dùng & Hồ Sơ

#### Danh sách người chơi
```
GET /api/players?page=1&limit=100&search=Nguyen
```
```json
{
  "ok": true,
  "players": [
    {
      "uid": "u_abc123",
      "name": "Nguyễn Văn A",
      "picture": "/api/avatars/u_abc123",
      "elo": 1850,
      "gamesPlayed": 342,
      "online": true,
      "customStatus": "online",
      "playingRoomId": "room_xyz"
    }
  ],
  "total": 1500,
  "pages": 15,
  "currentPage": 1
}
```

#### Hồ sơ người dùng
```
GET /api/users/:uid/summary
Authorization: Bearer <token>   (tùy chọn, bắt buộc để thấy "isFollowing")
```
```json
{
  "ok": true,
  "user": { "uid": "...", "name": "...", "picture": "..." },
  "elo": 1850,
  "rank": 23,
  "gamesPlayed": 342,
  "followersCount": 80,
  "followingCount": 45,
  "isFollowing": false,
  "inventory": { "coins": 500 }
}
```

#### Lịch sử ván đấu của người dùng
```
GET /api/users/:uid/games?limit=50
```
```json
{
  "ok": true,
  "games": [
    {
      "gameId": "room_xyz",
      "status": "finished",
      "timeMode": "standard",
      "finished": true,
      "winner": "red",
      "endedBy": "checkmate",
      "updatedAt": 1712500000000,
      "players": {
        "redUid": "u_abc123",
        "blackUid": "u_def456",
        "redName": "Nguyễn Văn A",
        "blackName": "Trần Văn B"
      }
    }
  ]
}
```

#### Theo dõi / Bỏ theo dõi
```
POST /api/users/follow/:targetUid
Authorization: Bearer <token>
```
```json
{ "ok": true, "isFollowing": true }
```

#### Cập nhật hồ sơ
```
POST /api/profile
Authorization: Bearer <token>
Content-Type: application/json
```
```json
{
  "name": "Tên Mới",
  "picture": "https://example.com/avatar.jpg"
}
```

#### Avatar
```
GET /api/avatars/:uid
```
Trả về ảnh PNG/JPG của người dùng.

---

### 3.3 Ván Cờ (Games)

#### Danh sách ván cờ công khai
```
GET /api/games?status=finished&limit=50&timeMode=standard&sort=newest
```

| Tham số | Giá trị | Mô tả |
|---------|---------|-------|
| `status` | `open`, `started`, `finished`, `all` | Lọc trạng thái |
| `timeMode` | `standard`, `blitz`, `all` | Lọc thể thức giờ |
| `sort` | `newest`, `popular`, `spectators` | Sắp xếp |
| `limit` | 1–1000 | Số lượng kết quả |
| `cursor` | timestamp | Phân trang cursor |

#### Chi tiết ván cờ
```
GET /api/games/:roomId
```
```json
{
  "ok": true,
  "game": {
    "_id": "room_xyz",
    "status": "finished",
    "playerUids": { "red": "u_abc", "black": "u_def" },
    "state": {
      "winner": "red",
      "endedBy": "checkmate",
      "moveHistory": [...],
      "playerNames": { "red": "Nguyễn A", "black": "Trần B" }
    },
    "likeCount": 15,
    "createdAt": 1712000000000
  }
}
```

#### Danh sách nước đi của ván cờ
```
GET /api/games/:roomId/moves
```
```json
{
  "ok": true,
  "moves": [
    {
      "ply": 1,
      "from": { "row": 9, "col": 4 },
      "to": { "row": 7, "col": 4 },
      "piece": { "type": "cannon", "side": "red" },
      "fen": "rnbakabnr/9/1c5c1/..."
    }
  ]
}
```

#### Like/Unlike ván cờ
```
POST /api/games/like/:roomId
Authorization: Bearer <token>
```
```json
{ "ok": true, "liked": true, "likeCount": 16 }
```

#### Đối đầu lịch sử (H2H)
```
GET /api/users/:uid1/vs/:uid2
```
```json
{
  "ok": true,
  "stats": { "total": 20, "u1Wins": 8, "u2Wins": 10, "draws": 2 },
  "recentGames": [...]
}
```

---

### 3.4 Thế Cờ (Puzzles)

```
GET /api/puzzles?level=1&limit=20
GET /api/puzzles/:id
```

---

### 3.5 Bài Học Thực Hành

```
GET /api/practice/categories
GET /api/practice/lessons?categorySlug=sat-phap
GET /api/practice/lessons/:slug
```

---

### 3.6 Bình Luận

```
GET  /api/games/:id/comments
POST /api/games/:id/comments
     Authorization: Bearer <token>
     Body: { "text": "Ván cờ hay quá!" }
```

---

## 4. Socket.IO Real-time API

### 4.1 Kết Nối

**URL:** `wss://cotuong.xyz` (hoặc `http://cotuong.xyz` để Socket.IO tự chọn transport)

**Handshake với token (Mobile):**
```javascript
// JavaScript (tham khảo)
const socket = io('https://cotuong.xyz', {
  transports: ['websocket'],
  auth: { token: '<JWT token>' }
});
```

**Kotlin (Android) — socket.io-client:**
```kotlin
val opts = IO.Options().apply {
  transports = arrayOf(WebSocket.NAME)
  auth = mapOf("token" to jwtToken)
}
val socket = IO.socket("https://cotuong.xyz", opts)
socket.connect()
```

**Swift (iOS) — SocketIO:**
```swift
let manager = SocketManager(
    socketURL: URL(string: "https://cotuong.xyz")!,
    config: [
        .log(false),
        .compress,
        .connectParams(["token": jwtToken])
    ]
)
let socket = manager.defaultSocket
socket.connect()
```

---

### 4.2 Sự Kiện Xác Thực

#### Gửi: `auth:identify`
Xác định lại người dùng sau khi kết nối (nếu cần).
```json
{ "token": "<JWT>" }
```

---

### 4.3 Hiện Diện (Presence)

#### Lấy danh sách người online

**Emit:** `presence:list`  
**Nhận:** `presence:list`
```json
{
  "ok": true,
  "presence": [
    {
      "uid": "u_abc123",
      "name": "Nguyễn A",
      "picture": "/api/avatars/u_abc123",
      "elo": 1850,
      "online": true,
      "activity": "playing",
      "playingRoomId": "room_xyz",
      "customStatus": "online"
    }
  ]
}
```

#### Nhận cập nhật hiện diện (server push)

**Sự kiện:** `presence:update`
```json
{
  "uid": "u_abc123",
  "online": false,
  "activity": "idle"
}
```

#### Cập nhật trạng thái tùy chỉnh

**Emit:** `presence:custom_status`
```json
{ "status": "busy" }
```

---

### 4.4 Phòng Cờ (Room)

#### Tạo phòng mới

**Emit:** `room:create`
```json
{
  "timeMode": "standard",
  "isPrivate": false,
  "setupId": null
}
```

`timeMode` nhận các giá trị: `standard` (10 phút), `blitz` (3 phút), `rapid` (5 phút), `custom`.

**Callback ACK:**
```json
{ "ok": true, "roomId": "room_abc123" }
```

#### Vào phòng (chơi)

**Emit:** `room:join`
```json
{ "roomId": "room_abc123" }
```

**Callback ACK:**
```json
{
  "ok": true,
  "roomId": "room_abc123",
  "side": "red",
  "board": [[...]],
  "started": false,
  "finished": false,
  "playerUids": { "red": "u_abc", "black": null },
  "playerNames": { "red": "Nguyễn A", "black": null },
  "clock": {
    "mode": "standard",
    "remainingMs": { "red": 600000, "black": 600000 }
  },
  "serverTime": 1712500000000,
  "moveHistory": []
}
```

#### Theo dõi phòng (khán giả)

**Emit:** `room:watch`
```json
{ "roomId": "room_abc123" }
```

Callback trả về tương tự `room:join` với `role: "spectator"`.

#### Rời phòng

**Emit:** `room:leave`
```json
{ "roomId": "room_abc123", "explicit": true }
```

#### Danh sách lobby

**Emit:** `lobby:list`  
**Callback ACK:**
```json
{
  "ok": true,
  "rooms": [
    {
      "roomId": "room_abc123",
      "status": "open",
      "timeMode": "standard",
      "players": {
        "red": true, "black": false,
        "redName": "Nguyễn A", "blackName": null
      },
      "spectators": 0,
      "updatedAt": 1712500000000
    }
  ]
}
```

#### Server push — cập nhật phòng

**Sự kiện:** `lobby:update` — Khi có phòng thêm/bớt/thay đổi
```json
{ "roomId": "room_abc123", "action": "update" }
```

**Sự kiện:** `room:players` — Khi người chơi vào/ra phòng
```json
{
  "roomId": "...",
  "players": { "red": true, "black": true },
  "playerUids": { "red": "u_1", "black": "u_2" },
  "playerNames": { "red": "A", "black": "B" },
  "started": false
}
```

---

### 4.5 Game Logic

#### Đi nước cờ

**Emit:** `game:move`
```json
{
  "roomId": "room_abc123",
  "from": { "row": 9, "col": 4 },
  "to": { "row": 7, "col": 4 },
  "moveIndex": 0
}
```

**Callback ACK:**
```json
{
  "ok": true,
  "moveIndex": 1,
  "fen": "rnbakabnr/9/..."
}
```

#### Server push — nước đi hợp lệ

**Sự kiện:** `game:moved`
```json
{
  "roomId": "...",
  "from": { "row": 9, "col": 4 },
  "to": { "row": 7, "col": 4 },
  "piece": { "type": "cannon", "side": "red" },
  "currentPlayer": "black",
  "moveIndex": 1,
  "clock": { "remainingMs": { "red": 595000, "black": 600000 } }
}
```

#### Server push — kết thúc ván

**Sự kiện:** `game:over`
```json
{
  "roomId": "...",
  "finished": true,
  "winner": "red",
  "endedBy": "checkmate"
}
```

`endedBy` có thể là: `checkmate`, `resign`, `timeout`, `draw_agreement`, `draw_repetition`.

#### Xin hòa / Từ chối hòa

**Emit:** `game:draw_offer`
```json
{ "roomId": "..." }
```

**Sự kiện nhận:** `game:draw_offered`  
**Sự kiện nhận:** `game:draw_accepted` / `game:draw_declined`

#### Đầu hàng

**Emit:** `game:resign`
```json
{ "roomId": "..." }
```

#### Đổi bên (trước khi bắt đầu)

**Emit:** `room:swap`
```json
{ "roomId": "...", "accept": true }
```

`accept: undefined` = gửi yêu cầu, `true` = chấp nhận, `false` = từ chối.

---

### 4.6 Chat

**Emit:** `chat:message`
```json
{
  "roomId": "room_abc123",
  "text": "Ván hay quá!"
}
```

**Sự kiện nhận:** `chat:message`
```json
{
  "roomId": "...",
  "uid": "u_abc",
  "name": "Nguyễn A",
  "text": "Ván hay quá!",
  "timestamp": 1712500040000
}
```

**Sự kiện nhận lịch sử:** `chat:history`
```json
[
  { "uid": "...", "name": "...", "text": "...", "timestamp": 1712000000000 }
]
```

---

### 4.7 Thư Mời & Thách Đấu

#### Mời vào phòng

**Emit:** `invite:send`
```json
{ "toUid": "u_def456", "roomId": "room_abc123" }
```

**Sự kiện nhận:** `invite:received`
```json
{
  "fromUid": "u_abc123",
  "fromName": "Nguyễn A",
  "roomId": "room_abc123",
  "timeMode": "standard"
}
```

**Emit:** `invite:accept` / `invite:decline`
```json
{ "roomId": "room_abc123", "fromUid": "u_abc123" }
```

---

### 4.8 Thách Đấu (Challenge)

**Emit:** `challenge:send`
```json
{
  "toUid": "u_def456",
  "timeMode": "blitz"
}
```

**Sự kiện nhận:** `challenge:received`
```json
{
  "challengeId": "chal_xxx",
  "fromUid": "u_abc",
  "fromName": "Nguyễn A",
  "timeMode": "blitz"
}
```

**Emit:** `challenge:accept`
```json
{ "challengeId": "chal_xxx" }
```

**Sự kiện nhận:** `challenge:accepted` → `roomId` mới được tạo.

---

### 4.9 Tin Nhắn (Inbox)

**Emit:** `messages:inbox`  
**Callback ACK / Sự kiện nhận:** `messages:inbox`
```json
{
  "ok": true,
  "messages": [
    {
      "_id": "...",
      "fromUid": "u_abc",
      "fromName": "Nguyễn A",
      "type": "new_follower",
      "status": "read",
      "createdAt": 1712500000000
    }
  ]
}
```

---

### 4.10 Heartbeat

**Emit:** `heartbeat:ping`  
**Sự kiện nhận:** `heartbeat:pong`

> Nên gửi mỗi 30 giây để duy trì kết nối trên mobile.

---

## 5. Tích Hợp Android (Kotlin)

### 5.1 Dependencies (build.gradle)

```groovy
dependencies {
    // HTTP
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.squareup.okhttp3:logging-interceptor:4.12.0'
    
    // JSON
    implementation 'com.google.code.gson:gson:2.10.1'
    
    // Socket.IO
    implementation('io.socket:socket.io-client:2.1.0') {
        exclude group: 'org.json', module: 'json'
    }
    
    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:21.0.0'
    
    // Secure Storage
    implementation 'androidx.security:security-crypto:1.1.0-alpha06'
    
    // FCM
    implementation 'com.google.firebase:firebase-messaging:23.4.1'
    
    // Coroutines
    implementation 'org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3'
}
```

### 5.2 ApiClient.kt

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson

object ApiClient {
    private const val BASE_URL = "https://cotuong.xyz/api"
    private val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
    private val gson = Gson()
    
    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val token = TokenManager.getToken()
            val request = if (token != null) {
                chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
            } else chain.request()
            chain.proceed(request)
        }
        .build()
    
    suspend fun <T> get(path: String, clazz: Class<T>): T {
        val request = Request.Builder()
            .url("$BASE_URL$path")
            .build()
        val response = client.newCall(request).execute()
        val body = response.body?.string() ?: throw Exception("Empty body")
        return gson.fromJson(body, clazz)
    }
    
    suspend fun <T> post(path: String, body: Any, clazz: Class<T>): T {
        val jsonBody = gson.toJson(body).toRequestBody(JSON_MEDIA_TYPE)
        val request = Request.Builder()
            .url("$BASE_URL$path")
            .post(jsonBody)
            .build()
        val response = client.newCall(request).execute()
        val responseBody = response.body?.string() ?: throw Exception("Empty body")
        return gson.fromJson(responseBody, clazz)
    }
}
```

### 5.3 TokenManager.kt (Secure Storage)

```kotlin
import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

object TokenManager {
    private const val PREFS_NAME = "cotuong_secure"
    private const val KEY_TOKEN = "jwt_token"
    private var prefs: SharedPreferences? = null
    
    fun init(context: Context) {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            PREFS_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
    
    fun saveToken(token: String) = prefs?.edit()?.putString(KEY_TOKEN, token)?.apply()
    fun getToken(): String? = prefs?.getString(KEY_TOKEN, null)
    fun clearToken() = prefs?.edit()?.remove(KEY_TOKEN)?.apply()
}
```

### 5.4 SocketManager.kt

```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.WebSocket
import org.json.JSONObject

object SocketManager {
    private var socket: Socket? = null
    
    fun connect(token: String) {
        val opts = IO.Options().apply {
            transports = arrayOf(WebSocket.NAME)
            auth = mapOf("token" to token)
            reconnection = true
            reconnectionAttempts = Int.MAX_VALUE
            reconnectionDelay = 1000
        }
        socket = IO.socket("https://cotuong.xyz", opts)
        socket?.connect()
        startHeartbeat()
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
    
    fun on(event: String, callback: (Array<Any>) -> Unit) {
        socket?.on(event) { args -> callback(args) }
    }
    
    fun emit(event: String, data: JSONObject? = null, ack: ((Array<Any>) -> Unit)? = null) {
        if (ack != null) {
            socket?.emit(event, data, ack)
        } else {
            socket?.emit(event, data)
        }
    }
    
    private fun startHeartbeat() {
        // Gửi ping mỗi 30 giây
        Thread {
            while (socket?.connected() == true) {
                Thread.sleep(30_000)
                socket?.emit("heartbeat:ping")
            }
        }.start()
    }
    
    // Ví dụ: Join lobby
    fun joinLobby(callback: (List<RoomSummary>) -> Unit) {
        emit("lobby:list", null) { args ->
            // Parse args[0] as JSONObject
        }
        on("lobby:update") { args ->
            // Refresh lobby khi có cập nhật
        }
    }
    
    // Ví dụ: Tạo phòng
    fun createRoom(timeMode: String, isPrivate: Boolean, callback: (String?) -> Unit) {
        val data = JSONObject().apply {
            put("timeMode", timeMode)
            put("isPrivate", isPrivate)
        }
        emit("room:create", data) { args ->
            val resp = args[0] as JSONObject
            callback(if (resp.getBoolean("ok")) resp.getString("roomId") else null)
        }
    }
    
    // Ví dụ: Đi nước cờ
    fun makeMove(roomId: String, from: Pair<Int,Int>, to: Pair<Int,Int>, moveIndex: Int) {
        val data = JSONObject().apply {
            put("roomId", roomId)
            put("from", JSONObject().apply { put("row", from.first); put("col", from.second) })
            put("to", JSONObject().apply { put("row", to.first); put("col", to.second) })
            put("moveIndex", moveIndex)
        }
        emit("game:move", data)
    }
}
```

### 5.5 AuthRepository.kt

```kotlin
data class LoginRequest(val email: String, val password: String)
data class AuthResponse(val ok: Boolean, val token: String?, val user: UserDto?)
data class UserDto(val uid: String, val name: String, val elo: Int, val picture: String?)

class AuthRepository {
    
    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = ApiClient.post(
                "/auth/login",
                LoginRequest(email, password),
                AuthResponse::class.java
            )
            if (response.ok && response.token != null) {
                TokenManager.saveToken(response.token)
                Result.success(response)
            } else {
                Result.failure(Exception("Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun loginGoogle(idToken: String): Result<AuthResponse> {
        return try {
            val response = ApiClient.post(
                "/auth/google",
                mapOf("credential" to idToken),
                AuthResponse::class.java
            )
            if (response.ok && response.token != null) {
                TokenManager.saveToken(response.token)
                Result.success(response)
            } else {
                Result.failure(Exception("Google auth failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getCurrentUser(): Result<AuthResponse> {
        return try {
            val response = ApiClient.get("/auth/me", AuthResponse::class.java)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun logout() {
        TokenManager.clearToken()
        SocketManager.disconnect()
    }
}
```

---

## 6. Tích Hợp iOS (Swift)

### 6.1 Dependencies (Package.swift / CocoaPods)

```ruby
# Podfile
pod 'SocketIO', '~> 16.1'
pod 'Alamofire', '~> 5.9'
pod 'GoogleSignIn', '~> 7.1'
pod 'Firebase/Messaging'
```

### 6.2 TokenManager.swift (Keychain)

```swift
import Security
import Foundation

final class TokenManager {
    static let shared = TokenManager()
    private let service = "xyz.cotuong.app"
    private let account = "jwt_token"
    
    var token: String? {
        get { return loadFromKeychain() }
        set {
            if let value = newValue {
                saveToKeychain(value)
            } else {
                deleteFromKeychain()
            }
        }
    }
    
    private func saveToKeychain(_ value: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func loadFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    
    private func deleteFromKeychain() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]
        SecItemDelete(query as CFDictionary)
    }
}
```

### 6.3 ApiClient.swift

```swift
import Foundation

struct ApiError: Error {
    let code: String
    let message: String
}

final class ApiClient {
    static let shared = ApiClient()
    private let baseURL = "https://cotuong.xyz/api"
    private let session = URLSession.shared
    
    private func makeRequest(_ path: String, method: String = "GET", body: [String: Any]? = nil) -> URLRequest {
        var request = URLRequest(url: URL(string: baseURL + path)!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = TokenManager.shared.token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        return request
    }
    
    func get<T: Decodable>(_ path: String, type: T.Type) async throws -> T {
        let (data, _) = try await session.data(for: makeRequest(path))
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    func post<T: Decodable>(_ path: String, body: [String: Any], type: T.Type) async throws -> T {
        let (data, _) = try await session.data(for: makeRequest(path, method: "POST", body: body))
        return try JSONDecoder().decode(T.self, from: data)
    }
}
```

### 6.4 SocketService.swift

```swift
import SocketIO
import Foundation

final class SocketService: ObservableObject {
    static let shared = SocketService()
    
    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private var heartbeatTimer: Timer?
    
    @Published var isConnected = false
    @Published var onlinePresence: [PresenceInfo] = []
    
    func connect(token: String) {
        let url = URL(string: "https://cotuong.xyz")!
        manager = SocketManager(socketURL: url, config: [
            .log(false),
            .compress,
            .connectParams(["token": token]),
            .forceWebsockets(true),
            .reconnects(true),
            .reconnectAttempts(-1),
            .reconnectWait(1)
        ])
        
        socket = manager?.defaultSocket
        setupListeners()
        socket?.connect()
    }
    
    func disconnect() {
        heartbeatTimer?.invalidate()
        socket?.disconnect()
        isConnected = false
    }
    
    private func setupListeners() {
        socket?.on(clientEvent: .connect) { [weak self] _, _ in
            DispatchQueue.main.async {
                self?.isConnected = true
                self?.startHeartbeat()
            }
        }
        
        socket?.on(clientEvent: .disconnect) { [weak self] _, _ in
            DispatchQueue.main.async {
                self?.isConnected = false
            }
        }
        
        socket?.on("presence:update") { [weak self] data, _ in
            guard let dict = data[0] as? [String: Any] else { return }
            // Parse presence update
        }
        
        socket?.on("game:moved") { data, _ in
            guard let dict = data[0] as? [String: Any] else { return }
            NotificationCenter.default.post(name: .gameMoved, object: dict)
        }
        
        socket?.on("game:over") { data, _ in
            guard let dict = data[0] as? [String: Any] else { return }
            NotificationCenter.default.post(name: .gameOver, object: dict)
        }
    }
    
    private func startHeartbeat() {
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.socket?.emit("heartbeat:ping")
        }
    }
    
    // MARK: - Game Actions
    
    func createRoom(timeMode: String, isPrivate: Bool, completion: @escaping (String?) -> Void) {
        socket?.emitWithAck("room:create", [
            "timeMode": timeMode,
            "isPrivate": isPrivate
        ]).timingOut(after: 10) { data in
            guard let dict = data[0] as? [String: Any],
                  let ok = dict["ok"] as? Bool, ok,
                  let roomId = dict["roomId"] as? String else {
                completion(nil); return
            }
            completion(roomId)
        }
    }
    
    func joinRoom(_ roomId: String, completion: @escaping ([String: Any]?) -> Void) {
        socket?.emitWithAck("room:join", ["roomId": roomId]).timingOut(after: 10) { data in
            completion(data[0] as? [String: Any])
        }
    }
    
    func makeMove(roomId: String, from: (row: Int, col: Int), to: (row: Int, col: Int), moveIndex: Int) {
        socket?.emit("game:move", [
            "roomId": roomId,
            "from": ["row": from.row, "col": from.col],
            "to": ["row": to.row, "col": to.col],
            "moveIndex": moveIndex
        ])
    }
    
    func resign(roomId: String) {
        socket?.emit("game:resign", ["roomId": roomId])
    }
    
    func fetchLobby(completion: @escaping ([[String: Any]]) -> Void) {
        socket?.emitWithAck("lobby:list").timingOut(after: 10) { data in
            guard let dict = data[0] as? [String: Any],
                  let rooms = dict["rooms"] as? [[String: Any]] else {
                completion([]); return
            }
            completion(rooms)
        }
    }
}

extension Notification.Name {
    static let gameMoved = Notification.Name("gameMoved")
    static let gameOver = Notification.Name("gameOver")
}
```

### 6.5 AuthService.swift

```swift
import Foundation
import GoogleSignIn

final class AuthService: ObservableObject {
    static let shared = AuthService()
    
    @Published var currentUser: UserModel?
    @Published var isLoggedIn = false
    
    func login(email: String, password: String) async throws {
        let response: AuthResponse = try await ApiClient.shared.post(
            "/auth/login",
            body: ["email": email, "password": password],
            type: AuthResponse.self
        )
        guard response.ok, let token = response.token else {
            throw ApiError(code: "LOGIN_FAILED", message: "Đăng nhập thất bại")
        }
        TokenManager.shared.token = token
        await MainActor.run {
            self.currentUser = response.user
            self.isLoggedIn = true
        }
        SocketService.shared.connect(token: token)
    }
    
    func loginWithGoogle() async throws {
        guard let rootVC = await UIApplication.shared.keyWindow?.rootViewController else { return }
        let signInResult = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootVC)
        guard let idToken = signInResult.user.idToken?.tokenString else {
            throw ApiError(code: "NO_ID_TOKEN", message: "Không lấy được Google token")
        }
        
        let response: AuthResponse = try await ApiClient.shared.post(
            "/auth/google",
            body: ["credential": idToken],
            type: AuthResponse.self
        )
        guard response.ok, let token = response.token else {
            throw ApiError(code: "GOOGLE_AUTH_FAILED", message: "Xác thực Google thất bại")
        }
        TokenManager.shared.token = token
        await MainActor.run {
            self.currentUser = response.user
            self.isLoggedIn = true
        }
        SocketService.shared.connect(token: token)
    }
    
    func logout() async {
        _ = try? await ApiClient.shared.post("/auth/logout", body: [:], type: BaseResponse.self)
        TokenManager.shared.token = nil
        SocketService.shared.disconnect()
        await MainActor.run {
            self.currentUser = nil
            self.isLoggedIn = false
        }
    }
    
    func restoreSession() async {
        guard let token = TokenManager.shared.token else { return }
        do {
            let response: AuthResponse = try await ApiClient.shared.get("/auth/me", type: AuthResponse.self)
            if response.ok {
                await MainActor.run {
                    self.currentUser = response.user
                    self.isLoggedIn = true
                }
                SocketService.shared.connect(token: token)
            } else {
                TokenManager.shared.token = nil
            }
        } catch {
            TokenManager.shared.token = nil
        }
    }
}
```

---

## 7. Quản Lý Token & Làm Mới Phiên

### Thời Hạn Token

| Provider | Thời hạn |
|----------|---------|
| `local` email/password | 30 ngày |
| `google` | 7 ngày |
| `guest` | 365 ngày |

### Chiến Lược Làm Mới

Server **không có refresh token endpoint** riêng. Client cần:

1. Khi nhận lỗi **401** từ bất kỳ API nào → Đăng xuất và yêu cầu người dùng đăng nhập lại.
2. Khi khởi động app → Gọi `GET /auth/me`:
   - `ok: true` → Phiên còn hiệu lực, kết nối Socket.IO
   - `ok: false` hoặc HTTP 401 → Xóa token, chuyển trang đăng nhập

```kotlin
// Android: Khởi động app
viewModelScope.launch {
    val token = TokenManager.getToken()
    if (token == null) {
        navigateTo(Screen.Login)
        return@launch
    }
    val result = authRepo.getCurrentUser()
    result.onSuccess { response ->
        if (response.ok) {
            SocketManager.connect(token)
            navigateTo(Screen.Home)
        } else {
            TokenManager.clearToken()
            navigateTo(Screen.Login)
        }
    }.onFailure {
        navigateTo(Screen.Login)
    }
}
```

---

## 8. Push Notifications

### 8.1 Đăng Ký Push (FCM cho Android / APNs cho iOS)

**Endpoint:**
```
POST /api/push/subscribe
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (Web Push format):**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  }
}
```

> **Lưu ý cho Mobile**: Thay vì Web Push, mobile native dùng FCM/APNs trực tiếp.  
> Cần tích hợp thêm endpoint riêng cho FCM device token. Xem mục [Roadmap](#roadmap).

### 8.2 Loại Thông Báo

| Loại | Sự kiện | Nội dung |
|------|---------|---------|
| Mời vào phòng | `invite:received` | "{Tên} mời bạn đánh cờ" |
| Người theo dõi mới | `new_follower` | "{Tên} đã theo dõi bạn" |
| Thách đấu | `challenge:received` | "{Tên} thách đấu bạn" |

---

## 9. Xử Lý Lỗi Chuẩn

### HTTP Status Codes

| Code | Ý nghĩa |
|------|---------|
| 200 | Thành công |
| 400 | Dữ liệu không hợp lệ |
| 401 | Chưa xác thực / Token hết hạn |
| 403 | Không có quyền |
| 404 | Không tìm thấy |
| 409 | Xung đột (ví dụ: email đã tồn tại) |
| 429 | Vượt giới hạn tốc độ |
| 500 | Lỗi server |

### Error Codes (trong JSON response)

```json
{ "ok": false, "error": "ERROR_CODE" }
```

| Error Code | Ý nghĩa |
|-----------|---------|
| `UNAUTHORIZED` | Cần đăng nhập |
| `INVALID_TOKEN` | Token không hợp lệ |
| `INVALID_CREDENTIALS` | Sai email/mật khẩu |
| `EMAIL_TAKEN` | Email đã đăng ký |
| `WEAK_PASSWORD` | Mật khẩu yếu |
| `TOO_MANY_REQUESTS` | Gửi quá nhiều yêu cầu |
| `ROOM_NOT_FOUND` | Phòng không tồn tại |
| `ROOM_FULL` | Phòng đã đầy |
| `ROOM_LOCKED` | Phòng đã khóa (giải đấu) |
| `ALREADY_IN_GAME` | Đang ở trong ván cờ khác |
| `GAME_NOT_FOUND` | Ván cờ không tồn tại |
| `GUEST_RESTRICTION` | Khách không có quyền |
| `PRIVATE_ROOM` | Phòng riêng tư |
| `USER_NOT_FOUND` | Người dùng không tồn tại |

### Socket.IO Error Pattern

```json
{ "ok": false, "error": "ERROR_CODE", "detail": "Mô tả chi tiết" }
```

---

## 10. Checklist Tích Hợp

### Android

- [ ] Thêm Internet permission vào `AndroidManifest.xml`
- [ ] Cấu hình `network_security_config.xml` nếu test trên localhost
- [ ] Khởi tạo `TokenManager` tại `Application.onCreate()`
- [ ] Implement `AuthInterceptor` cho OkHttp để tự gắn Bearer token
- [ ] Xử lý HTTP 401 → logout + navigate to Login
- [ ] Kết nối Socket.IO tại `onResume()` nếu đã đăng nhập
- [ ] Ngắt Socket.IO tại `onStop()` hoặc duy trì foreground service
- [ ] Gửi `heartbeat:ping` mỗi 30 giây
- [ ] Đăng ký FCM token và gọi `/api/push/subscribe`
- [ ] Test trên thiết bị thật cho SSL pinning

### iOS

- [ ] Thêm `App Transport Security` exception nếu test HTTP
- [ ] Khởi tạo `AuthService.shared.restoreSession()` tại `App.init()`
- [ ] Dùng Keychain (`TokenManager`) thay vì UserDefaults
- [ ] Implement `URLSession` với `Authorization` header interceptor
- [ ] Handle 401 trong tất cả API calls → logout
- [ ] Gọi `SocketService.shared.connect()` sau khi đăng nhập
- [ ] Dùng `NotificationCenter` để broadcast socket events tới SwiftUI Views
- [ ] Cấu hình Background Modes: `Remote notifications`
- [ ] Đăng ký APNs và map sang Web Push subscription

### Chung (Cả 2 Platform)

- [ ] Không log JWT token ra console ở production
- [ ] Refresh UI sau `presence:update`
- [ ] Xử lý network offline: queue moves, retry khi reconnect
- [ ] Hiển thị trạng thái kết nối socket một cách rõ ràng
- [ ] Implement reconnect logic với exponential backoff
- [ ] Test với tài khoản guest và tài khoản thường

---

## Roadmap Mobile

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|--------|
| Đăng nhập Email/Google | ✅ Sẵn sàng | Xem mục 2 |
| REST API đầy đủ | ✅ Sẵn sàng | Xem mục 3 |
| Socket.IO real-time | ✅ Sẵn sàng | Xem mục 4 |
| FCM native endpoint | 🔧 Cần thêm | Server cần nhận FCM device token |
| APNs native endpoint | 🔧 Cần thêm | Tương tự FCM |
| OAuth deep link callback | 🔧 Cần thêm | Cần registered URL scheme |
| ELO history chart | 🔧 Cần thêm | API chưa có |
| Spectator live view | ✅ Sẵn sàng | Dùng `room:watch` + `game:moved` |
| AI offline mode | 📋 Planned | Cần port engine sang mobile |

---

*Tài liệu này được cập nhật theo mã nguồn thực tế của server tại `/server/routes/` và `/server/socket/`. Khi server có thay đổi breaking change, cần cập nhật tài liệu này tương ứng.*
