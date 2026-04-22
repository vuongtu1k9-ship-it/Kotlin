# Changelog

## [2.6.0] - 2026-04-16

### Added
- **Dynamic AI Bot System**: Replaced all static bot configurations (`bots.json`, hardcoded level arrays) with a fully database-driven, personality-driven agent system managed via `/admin/bots`.
- **Personality Engine** (`server/socket/engineHandlers.mjs`): Each bot's Pikafish call is now configured by `personality × level × game_phase`:
  - `aggressive` ⚔️ — Short think times (0.35–0.55× base), MultiPV=3, VarietyThreshold=18cp. Fastest in endgame, bursting tactics in midgame.
  - `defensive` 🛡️ — Long think times (1.3–2.2× base), MultiPV=1 (always safest move). Most time in opening establishing structure.
  - `balanced` ⚖️ — Adaptive (0.8–1.2× base), MultiPV=2, VarietyThreshold=8cp. Extra time in complex midgame, confident in endgame.
  - Level scaling: Lv1=350ms → Lv6=4500ms base think time. Per-move jitter: aggressive ±15%, balanced ±25%, defensive ±12%.
- **Pikafish UCI Parameter Verification**: Audited and corrected the actual supported options of the deployed Pikafish binary. Only `MultiPV` and `Move Overhead` are sent; unsupported options (`Contempt`, `Skill Level`, `Slow Mover`) were removed.
- **UCI Protocol Fixes** (`server/uciRunner.mjs`):
  - `setoption` commands now sent **before** `position fen` (strict UCI compliance).
  - `VarietyScoreThreshold` (wrapper-only key) filtered from engine input via `WRAPPER_KEYS`.
  - Score capture extended to single-PV info lines (not only `multipv`-tagged lines).
  - Engine returns `{ move, score }` object enabling downstream commentary context.
- **LLM Bot Commentary** (`server/services/botTauntService.mjs`): Fire-and-forget post-move taunts via Gemini/Groq LLM, cached 12 min in Redis by `personality × phase × score_bucket`.
  - Prompts tuned per personality and game phase (opening/midgame/endgame).
  - Cache key includes 100cp score buckets for meaningful variety without LLM overload.
- **BotSpeechBubble** (`src/components/BotSpeechBubble.tsx`): Animated typing speech bubble with personality-specific color themes, auto-dismisses after 6.5s.
- **BotSelector** (`src/components/setup/BotSelector.tsx`): Shared grid component showing avatar, name, level badge (colour-coded Lv1–6), and personality icon (⚔️🛡️⚖️). Used across all practice/puzzle pages.
- **`useActiveBots` hook** (`src/hooks/useActiveBots.ts`): Fetches `/api/bots/active`, supports auto-select by proximity to a target level. Shared by all 4 pages.
- **`subscribeToBotTaunt`** (`src/net/socket.ts`): Typed socket subscription for `bot:taunt` events; returns unsubscribe cleanup function.
- **20 Personality Bots seeded** (`server/scripts/seedBots.mjs`): Database populated with a diverse roster across all 6 levels and 3 personalities.
- **Full Multi-language Support (i18n)**: All AI agent-related UI components now support both Vietnamese and English:
  - Localized personality labels (Aggressive, Defensive, Balanced).
  - Localized headers and status messages for bot selection.
  - Translation keys synchronized across `public/locales/*.json`.
- **Vietnamese Localization Refinement**: Rewrote all internal agent labels to use formal Vietnamese terms (e.g., "Cẩn trọng" instead of "Phòng thủ" for defensive personality titles).

### Changed
- **`/ai`, `/xep-co-the`, `/puzzles/*`, `/practice/*`** pages now use dynamic bots from DB instead of static level dropdowns. All four pages call `/api/bots/active` and pass `botId` through the engine pipeline.
- **`PuzzleControlPanel`** and **`PracticeControlPanel`**: Replaced Engine + Level select dropdowns with the new `BotSelector` grid.
- **Bot matches are unranked** — no ELO impact, undo/FEN edit/board reset allowed.

### Fixed
- Engine no longer receives unknown UCI options (`Contempt`, `Skill Level`, `Slow Mover`) that would generate "No such option" noise in logs.

## [2.5.1] - 2026-04-11
### Added

- **Project Standardization**: Enforced "Single Source of Truth" by consolidating all backend logic into the `/server` directory.
- **Environment Policies**: Formally defined 3 environments (Local, Dev, Production) with strict deployment rules via GitHub Actions.
- **Automated Quality Gate**: Implemented sequential deployment (Dev → Prod) where Production only deploys if Development passes **Xiangqi Power Gate v3.0**.
- **Manual Hotfix Bypass**: Added a dedicated `workflow_dispatch` path to deploy directly to Production in emergencies.
- **AI Agent Guardrails**: Created `.github/copilot-instructions.md` to ensure autonomous agents follow project-specific architectural and coding standards.

