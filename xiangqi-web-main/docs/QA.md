# QA Checklist & Manual Test Cases — Xiangqi Web

Scope: core gameplay legality (movement, captures, check/checkmate, flying general) + basic UI interaction + responsive/mobile layout.

> Coordinate convention used in code (`src/utils/moveLogic.ts`):
> - `row: 0..9` top→bottom, `col: 0..8` left→right.
> - Black starts at the top (rows 0–3), Red at the bottom (rows 6–9).

---

## 1) Quick QA Checklist (Smoke)

### Build / run
- [ ] `npm install` succeeds
- [ ] `npm run dev` loads without console errors
- [ ] Board renders 9×10, palaces + river gap visible
- [ ] Pieces in standard initial setup for both sides

### Interaction
- [ ] Click/tap selects a piece and indicates selection state
- [ ] Clicking/tapping a legal destination moves the piece
- [ ] Clicking/tapping an occupied enemy square captures
- [ ] Clicking/tapping an allied piece does **not** capture/overlap
- [ ] Illegal moves are blocked (piece remains in place)

### Rules
- [ ] Each piece type obeys movement + blocking rules (see section 2)
- [ ] Cannon capture requires exactly 1 screen; non-capture requires clear line
- [ ] Elephant cannot cross the river; elephant-eye blocking enforced
- [ ] Horse-leg blocking enforced
- [ ] Move that leaves own general in check is rejected
- [ ] Flying general (no pieces between generals on same file) is treated as check
- [ ] Check state is detected (UI feedback may be `alert()`)
- [ ] Checkmate is detected (UI feedback may be `alert()`)

### Mobile / responsive
- [ ] Board fits viewport (no horizontal scroll) on common widths (360px, 390px)
- [ ] Tap targets are usable (cells/pieces not too small)
- [ ] No “double-tap zoom” issues or accidental text selection
- [ ] Orientation change (portrait↔landscape) keeps board usable

---

## 2) Manual Test Cases — Piece Movement & Captures

Guidance: You can run most tests from the initial position, but some require setting up a position. If the app has no position editor, create positions by playing a few preparatory moves.

For each test, **Expected** = the move is either allowed (piece relocates) or disallowed (no move / no capture).

### 2.1 General (帥/將)
1. **Within palace only**
   - Steps: Try moving Red general one step orthogonally **within** the 3×3 palace.
   - Expected: Allowed.
   - Steps: Try moving Red general one step orthogonally **outside** the palace bounds.
   - Expected: Disallowed.
2. **No diagonal / no two-step**
   - Steps: Attempt diagonal move (1,1) or two-step move.
   - Expected: Disallowed.

### 2.2 Advisor (仕/士)
1. **Diagonal within palace**
   - Steps: Move an advisor 1 step diagonally inside palace.
   - Expected: Allowed.
2. **Advisor cannot leave palace**
   - Steps: Attempt any advisor move to a square outside palace.
   - Expected: Disallowed.

### 2.3 Elephant (相/象)
1. **Two-step diagonal with empty eye**
   - Steps: Move elephant exactly 2 rows + 2 cols diagonally.
   - Expected: Allowed if “elephant eye” midpoint is empty.
2. **Elephant-eye blocking**
   - Setup: Place any piece on the midpoint square between from/to.
   - Steps: Attempt same 2×2 diagonal.
   - Expected: Disallowed.
3. **Cannot cross river**
   - Steps: Attempt an elephant move that would land across the river.
   - Expected: Disallowed.

### 2.4 Horse (馬)
1. **Standard L move with clear leg**
   - Steps: Move horse in (2,1) or (1,2) pattern where the “leg” square is empty.
   - Expected: Allowed.
2. **Horse-leg blocking**
   - Setup: Put a piece on the horse’s orthogonally-adjacent “leg” square in the direction of travel.
   - Steps: Attempt the L move.
   - Expected: Disallowed.

### 2.5 Chariot (車)
1. **Orthogonal line move**
   - Steps: Move chariot any number of squares along a rank/file with clear path.
   - Expected: Allowed.
2. **Path blocking**
   - Setup: Keep or place a piece between chariot and destination.
   - Steps: Attempt to move through/over the blocker.
   - Expected: Disallowed.
3. **Capture at end of line**
   - Setup: Clear path to an enemy piece.
   - Steps: Move chariot onto enemy square.
   - Expected: Allowed; enemy removed.

### 2.6 Cannon (炮/砲)
1. **Non-capture requires empty path**
   - Steps: Move cannon like chariot to an empty square with no pieces between.
   - Expected: Allowed.
2. **Non-capture blocked by any screen**
   - Setup: Place 1 piece between cannon and an empty destination.
   - Steps: Attempt non-capture move to that empty destination.
   - Expected: Disallowed.
3. **Capture requires exactly one screen**
   - Setup: Place an enemy piece on same file/rank with exactly 1 piece in between (screen).
   - Steps: Attempt capture.
   - Expected: Allowed.
4. **Capture with 0 screens**
   - Setup: Clear line directly to an enemy piece.
   - Steps: Attempt capture.
   - Expected: Disallowed.
5. **Capture with 2+ screens**
   - Setup: Put 2 pieces between cannon and target.
   - Steps: Attempt capture.
   - Expected: Disallowed.

