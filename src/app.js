/**
 * DOM event logic for tic-tac-toe. This is the ONLY module that touches the DOM.
 *
 * Reads controls, renders the board from game state, handles clicks/keyboard,
 * enforces legal turns, calls the AI in Human-vs-Computer mode, updates the
 * status banner, and resets.
 *
 * Exposes an `init(rootEl)` function so it can be mounted/tested under jsdom
 * without auto-running, plus a `getState()` accessor for tests.
 */

import {
  createInitialState,
  isLegalMove,
  applyMove,
} from './game.js';
import { getMoveByDifficulty } from './ai.js';

/** @typedef {import('./game.js').GameState} GameState */

const MODE_LABELS = {
  pvp: 'Player (X) vs. Player (O)',
  pvc: 'Player (X) vs. Computer (O)',
};

const COMPUTER = 'O'; // In HvC, the human plays X and the computer plays O.
const AI_DELAY_MS = 350; // brief delay so the computer's move is perceptible

/**
 * @param {HTMLElement} rootEl  container element holding the app markup
 * @returns {Object} controller with getState()/reset()/destroy()
 */
export function init(rootEl) {
  /** @type {GameState} */
  let state = createInitialState();
  let mode = 'pvp';
  let difficulty = 'easy';
  let computerTimer = null;

  const boardEl = rootEl.querySelector('#board');
  const statusEl = rootEl.querySelector('#status');
  const modeSelect = rootEl.querySelector('[data-control="mode"]');
  const difficultySelect = rootEl.querySelector('[data-control="difficulty"]');
  const difficultyControl = rootEl.querySelector('#difficulty-control');
  const modeLabel = rootEl.querySelector('[data-mode-label]');
  const resetBtn = rootEl.querySelector('[data-action="reset"]');

  /** Build the 9 cell buttons once and wire delegated-style handlers. */
  function buildBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i += 1) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.index = String(i);
      // No explicit role: the native <button> role is what we want here.
      // (A `gridcell` role would suppress it, and the ARIA grid pattern also
      // requires row wrappers plus arrow-key navigation, which this simple
      // 3x3 board does not implement.)
      cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      boardEl.appendChild(cell);
    }
  }

  /** Whether the board should currently accept human input. */
  function isHumanTurn() {
    if (state.status !== 'ongoing') return false;
    if (mode === 'pvp') return true;
    return state.currentPlayer !== COMPUTER;
  }

  /** Sync DOM cells + status from the current state. */
  function render() {
    const cells = boardEl.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
      const mark = state.board[i];
      cell.textContent = mark || '';
      if (mark) {
        cell.dataset.mark = mark;
        cell.setAttribute('aria-label', `Cell ${i + 1}, ${mark}`);
      } else {
        delete cell.dataset.mark;
        cell.setAttribute('aria-label', `Cell ${i + 1}, empty`);
      }
      cell.classList.toggle('cell--win', Boolean(
        state.winningLine && state.winningLine.includes(i),
      ));
      // Mark cells that can't be played (filled, game over, or computer's
      // turn) with `aria-disabled` rather than the `disabled` property.
      // Setting `disabled` on the element that currently has focus makes the
      // browser drop focus to <body>, which meant a keyboard player lost
      // their place after every single move. `aria-disabled` conveys the same
      // state to assistive tech while keeping the cell focusable; the actual
      // move is already refused by handleCellClick's isHumanTurn/isLegalMove
      // guards, so nothing illegal can get through.
      cell.setAttribute('aria-disabled', String(!isHumanTurn() || Boolean(mark)));
    });

    statusEl.classList.remove('status--win', 'status--draw');
    if (state.status === 'won') {
      statusEl.textContent = `Player ${state.winner} wins!`;
      statusEl.classList.add('status--win');
    } else if (state.status === 'draw') {
      statusEl.textContent = "It's a draw!";
      statusEl.classList.add('status--draw');
    } else if (mode === 'pvc' && state.currentPlayer === COMPUTER) {
      statusEl.textContent = 'Computer is thinking…';
    } else {
      statusEl.textContent = `Player ${state.currentPlayer}'s turn`;
    }
  }

  /** Schedule the computer's move (HvC only), disabling the board meanwhile. */
  function scheduleComputerMove() {
    if (mode !== 'pvc' || state.status !== 'ongoing') return;
    if (state.currentPlayer !== COMPUTER) return;

    render(); // immediately reflect the "thinking…" / disabled state
    computerTimer = setTimeout(() => {
      const move = getMoveByDifficulty(state, difficulty);
      if (move >= 0 && isLegalMove(state, move)) {
        state = applyMove(state, move);
      }
      computerTimer = null;
      render();
    }, AI_DELAY_MS);
  }

  /** Handle a cell click/activation. */
  function handleCellClick(index) {
    if (!isHumanTurn()) return;
    if (!isLegalMove(state, index)) return;
    state = applyMove(state, index);
    render();
    scheduleComputerMove();
  }

  function updateModeIndicator() {
    modeLabel.textContent = MODE_LABELS[mode] || mode;
  }

  function reset() {
    if (computerTimer) {
      clearTimeout(computerTimer);
      computerTimer = null;
    }
    state = createInitialState();
    render();
    // In HvC the computer is O, so X (human) always starts — nothing to schedule.
  }

  function onBoardClick(event) {
    const cell = event.target.closest('.cell');
    if (!cell || !boardEl.contains(cell)) return;
    handleCellClick(Number(cell.dataset.index));
  }

  function onModeChange() {
    mode = modeSelect.value;
    // Difficulty is irrelevant in PvP. Rather than `hidden` (which collapses
    // the field and shifts the board) or `disabled`, the control is visually
    // hidden via a `visibility: hidden` class that reserves its layout box so
    // the page never reflows. `visibility: hidden` also drops it from the tab
    // order + a11y tree, so the select stays enabled yet non-interactive.
    const pvc = mode === 'pvc';
    difficultyControl.classList.toggle('control--hidden', !pvc);
    updateModeIndicator();
    reset();
  }

  function onDifficultyChange() {
    // Difficulty only affects Human-vs-Computer; ignore changes otherwise.
    if (mode !== 'pvc') return;
    difficulty = difficultySelect.value;
    reset();
  }

  // ---- Wire up ----
  buildBoard();
  boardEl.addEventListener('click', onBoardClick);
  modeSelect.addEventListener('change', onModeChange);
  difficultySelect.addEventListener('change', onDifficultyChange);
  resetBtn.addEventListener('click', reset);

  // Difficulty starts hidden (default mode is PvP where it has no effect).
  difficultyControl.classList.toggle('control--hidden', mode !== 'pvc');
  updateModeIndicator();
  render();

  return {
    getState: () => state,
    getMode: () => mode,
    getDifficulty: () => difficulty,
    reset,
    destroy() {
      if (computerTimer) clearTimeout(computerTimer);
      boardEl.removeEventListener('click', onBoardClick);
      modeSelect.removeEventListener('change', onModeChange);
      difficultySelect.removeEventListener('change', onDifficultyChange);
      resetBtn.removeEventListener('click', reset);
    },
  };
}

// Auto-initialize when loaded as a page module (skipped under jsdom tests,
// which call init() directly with a fixture).
if (typeof document !== 'undefined') {
  const start = () => {
    const root = document.querySelector('.app');
    if (root) init(root);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
}