### Changed
- **Massive Directory Cleanup**: Removed over 50 redundant and duplicate files across root, `next/`, `bot/`, and `libs/` to eliminate technical debt and confusion.
- **Documentation Centralization**: Consolidated fragmented performance and rules documentation into unified files within `/docs`.
- **Infrastructure Hardening**: Hardened PM2 configuration on production to use the standardized `/server/index.mjs` path.

### Fixed
- **JavaScript Syntax Errors**: Resolved critical `SyntaxError` on production caused by invalid TypeScript type annotations in `.mjs` files.
- **Deployment Loophole**: Fixed an issue where the production server could accidentally execute legacy root-level files instead of the updated server logic.

## [2.5.0] - 2026-04-11
### Added
- **Unified Media Architecture**: Standardized URL structure for all dynamic images and videos (`/uploads/games/`, `/uploads/puzzles/`, `/uploads/videos/`).
- **Lazy Video Generation**: Implemented on-the-fly video rendering triggered by GET requests. Frontend no longer needs to proactively request exports.
- **High-Quality Video Rendering**: Reintroduced Retina (2x) resolution, 3D piece styling with shadows, and "Coffee Brown" premium board design for exported videos.
- **Dynamic Watermarking**: Automatic `cotuong.xyz` branding centered on the board's river for all generated media.
- **Linux-Standard Logging**: Overhauled the logging system with specialized tags (`[DB]`, `[Auth]`, `[API]`, `[VideoGen]`) and proper severity levels for easier monitoring via `pm2 logs`.

### Changed
- **Optimized Export Payload**: Reduced video export data size by 95% by moving board simulation to the server. Client now only sends initial FEN and move list.
- **Automated Nginx Deployment**: Deployment scripts now automatically update and reload Nginx configurations on production servers.
- **Enhanced Timeout Thresholds**: Synchronized 600s (10 min) timeouts across HAProxy, Varnish, Nginx, and Node.js to support rendering very long games (200+ moves).

### Fixed
- **Protocol Mismatch (502/404)**: Resolved issues where internal health checks and redirects would fail due to IPv4/IPv6 or HTTP/HTTPS conflicts.
- **Silent Catch Blocks**: Fixed multiple instances of empty `catch` blocks in both frontend and backend to ensure background failures are visible.
- **Google One Tap Conflicts**: Prevented multiple initializations of the Google Identity Services script.
- **Game List 404**: Fixed a critical production issue where the `/game` list returned HTML instead of JSON due to Nginx misconfiguration.

## [2.4.0] - 2026-04-09
### Added
- **Natural SEO Content**: Integrated rich, keyword-optimized text sections at the end of Setup, Practice, and Puzzle pages to improve search engine discoverability (NXP).
- **Consolidated SEO Components**: Standardized `SetupSeoContent` and `PracticeSeoContent` components for consistent metadata management.
- **Enhanced Mobile Puzzle Layout**: Reorganized `PuzzleViewPage` to prioritize board and move history (`MoveList`) on mobile viewports for better usability.

### Changed
- **Architectural Modularization**: Completed a major refactoring of large monolithic files (e.g., `LobbyPage`, `SetupPage`, `PracticePage`, `PuzzleViewPage`).
    - Isolated logic into dedicated hooks (`useLobbyData`, `useSetupData`, `usePracticeData`, `usePuzzleData`).
    - Split UI into smaller, focused components (e.g., `RoomListSection`, `LessonList`, `PuzzleControlPanel`).
- **Improved Related Sections UX**: Updated `PuzzleRelatedSection` to intelligently handle loading states and hide itself when no data is available, preventing persistent skeleton loaders.

### Fixed
- **Game Link Slugs**: Corrected battle report links in the "Related Section" to include full SEO-friendly slugs (`game/ROOM_ID-SLUG`).
- **Board Interaction Logic**: Fixed board header and export buttons integration in the new modularized components.

## [2.3.1] - 2026-04-02
### Fixed
- **Connection Resilience**: Added 5s timeouts and non-blocking initialization for Redis and MongoDB connections to prevent server "hanging" on startup or first request.
- **Database Optimization**: Added missing index on `createdByUid` in `puzzles` collection to fix performance degradation for user puzzle listings.
- **Enhanced Diagnostics**: 
    - Upgraded `/health` API to include real-time status of Redis and MongoDB connectivity.
    - Introduced `scripts/check_connectivity.mjs` for standalone connection verification.
