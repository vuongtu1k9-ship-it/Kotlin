# AI Bot System — Technical Specification

> Version: 2.6.0 | Updated: 2026-04-16

## Overview

The AI Bot System provides personality-driven single-player opponents on `/ai`, `/xep-co-the`, `/puzzles/*`, and `/practice/*`. Matches against bots are **interactive** — bots possess unique voices and will comment on the game in real-time using localized dialogue. These matches are **unranked** (no ELO change), and allow undo/FEN editing.

Bots are managed centrally at `/admin/bots` and stored in MongoDB's `bots` collection.

---

## Bot Schema (MongoDB)

```js
{
  _id: ObjectId,
  uid: string,           // Public identifier (6-char hex)
  name: string,          // Display name (Vietnamese)
  email: string,         // Internal: name@bot.cotuong.xyz
  level: 1|2|3|4|5|6,   // Strength 1=beginner, 6=master
  personality: 'aggressive' | 'defensive' | 'balanced',
  avatar: string,        // URL to avatar image
  status: 'online' | 'resting' | 'playing',
  activeMinutes: number,
  restMinutes: number,
  maxGamesPerSession: number,
  playWithHumans: boolean,
  canInvite: boolean,
  acceptInvites: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Personality Engine

### Supported Pikafish UCI Options

> Verified against `/opt/pikafish/pikafish` binary via `uci` command.

| Option | Supported | Usage |
|---|---|---|
| `MultiPV` | ✅ | Sets candidate pool size |
| `Move Overhead` | ✅ | Time management personality |
| `Threads` | ✅ | Pool-level, not per-request |
| `Hash` | ✅ | Pool-level, not per-request |
| `Contempt` | ❌ | Removed in Stockfish 14+ |
| `Skill Level` | ❌ | Not in this build |
| `Slow Mover` | ❌ | Not in this build |

**Strength is simulated entirely via `movetimeMs` (think time).**

### Think Time Formula

```
finalMs = baseLevelTime × phaseMultiplier × personalityMultiplier × jitter
```

**Base time by level:**
```
Lv1=350ms, Lv2=700ms, Lv3=1200ms, Lv4=2000ms, Lv5=3000ms, Lv6=4500ms
```

**Game phase detection:**
```js
isOpening = histLen < 16   // < 16 half-moves
isEndgame = histLen > 60   // > 60 half-moves
// otherwise: midgame
```

### Per-Personality Configuration

#### ⚔️ Aggressive
```
Opening:  base × 0.45 × jitter(0.85–1.15)   [fast instinct]
Midgame:  base × 0.55 × jitter(0.85–1.15)   [tactical burst]
Endgame:  base × 0.35 × jitter(0.85–1.15)   [impatient, risky]

MultiPV = 3, VarietyScoreThreshold = 18cp, Move Overhead = 5ms
```
*Never the most analytical. Often chooses a sharp but sub-optimal move from the top 3.*

#### 🛡️ Defensive
```
Opening:  base × 2.2 × jitter(0.88–1.12)    [foundation-building]
Midgame:  base × 1.8 × jitter(0.88–1.12)    [still cautious]
Endgame:  base × 1.3 × jitter(0.88–1.12)    [simplify safely]
max cap: 7000ms

MultiPV = 1, VarietyScoreThreshold = 0, Move Overhead = 60ms
```
*Always plays the single best-calculated move. No randomness.*

#### ⚖️ Balanced
```
Opening:  base × 1.0 × jitter(0.75–1.25)    [moderate]
Midgame:  base × 1.2 × jitter(0.75–1.25)    [extra for complexity]
Endgame:  base × 0.8 × jitter(0.75–1.25)    [confident]
min cap: 400ms

MultiPV = 2, VarietyScoreThreshold = 8cp, Move Overhead = 15ms
```
*Most human-like feel — thoughtful but not exhausting.*

### Variety Logic (uciRunner.mjs)

When `MultiPV > 1`, the engine generates multiple candidate moves. The wrapper selects the final move:

```
1. Collect all info lines → Map<pvIndex, {move, score}>
2. Find score of candidate #1 (best move)
3. Filter candidates within VarietyScoreThreshold centipawns
4. Randomly select from eligible candidates
```

`VarietyScoreThreshold` is a **wrapper-only** parameter — never sent to Pikafish. Filtered by `WRAPPER_KEYS = new Set(['VarietyScoreThreshold'])`.

---

## LLM Commentary

### Architecture
```
After move ack → fire-and-forget → botTauntService.generateBotTaunt()
    → cache lookup (Redis, 12 min TTL)
    → cache miss: LLM prompt → Gemini/Groq → store in Redis
    → socket.emit('bot:taunt', { botId, name, personality, taunt })
