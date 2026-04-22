# Xiangqi Autonomous Bot

This is a modernized, modular bot for the Xiangqi web application.

## Prerequisites
- Node.js installed
- Pikafish engine installed at `/home/hoan/Pikafish/src/pikafish` (or set via `PIKAFISH_PATH`)

## Setup
```bash
cd bot
npm install
```

## Running the Bot

### Option 1: Direct Command
```bash
BASE_URL=https://dev.cotuong.xyz node index.mjs
```

### Option 2: Using PM2 (Production/Persistent)
```bash
BASE_URL=https://dev.cotuong.xyz pm2 start index.mjs --name bot-dev
```

## Configuration Environment Variables
- `BASE_URL`: The target server URL (default: `https://cotuong.xyz`).
- `THINK_TIME_MS`: Time in ms for the engine to think per move (default: `2000`).
- `BOT_EMAIL`: Bot's login email (randomly generated if omitted).
- `BOT_PASSWORD`: Bot's password.
- `PIKAFISH_PATH`: Path to the UCI engine binary.