- **Logging Clarity**: Switched critical internal logs to `logger.info` for better visibility in production process managers.

## [2.3.0] - 2026-04-01
### Added
- **Puzzle Setup Turn Rule**: Forced Red side to always move first in all newly created puzzles and AI tryout sessions.
- **Simplified Setup UI**: Removed the "Side to move" selection in the Puzzle Setup form to reflect the new fixed-turn rule.
- **In-App Documentation Update**: Added clarification to the "Setup Rules" section regarding the Red-only starting turn.
- **Interactive Ready Check**: Implement mandatory pre-game readiness phase with real-time status updates and situational feedback.
- **Detailed Move Blocking**: Players receive specific guidance when attempting moves before mutual readiness (e.g., "Waiting for the opponent").
- **Live Opponent Alerts**: Real-time toast notifications for "Opponent is Ready" and "Opponent Left Room" events.
- **Exit Safety Confirmation**: Mandatory confirmation dialog to the "Leave Room" action to prevent accidental forfeits.

### Fixed
- **Critical Room-Leave Bug**: Resolved a server-side `ReferenceError` that prevented "Leave Room" from redirecting users and notifying opponents.
- **Security Hardening**:
    - Hardened all public search routes (/players, /tournaments, /puzzles) against NoSQL Injection and ReDoS using strict casting and regex escaping.
    - Implemented coordinate validation and payload verification for all game-move socket events.
- **Banner UI Logic**: Fixed a bug where the "Active Match" banner would incorrectly appear while the user was already on the match page.

## [2.2.0] - 2026-03-30
### Added
- **Unified Layout Architecture**: Global `<Layout>` component and standardized container tokens (`max-w-[1920px]`) for a cohesive platform experience.
- **Enhanced Design Standards**: Documented new UI/UX guidelines in `DEVELOPMENT.md` and `SPEC.md`.

### Changed
- **Typography Audit (Accessibility)**: Replaced hundreds of hardcoded small font classes (`text-[10px]`, etc.) with accessible `text-xs` (12px) and `text-sm` (14px) standards.
- **Standardized Page Headers**: Unified `h1` and subtitle structure across Shop, Players, Practice, and Tournaments.

### Fixed
- **HowToPlay Layout**: Removed restrictive `Card` wrappers to allow headers to breathe.
- **Mobile Readability**: Improved contrast and minimum font sizes for small mobile viewports.

## [2.1.2] - 2026-03-30
### Fixed
- **Tournament Card Miniboards**: Added real-time game previews (miniboards) to the tournament detail page.
- **UI Bug**: Corrected player names in the tournament matchup list (previously showing "Red vs Black").

## [2.0.0] - 2026-03-28
### Added
- **Automated Deployment Pipeline**: Full CI/CD via GitHub Actions and Self-Hosted Runners on Linux.
- **Atomic Deployment**: Symlink-based deployment strategy (`releases/` vs `current/`) for zero-down time.
- **Production Monitoring**: Post-deploy health checks and automated PM2 process management.
- **Infrastructure Docs**: Comprehensive overhaul of `README.md`, `DEPLOYMENT.md`, and `DEVELOPMENT.md`.

### Changed
- **UI Architecture**: Standardized "Cockpit" layout across Puzzles, Practice, and Setup pages (3-column layout).
- **Material Filter**: Optimized material indexing for faster puzzle searches.
- **Engine Standardization**: Standardized Node.js 20+ requirement and Vite 5.0 build pipeline.

### Fixed
- GitHub Actions "Missing Server Host" bug.
- Material filter inaccuracies for specific piece counts.
- Broken setup page layout on mobile viewports.

---

 All notable changes to this project are documented in this file.  
 Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
 Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.1] - 2026-03-26

### Added
- **Admin Comment Moderation**: A centralized dashboard in the Admin Panel to manage all site-wide discussions.
- **In-Place Moderation**: Administrators can now delete comments directly from puzzle, tournament, and game pages.
- **Anti-Spam System**: Implemented Redis-backed rate limiting (5 comments/min) and duplicate detection (60s).
- **Google One Tap**: Seamless automatic login integration for a better user experience.

## [2.1.0] - 2026-03-26

### Added
- **Unified Commenting System**: Introduced a generic commenting system for Puzzles and Tournaments.
    - Integrated real-time updates via Socket.io.
    - Added dedicated "Th thảo luận thế cờ" and "Thảo luận giải đấu" sections.
