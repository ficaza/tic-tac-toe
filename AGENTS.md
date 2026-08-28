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
- `getBestMove(state)` — optimal move via minimax; ties broken to lowest index (deterministic).
- `getMoveByDifficulty(state, difficulty, rng=Math.random)`:
  - easy → 100% random
  - medium → ~50% minimax / ~50% random (MEDIUM_OPTIMAL_PROBABILITY=0.5)
  - hard → 100% minimax (never loses)
- Injectable `rng` makes the blend + random selection deterministic under test.

## Difficulty only affects HvC
- In PvP the difficulty `<select>` is hidden AND disabled (not focusable); `onDifficultyChange` no-ops when mode!=='pvc'. `scheduleComputerMove` is gated on mode==='pvc', so difficulty never influences PvP.
- App starts in PvP with difficulty disabled.

## CI / Deploy — BOTH GREEN; Pages is ENABLED
- `.github/workflows/ci.yml`: lint + test:coverage on push/PR to main. GREEN on main.
- `.github/workflows/deploy.yml`: on push to main + workflow_dispatch. Official `actions/configure-pages@v5` (enablement:true) + `actions/upload-pages-artifact@v3` (path: src) + `actions/deploy-pages@v4`. permissions: pages:write, id-token:write.
- GitHub Pages is ENABLED (build_type: workflow). Public site LIVE: https://ficaza.github.io/tic-tac-toe/ (verified: HTTP 200, all assets serve, minimax present in deployed ai.js, cells clickable).
- First-time enablement note: creating the Pages site requires repo Administration permission (the GITHUB_TOKEN / fine-grained API token without admin scope cannot). The repo owner enabled it once in Settings → Pages → Source: GitHub Actions; after that deploy runs succeed automatically.

## Local verify commands
`npm install && npm run lint && npm run test:coverage && npm run serve` (localhost:3000).
