# Tic-Tac-Toe Game Built Using Open Hands

A playable, accessible, responsive tic-tac-toe web game built with vanilla HTML, CSS, and JavaScript (no UI frameworks).

* **Live Demo:** [https://ficaza.github.io/tic-tac-toe/](https://ficaza.github.io/tic-tac-toe/)

---

## Approach & Architecture

The project was designed with a strict **separation of concerns** and an **accessibility-first** mindset:

* **Pure Logic Separation:** Game rules and AI logic are decoupled from the DOM in pure ES modules (`src/game.js`, `src/ai.js`), making them fully unit-testable without a browser environment.
* **Accessibility (a11y):** Built with visible focus states, ARIA labels, and live status regions for screen readers.
* **Responsive Design:** A single-screen layout optimized for both desktop and narrow mobile viewports.

---

## AI Tools & Usage

AI tools were leveraged throughout the development lifecycle to accelerate delivery and ensure high code quality:

* **Code Scaffolding & Logic:** Used AI assistants to draft initial module structures for the minimax difficulty tiers and the game state machine.
* **Testing:** Automated the generation of Jest unit test suites targeting edge cases in win/draw detection and AI move selection.
* **Accessibility Review:** Prompted AI models to audit HTML markup and ARIA live regions to ensure WCAG compliance.

---

## Getting Started & Running the App

### Prerequisites

Make sure you have **Node.js** installed on your system.

### Installation & Local Development

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
```bash
npm install

```


3. Start the local development server:
```bash
npm run serve

```


*The app will be available at `http://localhost:3000`.*

---

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run serve` | Serve the `src/` directory locally on port 3000. |
| `npm run lint` | Lint code using ESLint (flat config). |
| `npm test` | Run the Jest test suite. |
| `npm run test:coverage` | Run tests with coverage thresholds ($\ge 90\%$ on pure-logic modules). |
| `npm run deploy` | Manually publish `src/` to the `gh-pages` branch (CI handles this automatically). |

---

## CI & Deployment

* **CI Pipeline (`.github/workflows/ci.yml`):** Automatically runs linting and tests with coverage checks on pushes and pull requests to `main` and `dev`.
* **Deployment Pipeline (`.github/workflows/deploy.yml`):** Publishes the `src/` directory to GitHub Pages using the official `actions/deploy-pages` action on every push to `main` (requires zero secrets using `GITHUB_TOKEN`).

---

## Challenges, Hurdles, and Future Improvements

### What Didn't Go Quite as Planned

- **Open Hands Project Configuration:** I initially linked the repository directly to the main branch. In hindsight, I should have designated a dev branch as the default environment and explicitly instructed the agent to halt automatic git operations, ensuring manual review and gated deployments.

- **Initial Model Selection:** Configuring a free-tier model required manual entry of its identifier rather than selection from a predefined list. A minor typo caused the harness to fail ungracefully. Implementing a dropdown or selector widget would streamline this process and prevent similar errors.

- **GitHub Token Exposure:** A hardcoded GitHub token was inadvertently saved in package.json. Although never pushed to the repository, it was exposed in the development server's history. I resolved this by deleting the integration configuration and migrating to a fresh Open Hands Cloud environment.

### What I Would Improve With More Time

* Implement a server-side backend API to handle persistent user data, user sessions, and authentication.
  
* Introduce a public leaderboard, match history tracking, a game timer, and polished winning/losing transition banners.
  
* Add comprehensive End-to-End (E2E) testing (e.g., Playwright) tied to gated deployment rules.