- **6-Level AI Strategy Selector**: Users can now choose the AI's playing style from 6 distinct personalities (Standard, Defensive, Aggressive, etc.) in the AI Game Page.
- **"Goldilocks" Desktop Layout**: Refined the 3-column interface with a stable 1440px container and optimized gaps for a perfectly centered, cohesive look.
- **Mobile Navigation Controls**: Added⏮◀▶⏭ navigation buttons to the mobile move list for consistency with the desktop experience.

### Changed
- **Optimized Board Scaling**: Updated `Board.css` with a more robust logic to prevent sidebar overlap on high-resolution and ultra-wide displays.
- **Responsive Sidebars**: Sidebars now scale dynamically (300px - 400px) based on screen width to maintain a tight grouping.
- **Deployment Workflow**: Replaced standard Git pull with a faster `rsync` + remote build workflow for production updates.

### Fixed
- **Server ReferenceErrors**: Resolved `targetUid is not defined` in challenge replies and `puzzlesCol` errors in the puzzle-like route.
- **AI Engine Resets**: Fixed a bug where switching AI engines mid-game could lead to invalid move states.
- **History Navigation Loop**: Prevented AI from incorrectly triggering moves while the user is browsing game history.

## [2.0.0] - 2026-03-22

### Released
- **Major Production Milestone**: Consolidated all experimental branches into a single, stable `main` branch.
- **Enhanced Reliability**: Resolved critical production issues including EADDRINUSE conflicts, persistent API 404s, and React rendering crashes.
- **Debug Infrastructure**: Integrated real-time interaction logs for board and chat widget to facilitate future troubleshooting.


---

## [1.1.0] - 2026-03-22

### Added
- **Background Unread Counter**: Chat Widget listens to messages 24/7, even when minimized. Badge switches from online-user-count to unread-message-count (pulsing red).
- **Auto-Navigate on Open**: Clicking the chat icon when unread messages exist automatically jumps to the correct tab (Global / Room / DM).
- **Per-Tab Unread Dots**: Red dot indicators on tab buttons and user avatars show exactly where new messages are.
- **Audio Notification**: Synthetic Web Audio API ping fires when a message arrives in an unfocused tab.
- **Spectator Auto-Routing**: Navigating to a game URL that is full (`ROOM_FULL`) or finished (`GAME_FINISHED`) automatically switches to spectator / replay mode.
- **Live Disconnect Warning**: Pulsing HUD banner appears when an opponent's socket drops mid-game. Timer keeps running.
- **URL Auto-Sync**: Browser address bar updates to `/game/:roomId` on join/create so links are shareable immediately.
- **Chat Player Highlights**: Active players are tagged `[KỲ THỦ]` in red inside the chat — even for late-joining spectators.
- **Endgame Spectator Avatars**: `playersSub` is now included in `game:sync` so finished-game replay pages show player names and avatars.
- **Version & Build Time Footer**: Footer displays `v{APP_VERSION}` + build timestamp — injected at compile time via Vite `define`.

### Fixed
- **Timer Sync on Refresh**: Fixed a bug where the game clock would visually reset to the full turn time (e.g., 3:00) after a page refresh. The server now calculates the exact remaining time based on the active turn start time.
- **Clock Drift**: The client now compensates for clock offset between the server and the local device to ensure timers tick accurately.
- **Room Entry UX (`mode=watch`)**: Removed the `mode=watch` URL parameter and the distinct "Xem" (Watch) button. Users now simply click "Vào phòng" (Enter Room), and the system automatically assigns them as a player or spectator based on room availability.
- **Chat Tab Cross-Contamination**: Switching tabs (Tất cả ↔ Phòng) could load the wrong messages. Server now tags history as `{ roomId, messages }`; clients reject payloads that don't match their room.
- **History "Snap to Live"**: Clicking ⏭ while browsing move history now correctly restores the live board.
- **Live-Move Board Corruption**: Incoming socket moves no longer overwrite the local board while history browsing is active.
- **Draw Display Bug**: Drawn games now correctly show "Hòa nhau" (🤝) instead of incorrectly declaring a winner.
- **Control Button Visibility**: "Xin Hòa" and "Xin Thua" buttons are hidden until a game is in progress. "Ván mới" hidden during active online matches.

---

## [1.0.0] - 2026-03-21

### Added
- Online multiplayer rooms with Red / Black side assignment.
- Spectator (watch-only) mode with full move history replay (⏮ ◀ ▶ ⏭).
- Room-level chat with player identity highlighting.
- Side-swap (Đổi bên) with mutual consent popup.
- Game clock with configurable time controls.
- Draw and resign requests with opponent confirmation flow.
- ELO ranking system and player profile pages.
- AI opponent powered by Pikafish Level 10.
- Tournament bracket management (admin panel).
- Google OAuth + local email/password registration.
- Guest play mode (no login required for local games).
