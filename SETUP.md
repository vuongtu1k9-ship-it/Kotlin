# SETUP.md

## Environment

- **OS**: Linux (Ubuntu/Debian)
- **Node**: 24.x
- **OpenClaw**: 2026.4.14+

## Installation

```bash
# Install OpenClaw
npm install -g openclaw@latest

# Initialize
openclaw onboard

# Install daemon
openclaw onboard --install-daemon
```

## Configuration

Edit `~/.openclaw/openclaw.json`:
```json
{
  "gateway": {
    "mode": "local",
    "bind": "lan",
    "port": 18789
  },
  "agents": {
    "list": [...]
  },
  "channels": {
    "telegram": {...}
  }
}
```

## Run

```bash
# Start gateway
openclaw gateway start

# Or run in background
openclaw gateway run

# Check status
openclaw status
```

## Troubleshooting

```bash
# Check logs
openclaw logs --follow

# Restart gateway
openclaw gateway restart

# Check doctor
openclaw doctor
```

---

_Last updated: 2026-04-16_