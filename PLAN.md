# Tic-Tac-Toe — Implementation & Delivery Plan

## 1. Objective

Build and ship a playable, accessible, responsive tic-tac-toe web game using **vanilla HTML, CSS, and JavaScript** (no UI frameworks). The game supports two modes — **Human vs. Computer** and **Player vs. Player** — with an **Easy / Medium / Hard** difficulty selector for the computer opponent. The AI uses a **hybrid of the minimax algorithm and random move selection** to define the difficulty tiers. The app lives on a **single screen**, is organized under a root-level `src/` directory, and is deployed publicly as a static site via **GitHub Pages**. The project includes **ESLint** linting and **Jest** testing with broad coverage and edge cases, plus core npm configuration for a local dev server and GitHub Pages deployment using reliable, non-deprecated dependencies.

---

## 2. Repository & Environment Context

- **Repo:** `ficaza/tic-tac-toe` (HTTPS remote). Branches: `main` (initial commit) and `dev` (current working branch with the initial tooling artifacts).
- **Runtime:** Node.js `v22.x`, npm `v10.x`.
- **Current state (verified):**
  - `package.json` present with devDependencies only; `node_modules/` and `package-lock.json` installed.
  - `npm audit` → **0 vulnerabilities**; `npm outdated` → nothing outdated.
  - Installed devDependencies (all current, non-deprecated):
    - `eslint@^10.9.1` (flat config, `eslint.config.js`)
    - `jest@^30.5.0` (test runner)
    - `jest-environment-jsdom@^30.5.0` (DOM test environment)
    - `serve@^14.2.6` (battle-tested static dev server)
    - `gh-pages@^6.3.0` (battle-tested Pages publisher)
  - `.gitignore` ignores `.agents_tmp`, `node_modules`, `coverage`.
  - `README.md` is a stub (`# tic-tac-toe`).
  - **No `src/` directory, no ESLint config, no Jest config, no CI workflow yet.**
- **Constraints recap:** vanilla only; code in root `src/`; `src/app.js` handles DOM event logic; visuals in a separate CSS file; single-screen static site; GitHub Pages deploy; responsive + accessibility (ARIA, keyboard); hybrid minimax + random AI; enforce legal moves; no deprecated/risky dependencies.

---

## 3. Approach Overview

Split the codebase into **pure-logic ES modules** and **one DOM module** so game rules and AI are fully unit-testable without a browser, while `app.js` stays focused on event handling and rendering. This separation is what makes robust Jest coverage practical.

| File | Responsibility | DOM access? |
|------|----------------|-------------|
| `src/game.js` | Pure board/game logic: state, legal-move validation, applying moves, win/draw detection, available-moves. | No |
| `src/ai.js` | Pure AI logic: minimax (optimal), random selection, difficulty dispatcher blending both. | No |
| `src/app.js` | DOM event logic: reads controls, renders board, handles clicks/keyboard, enforces turns, calls AI, updates status, resets. | Yes (only module) |
| `src/styles.css` | All visual styling: responsive layout, current-mode indicator, focus/win states. | — |
| `src/index.html` | Semantic, accessible single-screen markup; links `styles.css` + `app.js`. | — |

**Difficulty via hybrid AI:**
- **Easy:** 100% random legal move.
- **Medium:** blended (~50% minimax / ~50% random) — challenging but beatable.
- **Hard:** 100% minimax — optimal play (never loses).

**Tooling:** `package.json` defines scripts (`serve`, `lint`, `test`, `deploy`) and devDependencies only (the site is static → no runtime deps). ESLint v10 flat config and Jest v30 with Babel transform for ES modules are configured. A GitHub Actions CI workflow runs lint + test on pushes/PRs; deployment is via the `gh-pages` npm package.

**Why this approach:** Satisfies every requirement (vanilla, `src/`, separate CSS, `app.js` for DOM, single screen, GitHub Pages, accessibility, hybrid minimax, legal-move enforcement) while keeping the testable surface large and the dependency set small, current, and safe.

---

## 4. Dependencies (chosen for reliability & safety)

All are **devDependencies** (no runtime deps — the deployed site is static). All current, widely-adopted, non-deprecated, and audited clean.

