# Heartbeat - Automated Tasks

## Heartbeat Intervals
- **Agent (Manager)**: 30 minutes
- **Agent1 (Coder)**: Disabled
- **Agent2 (Reviewer)**: Disabled

## Current Configuration
```json
{
  "heartbeat": {
    "agent": "30m",
    "agent1": "disabled",
    "agent2": "disabled"
  }
}
```

## Automated Tasks
- Gateway health monitoring (5 min interval)
- Telegram channel status check
- Session management
- Plugin health checks