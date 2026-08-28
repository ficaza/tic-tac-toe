/**
 * @jest-environment jsdom
 */

import { init } from '../src/app.js';

const HTML = `
<main class="app">
  <h1 class="app__title">Tic-Tac-Toe</h1>
  <section class="controls" aria-label="Game settings">
    <div class="control">
      <label for="mode-select">Mode</label>
      <select id="mode-select" data-control="mode">
        <option value="pvp" selected>Player vs. Player</option>
        <option value="pvc">Player vs. Computer</option>
      </select>
    </div>
    <div class="control control--difficulty control--hidden" id="difficulty-control">
      <label for="difficulty-select">Difficulty</label>
      <select id="difficulty-select" data-control="difficulty">
        <option value="easy" selected>Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </div>
    <p class="mode-indicator" id="mode-indicator" aria-live="off">
      Current mode: <strong data-mode-label>Player vs. Player</strong>
    </p>
  </section>
  <p class="status" id="status" role="status" aria-live="polite">Player X's turn</p>
  <div class="board" id="board" role="grid" aria-label="Tic-tac-toe board"></div>
  <div class="actions">
    <button type="button" id="reset-btn" data-action="reset">New game</button>
  </div>
</main>
`;

function setup() {
  document.body.innerHTML = HTML;
  const root = document.querySelector('.app');
  return init(root);
}

function cell(index) {
  return document.querySelector(`.cell[data-index="${index}"]`);
}

function clickCell(index) {
  cell(index).click();
}