| Dependency | Version | Purpose |
|------------|---------|---------|
| `serve` | `^14.2.6` | Battle-tested local static dev server. |
| `gh-pages` | `^6.3.0` | Battle-tested publisher of a directory to the `gh-pages` branch. |
| `jest` | `^30.5.0` | Test runner. |
| `jest-environment-jsdom` | `^30.5.0` | Lets DOM-touching tests run under Jest. |
| `babel-jest` | `^30.x` | Transpiles ES module source for Jest (battle-tested, reliable). |
| `@babel/core` | `^7.x` | Babel core. |
| `@babel/preset-env` | `^7.x` | Smart presets targeting current Node. |
| `eslint` | `^10.9.1` | Linter (flat config). |
| `@eslint/js` | `^10.x` | ESLint recommended rules for flat config. |
| `globals` | `^15.x` | Provides browser/node/jest global declarations. |

**Safety policy:** keep `npm audit` at 0 vulnerabilities; reject any deprecated package; pin majors via caret ranges; review any new dep against `npm audit` and `npm outdated` before adding.

---

## 5. Implementation Steps

### Step 1 — Finalize `package.json`
- **Goal:** Metadata, scripts, and non-deprecated devDependencies.
- **Actions:** Add the missing Babel + ESLint/globals deps listed above. Set `"private": true`. Add scripts:
  - `"serve": "serve src -l 3000"`
  - `"lint": "eslint ."`
  - `"test": "jest"`
  - `"test:coverage": "jest --coverage"`
  - `"deploy": "gh-pages -d src"`
- **Reference:** `package.json` (root).
- **Verify:** `npm install` clean; `npm audit` → 0 vulnerabilities.

### Step 2 — Configure Babel for Jest
- **Goal:** Let Jest import ES module source (`export`/`import`).
- **Actions:** Create `babel.config.json` with `@babel/preset-env` targeting current Node.
- **Reference:** `babel.config.json` (root).

### Step 3 — Configure Jest
- **Goal:** Test environment + coverage thresholds.
- **Actions:** Add a `jest` section in `package.json` (or `jest.config.js`):
  - `testEnvironment: "jsdom"`
  - `collectCoverageFrom: ["src/**/*.js", "!src/app.js"]` (app.js is DOM wiring; coverage focuses on pure logic)
  - `coverageDirectory: "coverage"`
  - Coverage thresholds: ≥90% lines/branches on `game.js` and `ai.js`.
- **Reference:** `package.json` jest config.

### Step 4 — Configure ESLint (v10 flat config)
- **Goal:** Lint JS with current, non-deprecated tooling.
- **Actions:** Create `eslint.config.js` using `@eslint/js` recommended; set `globals.browser` for `src/`, `globals.node`/`globals.jest` for config/test files; lint `src/` and tests. No deprecated shareable configs.
- **Reference:** `eslint.config.js` (root).

### Step 5 — Update `.gitignore`
- **Goal:** Avoid committing build/test artifacts.
- **Actions:** Ensure `node_modules/`, `coverage/`, `.cache/`, OS files ignored (already partially present).
- **Reference:** `.gitignore` (root).

### Step 6 — Build `src/game.js` (pure game logic)
- **Goal:** Encapsulate all rules for unit testing and reuse.
- **Exports:**
  - `WINNING_LINES` constant (3 rows, 3 cols, 2 diagonals).
  - `createInitialState()` → `{ board: Array(9).fill(null), currentPlayer: "X", status: "ongoing", winner: null, winningLine: null }`.
  - `isLegalMove(state, index)` → bool (empty cell, in range, game ongoing).
  - `getAvailableMoves(state)` → array of legal indices.
  - `applyMove(state, index)` → new state (immutably); rejects occupied cells, out-of-range indices, and moves after game over; alternates turns.
  - `checkWinner(state)` → `"X"` | `"O"` | `"draw"` | `null`.
- Board is a 9-length array; state tracks `board`, `currentPlayer`, `status` (`ongoing`/`won`/`draw`), `winner`, `winningLine`.
- **Reference:** `src/game.js`.

### Step 7 — Build `src/ai.js` (pure AI logic)
- **Goal:** Hybrid minimax + random for difficulty.
- **Exports:**
  - `getRandomMove(state)` → uniform pick from `getAvailableMoves`.
  - `getBestMove(state)` → minimax with alpha-beta pruning; optimal move for the computer (always `O`); scored from the computer's perspective.
  - `getMoveByDifficulty(state, difficulty)` → `easy`=random, `medium`=blended (e.g. 50/50), `hard`=minimax.
