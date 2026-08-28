import {
  createInitialState,
  isLegalMove,
  getAvailableMoves,
  applyMove,
  checkWinner,
  WINNING_LINES,
} from '../src/game.js';

describe('createInitialState', () => {
  it('creates an empty board with X to move', () => {
    const state = createInitialState();
    expect(state.board).toHaveLength(9);
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.currentPlayer).toBe('X');
    expect(state.status).toBe('ongoing');
    expect(state.winner).toBeNull();
    expect(state.winningLine).toBeNull();
  });
});

describe('isLegalMove', () => {
  it('allows a move on an empty cell in an ongoing game', () => {
    const state = createInitialState();
    expect(isLegalMove(state, 0)).toBe(true);
    expect(isLegalMove(state, 8)).toBe(true);
  });

  it('rejects a move on an occupied cell', () => {
    const state = applyMove(createInitialState(), 4); // X at 4
    expect(isLegalMove(state, 4)).toBe(false);
  });

  it('rejects out-of-range indices', () => {
    const state = createInitialState();
    expect(isLegalMove(state, -1)).toBe(false);
    expect(isLegalMove(state, 9)).toBe(false);
  });

  it('rejects non-integer indices', () => {
    const state = createInitialState();
    expect(isLegalMove(state, 1.5)).toBe(false);
    expect(isLegalMove(state, NaN)).toBe(false);
  });

  it('rejects moves after the game is over', () => {
    let state = createInitialState();
    // X wins top row: X at 0,1,2 ; O at 3,4
    state = applyMove(state, 0);
    state = applyMove(state, 3);
    state = applyMove(state, 1);
    state = applyMove(state, 4);
    state = applyMove(state, 2);
    expect(state.status).toBe('won');
    expect(isLegalMove(state, 5)).toBe(false);
  });
});

describe('getAvailableMoves', () => {
  it('returns all indices on an empty board', () => {
    const moves = getAvailableMoves(createInitialState());
    expect(moves).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('excludes occupied cells', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 4);
    expect(getAvailableMoves(state)).toEqual([1, 2, 3, 5, 6, 7, 8]);
  });

  it('returns an empty array after the game is over', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 3);
    state = applyMove(state, 1);
    state = applyMove(state, 4);
    state = applyMove(state, 2); // X wins
    expect(getAvailableMoves(state)).toEqual([]);
  });
});

describe('applyMove', () => {
  it('places the current player mark and alternates turns', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    expect(state.board[0]).toBe('X');
    expect(state.currentPlayer).toBe('O');
    expect(state.status).toBe('ongoing');

    state = applyMove(state, 1);
    expect(state.board[1]).toBe('O');
    expect(state.currentPlayer).toBe('X');
  });

  it('does not mutate the original state', () => {
    const original = createInitialState();
    const next = applyMove(original, 0);
    expect(original.board[0]).toBeNull();
    expect(next.board[0]).toBe('X');
  });

  it('throws on an illegal move', () => {
    const state = applyMove(createInitialState(), 0);
    expect(() => applyMove(state, 0)).toThrow('Illegal move');
    expect(() => applyMove(state, -1)).toThrow('Illegal move');
    expect(() => applyMove(state, 9)).toThrow('Illegal move');
  });

  it('completes a full valid sequence ending in a win', () => {
    let state = createInitialState();
    // X: 0,1,2 (top row win); O: 3,4
    state = applyMove(state, 0); // X
    state = applyMove(state, 3); // O
    state = applyMove(state, 1); // X
    state = applyMove(state, 4); // O
    state = applyMove(state, 2); // X wins
    expect(state.status).toBe('won');
    expect(state.winner).toBe('X');
    expect(state.winningLine).toEqual([0, 1, 2]);
  });
});

describe('checkWinner / win detection', () => {
  it('detects all 8 winning lines for X', () => {
    for (const line of WINNING_LINES) {
      const board = Array(9).fill(null);
      for (const i of line) board[i] = 'X';
      const state = { ...createInitialState(), board };
      expect(checkWinner(state)).toBe('X');
    }
  });

  it('detects all 8 winning lines for O', () => {
    for (const line of WINNING_LINES) {
      const board = Array(9).fill(null);
      for (const i of line) board[i] = 'O';
      const state = { ...createInitialState(), board };
      expect(checkWinner(state)).toBe('O');
    }
  });

  it('detects a draw on a full board with no winner', () => {
    // X: 0,1,5,6,7  O: 2,3,4,8  -> no three-in-a-row
    const board = ['X', 'X', 'O', 'O', 'O', 'X', 'X', 'X', 'O'];
    const state = { ...createInitialState(), board };
    expect(checkWinner(state)).toBe('draw');
  });

  it('returns null for an ongoing game', () => {
    expect(checkWinner(createInitialState())).toBeNull();
    const state = applyMove(createInitialState(), 0);
    expect(checkWinner(state)).toBeNull();
  });

  it('records the winning line on a win', () => {
    let state = createInitialState();
    state = applyMove(state, 2); // X
    state = applyMove(state, 0); // O
    state = applyMove(state, 4); // X
    state = applyMove(state, 1); // O
    state = applyMove(state, 6); // X wins anti-diagonal [2,4,6]
    expect(state.status).toBe('won');
    expect(state.winner).toBe('X');
    expect(state.winningLine).toEqual([2, 4, 6]);
  });

  it('marks a draw with no winner and no winning line', () => {
    const sequence = [0, 3, 1, 4, 5, 2, 6, 8, 7];
    let state = createInitialState();
    for (const idx of sequence) state = applyMove(state, idx);
    expect(state.status).toBe('draw');
    expect(state.winner).toBeNull();
    expect(state.winningLine).toBeNull();
  });
});