```

### Cache Key
```
bot:taunt:v2:{personality}:{scoreBucket}:{phase}
```
`scoreBucket` = `Math.round(score / 100) * 100` (100cp resolution)

### Prompt Voice Guides

| Personality | Opening | Midgame | Endgame |
|---|---|---|---|
| aggressive | Dọa dẫm ("Khai màn đi!") | Khiêu khích ("Không thoát đâu") | Kiêu ngạo / cáu kỉnh |
| defensive | Trích binh pháp ("Bất động như núi") | Triết lý thế trận | Điềm tĩnh ("Ta đã dự liệu") |
| balanced | Nhận xét trung tính | Phân tích ("Phức tạp hơn tôi nghĩ") | Tự tin / cẩn thận |

---

## Frontend Integration

### Shared Infrastructure

| File | Purpose |
|---|---|
| `src/hooks/useActiveBots.ts` | Fetch `/api/bots/active`, auto-select by level |
| `src/components/setup/BotSelector.tsx` | Grid picker: avatar + name + level badge + icon |
| `src/components/BotSpeechBubble.tsx` | Animated typing bubble (6.5s auto-dismiss) |
| `src/net/socket.ts` → `subscribeToBotTaunt()` | Typed `bot:taunt` subscription |

### Page Integration

| Page | Bot Picker Location | Commentary |
|---|---|---|
| `/ai` | `AiTryoutConfig` (left sidebar) | ✅ `BotSpeechBubble` above BoardHeader |
| `/xep-co-the` | `AiTryoutConfig` (left sidebar) | ✅ `BotSpeechBubble` above BoardHeader |
| `/puzzles/[slug]` | `PuzzleControlPanel` (left col) | — |
| `/practice/[lesson]` | `PracticeControlPanel` (left col) | ✅ `BotSpeechBubble` above BoardHeader |

### Data Flow

```
useActiveBots() → selectedBotId
    ↓
aiConfig = { engine: 'pikafish', level, botId }
    ↓
pikafishApi.ts → socket.emit('engine:bestmove', { ..., botId })
    ↓
engineHandlers.mjs → DB lookup → Personality Engine → Pikafish
    ↓
{ move, score } → ack frontend + fire botTauntService
    ↓
socket.emit('bot:taunt') → BotSpeechBubble
```

---

## Localization (i18n)

The AI Bot system is fully localized using `i18next`. All personality labels, status messages, and selection headers are translated based on the user's active language.

### Translation Keys

| Key | Usage |
|---|---|
| `ai.personality.aggressive` | Personality label on card |
| `ai.personality.defensive` | Personality label on card |
| `ai.personality.balanced` | Personality label on card |
| `setup.tryout.selectBot` | UI Header for bot selection |
| `ai.bot.error_not_found` | Empty state message |

### Vietnamese Nuances
Agent personalities use formal Vietnamese terminology:
- **Aggressive**: `Hung hăng`
- **Defensive**: `Cẩn trọng` (Better than the generic `Phòng thủ`)
- **Balanced**: `Cân bằng`

---

## API

### `GET /api/bots/active`

Returns all non-disabled bots for bot selection UI.

**Response:**
```json
{
  "bots": [
    {
      "uid": "abc123",
      "name": "Thiên Sát",
      "level": 6,
      "personality": "aggressive",
      "avatar": "https://...",
      "status": "online"
    }
  ]
}
```

### Socket: `engine:bestmove` (input)

```js
{
  board: Piece[][],
  side: 'red' | 'black',
  movetimeMs: number,
  history: string[],
  botId?: string          // ← triggers personality engine
}
```

### Socket: `bot:taunt` (output)

```js
{
  botId: string,
  name: string,
  personality: 'aggressive' | 'defensive' | 'balanced',
  taunt: string           // max 100 chars, Vietnamese
}
```

---

## Seeding

Run to sync bot definitions to DB (idempotent, safe to re-run):

```bash
node --env-file=.env server/scripts/seedBots.mjs
```

Bots are upserted by `name`. To add a new bot, add an entry to `botDefinitions` in `seedBots.mjs` and re-run.