describe('app DOM wiring', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds a 3x3 board of cells', () => {
    const ctrl = setup();
    expect(document.querySelectorAll('.cell')).toHaveLength(9);
    expect(ctrl.getState().currentPlayer).toBe('X');
    ctrl.destroy();
  });

  it('places the current player mark on a cell click', () => {
    const ctrl = setup();
    clickCell(0);
    expect(cell(0).textContent).toBe('X');
    expect(ctrl.getState().currentPlayer).toBe('O');
    ctrl.destroy();
  });

  it('ignores a click on an occupied cell', () => {
    const ctrl = setup();
    clickCell(0); // X
    clickCell(0); // ignored
    expect(cell(0).textContent).toBe('X');
    expect(ctrl.getState().board.filter((c) => c !== null)).toHaveLength(1);
    ctrl.destroy();
  });

  it('alternates players and updates the status banner', () => {
    const ctrl = setup();
    clickCell(0); // X
    clickCell(4); // O
    expect(cell(0).textContent).toBe('X');
    expect(cell(4).textContent).toBe('O');
    expect(document.getElementById('status').textContent).toBe("Player X's turn");
    ctrl.destroy();
  });

  it('declares a winner and disables further moves', () => {
    const ctrl = setup();
    // X: 0,1,2 ; O: 3,4
    clickCell(0); // X
    clickCell(3); // O
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X wins
    const status = document.getElementById('status');
    expect(status.textContent).toContain('wins');
    expect(ctrl.getState().status).toBe('won');
    // All cells disabled after game over.
    document.querySelectorAll('.cell').forEach((c) => {
      expect(c.disabled).toBe(true);
    });
    ctrl.destroy();
  });

  it('switching mode resets the board and updates the mode label', () => {
    const ctrl = setup();
    clickCell(0);
    expect(cell(0).textContent).toBe('X');
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    // Board reset
    expect(cell(0).textContent).toBe('');
    expect(ctrl.getState().board.every((c) => c === null)).toBe(true);
    // Mode label updated
    expect(document.querySelector('[data-mode-label]').textContent).toBe('Player vs. Computer');
    expect(document.querySelector('#difficulty-control').classList.contains('control--hidden')).toBe(false);
    ctrl.destroy();
  });

  it('hides the difficulty control in PvP (reserved-space class) and shows it in HvC', () => {
    const ctrl = setup();
    const difficultyControl = document.querySelector('#difficulty-control');
    const difficultySelect = document.querySelector('[data-control="difficulty"]');
    // PvP by default -> difficulty irrelevant and hidden via the reserved-space
    // class (NOT the `hidden` attribute, which would collapse layout).
    expect(difficultyControl.classList.contains('control--hidden')).toBe(true);
    expect(difficultyControl.hasAttribute('hidden')).toBe(false);
    // The select is not `disabled`; it is simply non-interactive while hidden.
    expect(difficultySelect.disabled).toBe(false);

    // Switch to HvC -> difficulty becomes relevant and shown.
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    expect(difficultyControl.classList.contains('control--hidden')).toBe(false);

    // Back to PvP -> hidden again, still without the `hidden` attribute.
    document.querySelector('[data-control="mode"]').value = 'pvp';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    expect(difficultyControl.classList.contains('control--hidden')).toBe(true);
    expect(difficultyControl.hasAttribute('hidden')).toBe(false);
    ctrl.destroy();
  });

  it('PvP ignores difficulty: a finished game is a normal two-player result', () => {
    const ctrl = setup();
    // Difficulty is set to "hard" but mode is PvP, so it must not affect play.
    document.querySelector('[data-control="difficulty"]').value = 'hard';
    // X: 0,1,2 (top row win); O: 3,4 — purely human/human sequence.
    clickCell(0); // X
    clickCell(3); // O
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X wins
    expect(ctrl.getState().status).toBe('won');
    expect(ctrl.getState().winner).toBe('X');
    // No computer move should ever have been scheduled in PvP: only 5 marks.
    expect(ctrl.getState().board.filter((c) => c !== null)).toHaveLength(5);
    ctrl.destroy();
  });

  it('in HvC the computer auto-responds after the human moves', () => {
    const ctrl = setup();
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    // Human (X) moves first.
    clickCell(0);
    expect(cell(0).textContent).toBe('X');
    // While the computer is "thinking", board should be disabled.
    expect(cell(1).disabled).toBe(true);
    // Flush the scheduled computer move.
    jest.advanceTimersByTime(400);
    const marks = document.querySelectorAll('.cell');
    const filled = Array.from(marks).filter((c) => c.textContent !== '');
    // Human's X plus computer's O.
    expect(filled).toHaveLength(2);
    ctrl.destroy();
  });

  it('shows "Computer is thinking…" while the computer is preparing its move', () => {
    const ctrl = setup();
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    clickCell(0);
    expect(document.getElementById('status').textContent).toBe('Computer is thinking…');
    jest.advanceTimersByTime(400);
    ctrl.destroy();
  });

  it('ignores human clicks made during the computer thinking window', () => {
    const ctrl = setup();
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    clickCell(0); // X
    // Attempt a second human click before the computer moves.
    clickCell(1);
    expect(cell(1).textContent).toBe('');
    // Still only one mark until the computer responds.
    const filled = Array.from(document.querySelectorAll('.cell')).filter((c) => c.textContent !== '');
    expect(filled).toHaveLength(1);
    jest.advanceTimersByTime(400);
    ctrl.destroy();
  });

  it('on hard difficulty the computer blocks an immediate human threat', () => {
    const ctrl = setup();
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    document.querySelector('[data-control="difficulty"]').value = 'hard';
    document.querySelector('[data-control="difficulty"]').dispatchEvent(new Event('change'));
    // Human X plays 0 then 1, threatening the top row at 2.
    clickCell(0);
    jest.advanceTimersByTime(400); // computer O responds
    clickCell(1);
    jest.advanceTimersByTime(400); // computer O must block at 2
    expect(cell(2).textContent).toBe('O');
    ctrl.destroy();
  });

  it('the reset button clears a board mid-game', () => {
    const ctrl = setup();
    clickCell(0);
    clickCell(4);
    clickCell(1);
    expect(ctrl.getState().board.filter((c) => c !== null)).toHaveLength(3);
    document.getElementById('reset-btn').click();
    expect(ctrl.getState().board.every((c) => c === null)).toBe(true);
    expect(ctrl.getState().currentPlayer).toBe('X');
    expect(ctrl.getState().status).toBe('ongoing');
    ctrl.destroy();
  });

  it('changing difficulty in HvC resets the board', () => {
    const ctrl = setup();
    document.querySelector('[data-control="mode"]').value = 'pvc';
    document.querySelector('[data-control="mode"]').dispatchEvent(new Event('change'));
    clickCell(0);
    jest.advanceTimersByTime(400);
    expect(ctrl.getState().board.filter((c) => c !== null).length).toBeGreaterThan(0);
    // Change difficulty -> board resets.
    document.querySelector('[data-control="difficulty"]').value = 'hard';
    document.querySelector('[data-control="difficulty"]').dispatchEvent(new Event('change'));
    expect(ctrl.getState().board.every((c) => c === null)).toBe(true);
    expect(ctrl.getDifficulty()).toBe('hard');
    ctrl.destroy();
  });

  it('destroys listeners: clicks no longer affect state after destroy', () => {
    const ctrl = setup();
    clickCell(0);
    expect(ctrl.getState().board[0]).toBe('X');
    ctrl.destroy();
    clickCell(4);
    // State captured at destroy time is untouched by later clicks.
    expect(ctrl.getState().board[4]).toBeNull();
  });
});
