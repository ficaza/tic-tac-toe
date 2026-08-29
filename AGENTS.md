# AGENTS.md — tic-tac-toe repo notes

## Project
Vanilla HTML/CSS/JS tic-tac-toe, single-screen, deployed to GitHub Pages via GitHub Actions.
Repo: `ficaza/tic-tac-toe` (public). Default branch: `main`.

## Architecture
- `src/game.js` — pure board logic (no DOM). Unit-tested.
- `src/ai.js` — pure AI (random + difficulty dispatcher; minimax to be added). Unit-tested.
- `src/app.js` — the ONLY DOM module. Exports `init(rootEl)` for jsdom tests AND auto-inits on `DOMContentLoaded` when loaded as a page module.
- `src/styles.css`, `src/index.html` — uses RELATIVE paths (`./styles.css`, `./app.js`) because GitHub Pages serves at a `/tic-tac-toe/` subpath.
- Tests in `test/`. `app.test.js` uses `@jest-environment jsdom` docblock + fake timers (AI move scheduled via setTimeout).

## Tooling
- `"type": "module"` in package.json (ESM). ESLint v10 flat config (`eslint.config.js`). Babel (`babel.config.json`) transforms ESM for Jest.
- Scripts: `serve` (serve src -l 3000), `lint` (eslint .), `test` / `test:coverage` (jest, 100% coverage on pure modules), `deploy` (gh-pages -d src, manual alternative).
- Test globals: test files need `globals.browser` + `globals.node` + `globals.jest` in eslint config (app tests use `document`).

## AI (src/ai.js) — hybrid minimax + random
- `getRandomMove(state, rng=Math.random)` — uniform random legal move (injectable rng).
- `minimax(state, aiPlayer, depth)` — full minimax; depth-adjusted scores (win=10-depth, loss=depth-10, draw=0) so it prefers quick wins / slow losses.
- `getBestMove(state)` — optimal move via minimax; ties broken to lowest index (deterministic). `getBestMove(empty)===0`, `minimax(empty)===0` (optimal play draws).
- `getMoveByDifficulty(state, difficulty, rng=Math.random)`:
  - easy → 100% random
  - medium → 50% minimax / 50% random (`MEDIUM_OPTIMAL_PROBABILITY=0.5`; boundary: rng<0.5 → optimal, rng>=0.5 → random)
  - hard → 100% minimax (never loses; hard-vs-hard always draws)
- Injectable `rng` makes the blend + random selection deterministic under test.
- Graduated balance (verified by sim, computer=O vs random X, 120 games): hard losses=0, medium losses>0, easy losses>medium.

## Mode labels — cohesive standard
- Both the dropdown `<option>` and the `MODE_LABELS` map / mode indicator use `Player vs. Player` / `Player vs. Computer` ("Player vs. {Opponent}"). Previously the dropdown said "Human vs. Computer" while the indicator said "Player vs. Computer" — now consistent.

## Tests — 78 passing, 100% coverage (stmts/branches/funcs/lines) on ai.js + game.js
- game.js edge cases: non-numeric/non-finite index rejection, win precedence over full board, 9th-move win vs draw, empty moves on finished draw, full immutability, long-sequence turn alternation, WINNING_LINES invariant.
- ai.js edge cases + balance: minimax(empty)=0, getBestMove(empty)=0, multi-win selection, medium boundary + 50/50 ratio, RNG covers all cells, graduated difficulty-balance sim, hard-vs-hard draws.
- app.js edge cases: "Computer is thinking…" status, clicks ignored during thinking, hard blocks human threat, reset mid-game, difficulty-change resets in HvC, destroy() teardown.
- Runtime ~55s locally / ~74s CI (balance sims). If CI time becomes an issue, lower the per-tier GAMES count in the graduated-balance test.

## Difficulty only affects HvC
- In PvP the difficulty field is visually hidden via a `control--hidden` class (`visibility: hidden`), NOT the `hidden` attribute and NOT `disabled`. `visibility: hidden` reserves the element's layout box (so the board and surrounding layout never shift when toggling modes) while dropping it from the tab order + a11y tree, so the select stays enabled yet non-interactive while hidden. Verified: `board.getBoundingClientRect().top` is identical in PvP, HvC, and PvP-again.
- `onDifficultyChange` still no-ops when mode!=='pvc', and `scheduleComputerMove` is gated on mode==='pvc', so difficulty never influences PvP.
- App starts in PvP with the difficulty control hidden via the class.

## CI / Deploy — BOTH GREEN; Pages is ENABLED
- `.github/workflows/ci.yml`: lint + test:coverage on push/PR to main. GREEN on main.
- `.github/workflows/deploy.yml`: on push to main + workflow_dispatch. Official `actions/configure-pages@v6` + `actions/upload-pages-artifact@v5` (path: src) + `actions/deploy-pages@v5`. permissions: pages:write, id-token:write.
- GitHub Pages is ENABLED (build_type: workflow). Public site LIVE: https://ficaza.github.io/tic-tac-toe/ (verified: HTTP 200, all assets serve, minimax present in deployed ai.js, cells clickable).
- First-time enablement note: creating the Pages site requires repo Administration permission (the GITHUB_TOKEN / fine-grained API token without admin scope cannot). The repo owner enabled it once in Settings → Pages → Source: GitHub Actions; after that deploy runs succeed automatically.

## Local verify commands
`npm install && npm run lint && npm run test:coverage && npm run serve` (localhost:3000).
