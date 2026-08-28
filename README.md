# Tic-Tac-Toe

A playable, accessible, responsive tic-tac-toe web game built with **vanilla HTML, CSS, and JavaScript** (no UI frameworks).

This is the initial **basic implementation** used to validate the CI → GitHub Pages pipeline. The full feature set (minimax difficulty tiers, expanded coverage) is layered on in later iterations.

**Play it:** <https://ficaza.github.io/tic-tac-toe/>

## Features

- Single-screen layout, responsive down to narrow widths.
- Two modes: **Player vs. Player** and **Human vs. Computer**.
- Difficulty selector (Easy / Medium / Hard) shown in HvC mode.
- Full keyboard navigation, visible focus states, and ARIA labels / live status.
- Code split into **pure-logic ES modules** (`src/game.js`, `src/ai.js`) and **one DOM module** (`src/app.js`) so rules and AI are unit-testable without a browser.

## Project structure

| File | Responsibility | DOM access? |
|------|----------------|-------------|
| `src/game.js` | Pure board/game logic: state, legal moves, applying moves, win/draw detection. | No |
| `src/ai.js` | Pure AI logic: random move selection + difficulty dispatcher. | No |
| `src/app.js` | DOM event logic: rendering, click/keyboard handling, turn enforcement, AI scheduling. | Yes (only module) |
| `src/styles.css` | All visual styling: responsive layout, mode indicator, focus/win states. | — |
| `src/index.html` | Semantic, accessible single-screen markup. | — |

## Getting started

```bash
npm install
npm run serve      # dev server at http://localhost:3000
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run serve` | Serve `src/` locally on port 3000. |
| `npm run lint` | Lint with ESLint (flat config). |
| `npm test` | Run the Jest test suite. |
| `npm run test:coverage` | Run tests with coverage thresholds (≥90% on pure-logic modules). |
| `npm run deploy` | Publish `src/` to the `gh-pages` branch manually (CI uses GitHub Actions instead). |

## CI & deployment

- **CI** (`.github/workflows/ci.yml`) runs lint + tests with coverage on pushes and pull requests to `main` and `dev`.
- **Deploy** (`.github/workflows/deploy.yml`) publishes the `src/` directory to GitHub Pages using the official `actions/deploy-pages` action on every push to `main`. No secrets are required — it uses the automatically-provided `GITHUB_TOKEN`.

To enable Pages, set the repository Pages source to **GitHub Actions** (Settings → Pages → Build and deployment → Source: GitHub Actions). The deploy workflow handles the rest.


## Future enhacements

- Implement a server-side backend API that can handle persistent user data, sesions and/or authentication. 
- Additional features may include a timer, a login page, a public leaderboard, winning banners or user interace for an enhaced user experience. 
- E2E testing with gated deployment rules. 