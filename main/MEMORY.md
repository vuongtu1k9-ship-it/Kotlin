# Memory - Long-term Storage

## Overview
This directory contains persistent memory for the AI agent.

## Structure
```
memory/
└── YYYY-MM-DD.md    # Daily memory entries
```

## Usage
- Agent writes important information here
- Can reference past sessions
- Stores user preferences and context

## Notes
- Memory search requires embedding provider
- Currently disabled (no API key configured)
- Can enable via OPENAI_API_KEY or MISTRAL_API_KEY