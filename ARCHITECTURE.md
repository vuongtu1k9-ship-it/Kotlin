# ARCHITECTURE.md

## System Overview

OpenClaw multi-agent system with Telegram integration.

## Components

### Gateway
- WebSocket server on port 18789
- Connects agents to channels (Telegram, etc.)
- Manages sessions and state

### Agents
- **Design** (agent): Analysis and specs
- **Code** (agent1): Implementation
- **Test** (agent2): Verification

### Channels
- **Telegram**: Bot @Linh020182_bot
- Group: -1003647318348

## Data Flow

```
User → Telegram → Gateway → Agent → Response → Telegram → User
```

## Storage

- `/root/.openclaw/` - Main config and state
- `/root/.openclaw/workspace/` - Agent workspace files
- `/root/.openclaw/agents/` - Agent sessions

## Models

- **Primary**: mistral/mistral-large-latest
- **Fallback**: mistral/mistral-small-latest

---

_Last updated: 2026-04-16_