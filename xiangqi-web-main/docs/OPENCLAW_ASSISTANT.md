# OpenClaw / Telegram “Assistant” notes

Issue **#14** reports that a Telegram assistant sometimes replies with *fake / non-executed* command outputs (e.g. `ping`, `curl`, screenshots).

## Scope: not a xiangqi-web bug

The Xiangqi Web codebase (this repository) does **not** include:
- the Telegram bot runtime,
- the agent/tool orchestration layer (exec/screenshot tools),
- gateway/systemd management, or
- any code that can decide whether a shell command or screenshot is actually executed.

Those behaviors live in the **OpenClaw** assistant/runtime layer (the tool runner / gateway / browser tooling), not in the Xiangqi web app.

## Where to report / fix

Please file issues (and attach logs) in the repository/component that owns the assistant runtime:
- OpenClaw core / gateway / tool execution layer (exec, browser screenshot)

When reporting, include:
- exact user prompt text
- whether the gateway was running
- the tool call log (what tools were actually invoked)
- timestamps + environment (host/node)

## Minimal repo-side mitigation

To reduce confusion, this repo documents that **assistant execution** problems are out-of-scope here, and should be tracked in the OpenClaw/tooling repo instead.

If you are working on ops automation for this project, prefer:
- running commands directly in your terminal / CI, and
- using assistant tooling only when you can verify tool-call logs.

## 🤖 AI-First foundations

This repository is optimized for autonomous AI agents like **GitHub Copilot Cloud Agent** and **OpenClaw**.

- **Autonomous Rules**: See [.github/copilot-instructions.md](file:///home/hoan/DATA/xiangqi-web/.github/copilot-instructions.md) for strict repository rules (Styling, Logging, Deployment).
- **Standardized Observability**: All automated systems use consistent `[TAG]` logging, allowing agents to self-diagnose failures via `pm2 logs`.

### Guidelines for AI Assistants

1. **Follow the Rulebook**: Always adhere to the project personality and standards defined in the `.github` hidden docs.
2. **Atomic Symlink Deployment**: Never suggest direct server edits. Use the standard GitHub Action pipeline.
3. **Use the Agent Task Template**: Use the specialized issue template in this repo for structured task handovers.
