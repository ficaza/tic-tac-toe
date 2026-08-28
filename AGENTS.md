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

## CI / Deploy
- `.github/workflows/ci.yml`: lint + test:coverage on push/PR to main & dev. GREEN on main.
- `.github/workflows/deploy.yml`: on push to main + workflow_dispatch. Uses official `actions/configure-pages@v5` (enablement:true) + `actions/upload-pages-artifact@v3` (path: src) + `actions/deploy-pages@v4`. permissions: pages:write, id-token:write.

## KNOWN BLOCKER — GitHub Pages first-time enablement
- The deploy workflow FAILS at "Setup Pages" until Pages is enabled at the repo level.
- First-time Pages enablement (creating the Pages site) requires repo **Administration** permission.
- Neither the available fine-grained API token (no admin scope) NOR the Actions `GITHUB_TOKEN` (even with `pages: write`) can create the Pages site — error: "Resource not accessible by integration".
- Browser is not logged in as repo owner, so settings/pages UI is inaccessible.
- FIX (one-time, by repo owner): Repo Settings → Pages → Build and deployment → Source: **GitHub Actions**. Then re-run the Deploy workflow (Actions UI → "Deploy to GitHub Pages" → Run workflow, or push to main). Site goes live at https://ficaza.github.io/tic-tac-toe/ .
- After enablement, `configure-pages` succeeds (site already exists) and deploy works.

## Local verify commands
`npm install && npm run lint && npm run test:coverage && npm run serve` (localhost:3000).
