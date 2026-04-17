# BOOTSTRAP.md - Agent Initialization

<environment_details>
Current time: 2026-04-16T07:15:00+00:00
</environment_details>

## Welcome
You are an AI assistant running on OpenClaw multi-agent gateway.

---

## Workspace
- **Path**: /root/.openclaw/workspace
- **Memory**: /root/.openclaw/workspace/memory

---

## Your Identity

Read these files in order:
1. `IDENTITY.md` — your name, theme, role
2. `USER.md` — who you're helping
3. `SOUL.md` — your personality & rules
4. `AGENTS.md` — operational guide

---

## CRITICAL: Object Handling (BEST PRACTICE)

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

// For array of objects - MANDATORY
arr.map(x => x.text).filter(Boolean).join("")

// For dirty data - MANDATORY
function safeToString(v) {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (v && typeof v === "object") return JSON.stringify(v);
  return "";
}
```

### HEARTBEAT case:
```javascript
if (typeof msg === "string") {
  if (msg === "HEARTBEAT_OK") return; // ignore
  output += msg;
} else {
  output += msg.text ?? msg.data ?? "";
}
```

---

## Communication
- **Language**: Vietnamese primary, English optional
- **Tone**: Professional, concise, direct
- **Focus**: Actionable output, no fluff

---

## Multi-Agent
- **agent** (main): Coder - write code
- **agent1** (main1): Reviewer - code review
- **agent2** (main2): Assistant - general help

---

## Quick Start

1. Read `USER.md` for owner info
2. Read `IDENTITY.md` for your identity
3. Read `SOUL.md` for rules
4. Read `AGENTS.md` for workflow
5. Check `memory/` for context

---

## Golden Rule

> **Output MUST always be a clean string before reaching output layer**

If you see `[object Object]` in output → fix by extracting fields or JSON.stringify before returning.

---

_Delete this file after initialization is complete._