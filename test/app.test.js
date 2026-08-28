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
        <option value="pvc">Human vs. Computer</option>
      </select>
    </div>
    <div class="control control--difficulty" id="difficulty-control" hidden>
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
    expect(document.querySelector('[data-mode-label]').textContent).toBe('Human vs. Computer');
    expect(document.querySelector('#difficulty-control').hasAttribute('hidden')).toBe(false);
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
});