- Pure functions, no DOM; never returns an illegal move.
- **Reference:** `src/ai.js`.

### Step 8 — Build `src/index.html` (accessible single-screen markup)
- **Goal:** Semantic, accessible structure on one screen.
- **Actions:** Include `<meta name="viewport">`. Sections:
  - Controls panel: mode `<select>` (Human vs Computer / Player vs Player), difficulty `<select>` shown only for HvC, a live **"Current mode"** label/badge.
  - Status banner with `aria-live="polite"` announcing turn/winner.
  - 3×3 board using `role="grid"` with 9 `<button>` cells (`aria-label` per cell, disabled when filled, `aria-pressed` as appropriate).
  - Reset `<button>`.
  - Link `styles.css` and `app.js` (`type="module"`).
- **Reference:** `src/index.html`.

### Step 9 — Build `src/styles.css` (visual + responsive)
- **Goal:** All styling, responsive layout, clear mode indicator.
- **Actions:** CSS Grid board (3 columns), centered flex layout, a highlighted "current mode" badge that changes with selection, media queries for small screens, `:focus-visible` outlines for keyboard a11y, states for winning cells and filled cells. Reduced-motion-friendly (no required animation).
- **Reference:** `src/styles.css`.

### Step 10 — Build `src/app.js` (DOM event logic)
- **Goal:** Wire UI to game/AI; enforce legal moves and turn flow.
- **Actions:** Import `game.js` and `ai.js`; maintain `state`. Listeners:
  - Mode select `change` → toggle difficulty selector, update mode label, reset board.
  - Difficulty select `change` → store difficulty, reset board.
  - Cell click / keyboard (`Enter`/`Space`) → validate via `isLegalMove`; if legal, `applyMove`, re-render, check game over; if HvC and ongoing, schedule computer move via `getMoveByDifficulty` and apply it.
  - Reset button → reinitialize.
- Render function syncs DOM from state: cell text/disabled, status banner + `aria-live` text, highlights winning line. **Disable the board during the computer's "thinking" turn** to prevent invalid moves. Cells reachable via Tab. Structure `app.js` to expose an `init(rootEl)` function so it is testable under jsdom without auto-running.
- **Reference:** `src/app.js`.

### Step 11 — Jest tests for `src/game.js`
- **Goal:** Cover rules + edge cases.
- **Cases:**
  - New game: empty board, `X` to move, status `ongoing`.
  - `isLegalMove`: true for empty cells; false for occupied/out-of-range/after game over.
  - `applyMove`: places correct symbol, alternates turns, rejects illegal moves.
  - Win detection: all 8 winning lines (3 rows, 3 cols, 2 diagonals) for `X` and `O`.
  - Draw detection: full board, no winner.
  - Game-over state blocks further moves.
  - Full valid-game sequence ending in a win.
- **Reference:** `test/game.test.js`.

### Step 12 — Jest tests for `src/ai.js`
- **Goal:** Cover AI behavior + edge cases.
- **Cases:**
  - `getRandomMove`: returns only legal indices, within available set; handles nearly-full board.
  - `getBestMove` (minimax): takes an immediate win; blocks an opponent's immediate win; returns optimal move; never returns an illegal move.
  - `getMoveByDifficulty`: `easy` returns random legal moves (distribution over many runs within legal set); `hard` never loses from a winning position and always takes a forced win; `medium` returns legal moves and exercises the minimax path.
  - Edge: AI move on a board with one empty cell returns that cell.
  - AI never selects an occupied cell across edge boards.
- **Reference:** `test/ai.test.js`.

### Step 13 — jsdom tests for `src/app.js`
- **Goal:** Validate DOM wiring.
- **Cases (lightweight):**
  - Clicking an empty cell places the current player's mark and updates the DOM.
  - Clicking an occupied/finished cell is ignored (no invalid move).
  - Mode switch resets the board and updates the current-mode label.
  - In HvC, after a human move the computer responds automatically and the board was disabled during its turn.
- Structure `app.js` with an exported `init` so tests mount a DOM fixture and drive it deterministically.
- **Reference:** `test/app.test.js`.

