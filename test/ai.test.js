import {
  createInitialState,
  applyMove,
  isLegalMove,
  getAvailableMoves,
} from '../src/game.js';
import {
  getRandomMove,
  getBestMove,
  getMoveByDifficulty,
} from '../src/ai.js';

describe('getRandomMove', () => {
  it('returns a legal move on an empty board', () => {
    const state = createInitialState();
    const move = getRandomMove(state);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThan(9);
    expect(isLegalMove(state, move)).toBe(true);
  });

  it('only returns moves within the available set', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 4);
    const available = new Set(getAvailableMoves(state));
    // Run many times to exercise randomness.
    for (let i = 0; i < 50; i += 1) {
      const move = getRandomMove(state);
      expect(available.has(move)).toBe(true);
    }
  });

  it('returns -1 when no moves are available', () => {
    const full = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      status: 'draw',
    };
    expect(getRandomMove(full)).toBe(-1);
  });

  it('returns the only empty cell on a nearly-full board', () => {
    const state = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', null, 'X'],
    };
    expect(getRandomMove(state)).toBe(7);
  });

  it('never selects an occupied cell across edge boards', () => {
    const state = {
      ...createInitialState(),
      board: ['X', null, 'O', null, 'X', 'O', null, null, 'X'],
    };
    for (let i = 0; i < 50; i += 1) {
      const move = getRandomMove(state);
      expect(state.board[move]).toBeNull();
    }
  });
});

describe('getBestMove', () => {
  it('takes an immediate winning move when available', () => {
    // X at 0,1 -> winning move is 2.
    let state = createInitialState();
    state = applyMove(state, 0); // X
    state = applyMove(state, 3); // O
    state = applyMove(state, 1); // X
    state = applyMove(state, 4); // O
    // Now it's X's turn and 2 wins the top row.
    expect(getBestMove(state)).toBe(2);
  });

  it('returns a legal move when no immediate win exists', () => {
    const state = createInitialState();
    const move = getBestMove(state);
    expect(isLegalMove(state, move)).toBe(true);
  });

  it('returns -1 when no moves are available', () => {
    const full = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      status: 'draw',
    };
    expect(getBestMove(full)).toBe(-1);
  });
});

describe('getMoveByDifficulty', () => {
  it('easy always returns a legal move from the available set', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 8);
    const available = new Set(getAvailableMoves(state));
    for (let i = 0; i < 50; i += 1) {
      const move = getMoveByDifficulty(state, 'easy');
      expect(available.has(move)).toBe(true);
    }
  });

  it('hard takes an immediate winning move', () => {
    let state = createInitialState();
    state = applyMove(state, 0); // X
    state = applyMove(state, 3); // O
    state = applyMove(state, 1); // X
    state = applyMove(state, 4); // O
    expect(getMoveByDifficulty(state, 'hard')).toBe(2);
  });

  it('medium takes an immediate winning move', () => {
    let state = createInitialState();
    state = applyMove(state, 0); // X
    state = applyMove(state, 3); // O
    state = applyMove(state, 1); // X
    state = applyMove(state, 4); // O
    expect(getMoveByDifficulty(state, 'medium')).toBe(2);
  });

  it('falls back to a legal move for an unknown difficulty', () => {
    const state = createInitialState();
    const move = getMoveByDifficulty(state, 'unknown');
    expect(isLegalMove(state, move)).toBe(true);
  });

  it('returns -1 when the game is over', () => {
    const full = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      status: 'draw',
    };
    expect(getMoveByDifficulty(full, 'easy')).toBe(-1);
    expect(getMoveByDifficulty(full, 'medium')).toBe(-1);
    expect(getMoveByDifficulty(full, 'hard')).toBe(-1);
  });
});
