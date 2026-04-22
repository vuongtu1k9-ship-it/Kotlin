# Xiangqi (Chinese Chess) Online - Design Specification

## 1. Overview
- **Project Name**: Xiangqi Online
- **Type**: Real-time multiplayer online game
- **Core Functionality**: Play Chinese Chess (Xiangqi) against other players online
- **Target Users**: Chinese Chess enthusiasts worldwide

## 2. Game Board Design

### Dimensions
- **Grid**: 9 columns × 10 rows
- **Cell Size**: 60px (desktop), responsive on mobile
- **Board Padding**: 20px

### Board Layout
- **River** (楚河/汉界): Between rows 4-5 (horizontal center)
- **Palace** (九宫): 3×3 areas at each end for generals/advisors

### Colors
- **Board Background**: `#F5E6C8` (warm ivory/cream)
- **Grid Lines**: `#8B4513` (saddle brown)
- **River**: `#87CEEB` (sky blue) with "楚河汉界" text
- **Highlight**: `#FFD700` (gold) for selected piece
- **Valid Move**: `#90EE90` (light green)

## 3. Piece Design

### Dimensions
- **Piece Diameter**: 50px
- **Piece Font**: Bold, clear Chinese characters

### Color Scheme
| Piece Type | Background | Text Color |
|------------|------------|------------|
| Red (紅) | `#DC143C` (crimson) | `#FFFFFF` |
| Black (黑) | `#1C1C1C` | `#FFD700` |

### Pieces (7 types each side)
1. **General/King (帥/將)** - 1 piece
2. **Advisor (仕/士)** - 2 pieces
3. **Elephant (相/象)** - 2 pieces
4. **Horse (馬)** - 2 pieces
5. **Chariot (車)** - 2 pieces
6. **Cannon (炮/砲)** - 2 pieces
7. **Soldier (卒/兵)** - 5 pieces

### Layout
- **Container**: Unified `max-w-[1920px] mx-auto w-full px-4 pt-8 pb-16` outer container for all major pages.
- **Spacing**: Global `space-y-10` between components on major pages.

### Header
- **Standard Page Header**: Single `h1` with `text-4xl md:text-5xl font-black tracking-tighter uppercase` and a nested or adjacent `text-sm font-medium text-slate-500` subtitle.
- **Navigation (Global)**: Home, Puzzles, Players, Tournaments, Shop, How to Play.
- **Top Bar**: Sticky header with logo, user profile/login, and notifications.

### Page Components
- **Unified Wrapper**: Use the `<Layout>` component for consistent SEO, Header, and Footer.
- **Cockpit Layout**: 3-column desktop layout (Sidebar - Board - Sidebar) for Puzzles/Practice.
- **Card/Sections**: Standardized `p-8 md:p-12 rounded-[2.5rem] border border-black/10 bg-white/80` for main content areas.

### Player Panel
- Avatar (40px circle)
- Username
- Timer (countdown)
- Captured pieces display
- Win/Loss record

### Controls
- **New Game** button
- **Undo** (only for own moves)
- **Resign** button
- **Draw** offer
- Timer controls

## 5. Animations

### Piece Movement
- **Duration**: 300ms
- **Easing**: ease-out
- **Effect**: Slight bounce on landing

### Capturing
- **Effect**: Fade out + scale down
- **Duration**: 400ms

### Selection
- **Effect**: Pulse glow
- **Duration**: 500ms loop

## 6. Responsive Breakpoints

| Device | Board Size | Cell Size |
|--------|-------------|-----------|
| Desktop | 600px | 60px |
| Tablet (≤768px) | 480px | 48px |
| Mobile (≤480px) | 360px | 36px |

## 7. Color Palette

### Primary Colors
- **Primary**: `#8B0000` (dark red - Chinese traditional)
- **Secondary**: `#1C1C1C` (near black)
- **Accent**: `#FFD700` (gold)

### Backgrounds
- **Page**: `#2C1810` (dark wood)
- **Cards**: `#F5E6C8` (cream)
- **Sidebar**: `#3D2817` (dark brown)

### Text
- **Primary**: `#FFFFFF`
- **Secondary**: `#CCCCCC`
- **On Board**: `#8B4513`

## 8. Typography

- **Headings**: "Ma Shan Zheng" or "ZCOOL KuaiLe" (Chinese calligraphy fonts)
- **Body**: "Noto Sans SC", sans-serif
- **Sizes**: 
  - **H1 (Page Title)**: 48px - 60px (4xl - 5xl)
  - **H2 (Section Header)**: 24px - 30px
  - **Body (Primary)**: 16px (base)
  - **Instructional/Metadata (Small)**: 12px - 14px (`text-xs` / `text-sm`) - **Mandatory baseline for all UI elements** (no hardcoded smaller sizes like 10px).

## 9. User Interactions

### Desktop
- Click to select piece
- Click valid cell to move
- Drag and drop support

### Mobile
- Tap to select
- Tap destination to move
- Pinch to zoom (optional)

## 10. Game States

1. **Waiting**: Waiting for opponent
2. **Ready**: Both players ready
3. **Playing**: Game in progress
4. **Check**: King under attack
5. **Checkmate**: Game over
6. **Stalemate**: Draw

For detailed room lifecycle and participant rules, see [Match Rules](file:///home/hoan/DATA/xiangqi-web/docs/MATCH_RULES.md).

## 11. Sound Effects (Optional)

- Piece movement: Soft "clack"
- Capture: Sharp "hit" sound
- Check: Warning bell
- Victory: Celebration
- Defeat: Soft sigh

## 13. Observability & Health Monitoring

The project maintains high-availability through a production-grade observability layer.

### Logging Standards
- **Tagged Convention**: Mandatory `[TAG]` prefix (e.g., `[AUTH]`, `[MONGO]`, `[SOCKET]`) for all logs.
- **No Silent Failures**: Every asynchronous worker and error handler must log its state.
- **Log Levels**: 
  - `INFO`: Lifecycle events and heartbeats.
  - `WARN`: Recoverable unexpected states.
  - `ERROR`: Critical failures requiring immediate audit.

### Background Systems Monitoring
- **Bot Sync**: 60s heartbeats in `[BOT_MGR]`.
- **Garbage Collection**: 10m automated sweeps in `[SYS_CLEANUP]`.
- **Room Sweeper**: Real-time orphan/timeout management in `[GAME_SWEEPER]`.
- **AI Worker**: Lifecycle and fallback monitoring in `[AI_GEN]`.

### AI-First Foundation
- **Custom Instructions**: Repository rules are codified in `.github/copilot-instructions.md`.
- **Agent Entry Points**: Standardized directory structure and explicit task templates for autonomous assistants.

## 12. Accessibility

- Keyboard navigation support
- Screen reader announcements for moves
- High contrast mode
- Adjustable piece size