### 2.7 Soldier (兵/卒)
Run separately for Red and Black, because forward direction differs.

1. **Forward only before river**
   - Steps: Move soldier 1 step forward.
   - Expected: Allowed.
   - Steps: Attempt sideways move before river.
   - Expected: Disallowed.
   - Steps: Attempt backward move.
   - Expected: Disallowed.
2. **Sideways allowed after crossing river**
   - Setup: Advance a soldier across the river.
   - Steps: Attempt 1-step sideways move.
   - Expected: Allowed.

### 2.8 Common capture rules
1. **Cannot capture own piece**
   - Steps: Attempt move onto an allied piece square.
   - Expected: Disallowed.
2. **Capture removes enemy piece**
   - Steps: Capture an enemy piece with any capturing move.
   - Expected: Captured piece disappears; mover occupies the square.

---

## 3) Manual Test Cases — Check / Self-Check / Checkmate / Flying General

### 3.1 Self-check is illegal
1. **Pinned piece cannot expose general**
   - Setup: Arrange a position where moving a guard piece would expose your general to an enemy chariot/cannon line.
   - Steps: Attempt the move that exposes your general.
   - Expected: Disallowed (move rejected).

### 3.2 Check detection
1. **Direct check by chariot**
   - Setup: Clear a file/rank so an enemy chariot attacks your general.
   - Steps: Make the move that gives check.
   - Expected: Check is detected (e.g., UI alert/banner).
2. **Check by horse**
   - Setup: Place enemy horse so it attacks general square (with unblocked leg).
   - Expected: Check detected.
3. **Check by cannon (with screen)**
   - Setup: Cannon + exactly one screen aligned with general.
   - Expected: Check detected.

### 3.3 Flying general rule
1. **Generals cannot face each other on same file with no pieces between**
   - Setup: Clear all pieces between the two generals on the same column.
   - Expected: Side to move is in check (flying general).
2. **A move that opens the file is illegal if it causes flying general**
   - Setup: Have a single piece between generals on same file.
   - Steps: Move that interposing piece away.
   - Expected: Disallowed (because it would leave your general in check).

### 3.4 Escaping check
For any check position, verify the three common defenses:
1. **Move general away**
   - Steps: Move general to a safe palace square.
   - Expected: Allowed only if resulting position is not in check.
2. **Capture the checking piece**
   - Steps: Capture attacker with a legal piece.
   - Expected: Allowed if it resolves check.
3. **Block the check (where applicable)**
   - Setup: Use a line-check (chariot/cannon).
   - Steps: Interpose a piece.
   - Expected: Allowed if it resolves check.

### 3.5 Checkmate detection
1. **Simple mate net**
   - Setup: Create a position where general is in check and has no legal move, cannot capture attacker, and cannot block.
   - Steps: Play the mating move.
   - Expected: Checkmate detected.

Notes:
- Draw/stalemate rules are not implemented (see `docs/RULES_IMPLEMENTED.md`). Don’t file a bug if game doesn’t end on stalemate.

---

## 4) Mobile / Responsive UI Test Cases

Test devices (suggested):
- iPhone-ish: 390×844
- Small Android: 360×800
- Tablet: 768×1024

1. **Board scales correctly**
   - Steps: Load the app in portrait.
   - Expected: Board visible without horizontal scrolling; pieces not clipped.
2. **Tap-to-select and tap-to-move**
   - Steps: Select a piece; then tap a destination.
   - Expected: No need for “precise pixel” taps; move registers reliably.
3. **No accidental browser behaviors**
   - Steps: Rapid taps/drags on board.
   - Expected: No text selection, no pull-to-refresh causing issues, no double-tap zoom.
4. **Orientation change**
   - Steps: Rotate portrait→landscape and back.
   - Expected: Board remains usable; selection state doesn’t break.
5. **Viewport safe areas (notches)**
   - Steps: On iOS Safari (or emulator), verify board not hidden under UI chrome.
   - Expected: Usable; no essential controls off-screen.

---

## 5) Minimal Automated Test Approach (Vitest) — `moveLogic`

Target: fast unit tests for rules in `src/utils/moveLogic.ts`.

### 5.1 What to test (high value)
- `isValidMove` geometry + blocking + capture rules for each piece type
- `isInCheck` for:
  - line attacks (chariot)
  - horse attack
  - cannon attack with screen
  - **flying general**
- `isLegalMove` rejects self-check positions
- `isCheckmate` on a small curated mate position

### 5.2 Suggested test structure
- Create a helper to build an empty 10×9 board and place pieces by (row,col).
- Keep tests small and explicit; avoid relying on initial setup for unit tests.

Example skeleton (not exhaustive):
### 5.3 CI suggestion (later)
- Run `npm test` (vitest) in GitHub Actions on every PR.
- Keep tests deterministic (no UI timing).

---

## 6) Bug Report Template (for issues)

- **Title**: (rule/UI) Short description
- **Build**: commit hash / branch, browser + version, device
- **Steps to reproduce**: numbered
- **Expected**: what should happen per Xiangqi rules / spec
- **Actual**: what happened
- **Screenshots/recording**: if possible
- **Notes**: console errors, suspicious positions