### Step 14 — GitHub Actions CI workflow
- **Goal:** Run lint + test on pushes/PRs.
- **Actions:** Add `.github/workflows/ci.yml`: `actions/checkout@v4`, `actions/setup-node@v4` with cache, `npm ci`, `npm run lint`, `npm run test:coverage`. Explicit `permissions: contents: read`. Run on push/PR to `main` and `dev`.
- **Reference:** `.github/workflows/ci.yml`.

### Step 15 — GitHub Pages deployment
- **Goal:** Publish `src/` as a public static site.
- **Actions:** `npm run deploy` (`gh-pages -d src`) publishes `src/` contents to the `gh-pages` branch; enable Pages to serve from the `gh-pages` branch root in repo settings. Optionally wire deploy into CI after tests pass on `main`. Add deploy notes + public URL to README.
- **Reference:** `package.json` scripts, README.

### Step 16 — Update README
- **Goal:** Document setup, scripts, testing, deployment.
- **Sections:** overview; `npm install`; `npm run serve` (dev at localhost:3000); `npm test` / `npm run test:coverage`; `npm run lint`; `npm run deploy`; GitHub Pages URL; accessibility/feature notes.
- **Reference:** `README.md`.

---

## 6. Testing & Validation Plan

**Automated (Jest):**
- `npm test` runs the full suite; `npm run test:coverage` reports coverage with thresholds (≥90% lines/branches on `game.js`/`ai.js`).
- `game.js` suite: legal-move enforcement + all win/draw/game-over edge cases.
- `ai.js` suite: minimax optimality, blocking, forced wins, random-selection bounds, difficulty-dispatch correctness; no illegal moves ever returned.
- `app.js` jsdom suite: cell interaction, illegal-move rejection, mode-switch reset, computer auto-response.

**Lint:** `npm run lint` passes with zero errors on `src/`, config, and test files.

**Manual / browser:**
- `npm run serve` → open localhost:3000.
- Single screen shows mode selector, difficulty selector (HvC only), current-mode label, status banner, board, reset.
- Switching mode/difficulty resets the board and updates the label.
- PvC: human `X` first; computer `O` auto-responds; board disabled during computer turn.
- Illegal moves (occupied cell, move after game over) blocked.
- Easy AI occasionally loses; Hard AI never loses (play optimally → draw/optimal).
- Winning line highlighted; status banner announces winner (also via `aria-live`).
- Responsive: layout reflows on narrow widths.
- Accessibility: full keyboard nav (Tab to cells, Enter/Space to place); visible focus; ARIA roles/labels; SR announcements for turns/results.

**Deployment validation:**
- After `npm run deploy`, the `gh-pages` branch contains `index.html`, `app.js`, `styles.css`.
- With Pages enabled on `gh-pages` branch, the public URL loads the playable game; all modes/difficulties work.
- CI passes (lint + test with coverage) on the PR before merge.

**Dependency safety:**
- `npm audit` → 0 high/critical vulnerabilities; `npm outdated` → nothing outdated; no deprecated packages in the tree (`npm ls` clean). ESLint v10 flat config, Jest v30, serve v14, gh-pages v6 — all current non-deprecated lines.

---

## 7. Edge Cases & Key Coverage

- **Legal moves:** occupied cell, out-of-range index, move after win/draw → all rejected by `isLegalMove`/`applyMove`.
- **Win detection:** every winning line × both symbols; diagonal both directions.
- **Draw:** exactly full board with no winner.
- **AI:** takes immediate win; blocks opponent immediate win; one-empty-cell board; never returns occupied/out-of-range; `medium` blend returns legal moves and sometimes exercises minimax.
- **DOM:** clicking during computer turn ignored; switching mode mid-game resets cleanly; keyboard activation equals click.
- **Difficulty boundary:** `easy` always legal-random; `hard` unbeatable; `medium` legal-only.

---

## 8. Delivery / Definition of Done

- [ ] `src/{index.html, styles.css, app.js, game.js, ai.js}` implemented.
- [ ] `eslint.config.js`, `babel.config.json`, Jest config in place; `npm run lint` clean.
- [ ] `test/{game,ai,app}.test.js` pass; coverage thresholds met.
- [ ] `.github/workflows/ci.yml` green on push/PR.
- [ ] `npm run deploy` publishes to `gh-pages`; public Pages URL playable.
- [ ] README documents setup, scripts, testing, deployment, and features.
- [ ] `npm audit` clean; no deprecated/risky dependencies.
