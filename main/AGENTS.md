# OpenClaw Agents Operation Guide

## Overview
This workspace contains 3 AI agents powered by Mistral AI for multi-agent development.

---

## Agents Configuration

| Agent | ID | Model | Theme | Role |
|-------|-----|-------|-------|------|
| main | agent | mistral/mistral-small-latest | developer | Coder - Write code |
| main1 | agent1 | mistral/mistral-small-latest | reviewer | Reviewer - Code review |
| main2 | agent2 | mistral/mistral-small-latest | helper | Assistant - General help |

---

## Access
- Dashboard: https://192.168.1.25:18789/
- Telegram: @Linh020182_bot

---

## Session Startup (Bắt buộc)

Before anything:
1. Read `SOUL.md` — your role & communication
2. Read `USER.md` — who you're helping
3. Read `memory/` for recent context
4. Read `IDENTITY.md` — your identity

---

## CODING WORKFLOW (Task → Output)

### Input Format
Task description from user.

### Step 1: Coder (agent) - Generate Code

Coder receives task and outputs clean text response.

**Rules:**
- Be concise and actionable
- Focus on solution

### Step 2: Reviewer (agent1) - Review Code

Reviewer tasks:
1. Fix compile errors
2. Add missing imports
3. Simplify code
4. Ensure builds

### Step 3: Assistant (agent2) - General Help

Provide general assistance, answer questions, help with debugging.

---

## Multi-Agent Collaboration

Delegate via:
```bash
openclaw agent -m "review this code" --agent agent1
openclaw agent -m "help me debug" --agent agent2
```

---

## Commands

```bash
# Check status
openclaw status

# Restart gateway
openclaw gateway restart

# View logs
openclaw logs

# Call agent
openclaw agent -m "Hello" --agent agent

# Call specific agent
openclaw agent -m "review" --agent agent1
openclaw agent -m "help" --agent agent2
```

---

## API Keys
- Mistral: Configured via MISTRAL_API_KEY environment

---

## CRITICAL - Object Handling (BEST PRACTICE)

### Never do this:
```javascript
text += obj              // ❌ [object Object]
console.log("" + obj)  // ❌ [object Object]
arr.join("")            // ❌ [object Object],[object Object]
```

### Always do this:
```javascript
// For single object
JSON.stringify(obj)

// For array of objects
arr.map(x => x.text).filter(Boolean).join("")
// or
arr.map(x => JSON.stringify(x)).join("")

// For dirty data
function safeToString(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object") return JSON.stringify(v);
  return "";
}
```

### HEARTBEAT case (websocket/stream):
```javascript
// ❌ Wrong
output += msg

// ✅ Correct
if (typeof msg === "string") {
  output += msg;
} else {
  output += msg.text ?? msg.data ?? "";
}
```

### HEARTBEAT_OK:
- Ignore completely - never include in output
- Filter at earliest layer

---

## Summary
- `[object Object]` = stringify wrong
- Fix = map correct field before render
- Never concat object directly
- Output MUST always be clean string

---

_Update workflow as needed._