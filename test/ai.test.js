import {
  createInitialState,
  applyMove,
  isLegalMove,
  getAvailableMoves,
} from '../src/game.js';
import {
  getRandomMove,
  getBestMove,
  minimax,
  getMoveByDifficulty,
} from '../src/ai.js';

// A couple of helpers reused across suites.

// Board where X has 0,1 and can win immediately by playing 2; O has 3,4.
function winningLineForX() {
  let s = createInitialState();
  s = applyMove(s, 0); // X
  s = applyMove(s, 3); // O
  s = applyMove(s, 1); // X
  s = applyMove(s, 4); // O
  return s;
}

// Board where it's O's turn and X threatens to win at index 2 (0,1 taken by X);
// the optimal move for O is to block at 2.
function blockingPositionForO() {
  let s = createInitialState();
  s = applyMove(s, 0); // X
  s = applyMove(s, 3); // O
  s = applyMove(s, 1); // X
  // It's now O's turn.
  return s;
}

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
    for (let i = 0; i < 50; i += 1) {
      expect(available.has(getRandomMove(state))).toBe(true);
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
      expect(state.board[getRandomMove(state)]).toBeNull();
    }
  });

  it('respects an injected rng for deterministic selection', () => {
    const state = createInitialState();
    const move = getRandomMove(state, () => 0);
    expect(move).toBe(0);
  });

  it('guards against an rng returning 1', () => {
    const state = createInitialState();
    const move = getRandomMove(state, () => 1);
    expect(isLegalMove(state, move)).toBe(true);
  });
});

describe('minimax', () => {
  it('scores an immediate win for the AI as a positive (depth-adjusted) value', () => {
    const state = winningLineForX(); // X to move, can win at 2
    const next = applyMove(state, 2); // X wins
    expect(minimax(next, 'X', 0)).toBe(10);
  });

  it('scores an opponent win as a negative value', () => {
    // X: 0,1; O: 3,4,5 (column win). O has won, so for X this is a loss.
    let s = createInitialState();
    s = applyMove(s, 0); // X
    s = applyMove(s, 3); // O
    s = applyMove(s, 1); // X
    s = applyMove(s, 4); // O
    s = applyMove(s, 8); // X
    s = applyMove(s, 5); // O wins column 3,4,5
    expect(minimax(s, 'X', 0)).toBeLessThan(0);
  });

  it('scores a draw as 0', () => {
    const sequence = [0, 3, 1, 4, 5, 2, 6, 8, 7];
    let s = createInitialState();
    for (const idx of sequence) s = applyMove(s, idx);
    expect(minimax(s, 'X', 0)).toBe(0);
  });

  it('prefers a quicker win over a slower one', () => {
    // X can win immediately at 2 (depth-1 win) — minimax of the winning move
    // from the root should beat any deferred-win line.
    const state = winningLineForX();
    const immediate = applyMove(state, 2);
    expect(minimax(immediate, 'X', 0)).toBeGreaterThan(minimax(applyMove(state, 5), 'X', 0));
  });
});

describe('getBestMove (minimax-optimal)', () => {
  it('takes an immediate winning move', () => {
    expect(getBestMove(winningLineForX())).toBe(2);
  });

  it('blocks an opponent immediate winning move', () => {
    // X threatens 0,1,2 by playing 2; O to move must block at 2.
    const state = blockingPositionForO();
    expect(getBestMove(state)).toBe(2);
  });

  it('returns a legal move when no immediate win/block is forced', () => {
    const state = createInitialState();
    expect(isLegalMove(state, getBestMove(state))).toBe(true);
  });

  it('never returns an illegal or occupied cell', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 4);
    const move = getBestMove(state);
    expect(state.board[move]).toBeNull();
  });

  it('returns -1 when no moves are available', () => {
    const full = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      status: 'draw',
    };
    expect(getBestMove(full)).toBe(-1);
  });

  it('never loses from a winning position over many full games vs random play', () => {
    // The computer is O (plays second). Human X plays uniformly at random.
    // With optimal O, O must never lose (win or draw) regardless of X's play.
    for (let game = 0; game < 60; game += 1) {
      let s = createInitialState();
      while (s.status === 'ongoing') {
        if (s.currentPlayer === 'X') {
          // Random human move.
          s = applyMove(s, getRandomMove(s));
        } else {
          // Optimal computer move.
          s = applyMove(s, getBestMove(s));
        }
      }
      expect(s.winner).not.toBe('X'); // computer (O) never loses
    }
  });

  it('as X (first player) never loses vs random play', () => {
    for (let game = 0; game < 60; game += 1) {
      let s = createInitialState();
      while (s.status === 'ongoing') {
        if (s.currentPlayer === 'X') {
          s = applyMove(s, getBestMove(s)); // optimal X
        } else {
          s = applyMove(s, getRandomMove(s)); // random O
        }
      }
      expect(s.winner).not.toBe('O'); // X never loses
    }
  });
});

describe('getMoveByDifficulty', () => {
  it('easy always returns a legal move from the available set', () => {
    let state = createInitialState();
    state = applyMove(state, 0);
    state = applyMove(state, 8);
    const available = new Set(getAvailableMoves(state));
    for (let i = 0; i < 50; i += 1) {
      expect(available.has(getMoveByDifficulty(state, 'easy'))).toBe(true);
    }
  });

  it('easy is random: it does not always take an immediate winning move', () => {
    const state = winningLineForX(); // optimal move is 2
    let tookWin = 0;
    for (let i = 0; i < 100; i += 1) {
      if (getMoveByDifficulty(state, 'easy') === 2) tookWin += 1;
    }
    // Random play wins immediately far less often than 100% of the time.
    expect(tookWin).toBeLessThan(100);
  });

  it('hard takes an immediate winning move', () => {
    expect(getMoveByDifficulty(winningLineForX(), 'hard')).toBe(2);
  });

  it('hard blocks an opponent immediate winning move', () => {
    expect(getMoveByDifficulty(blockingPositionForO(), 'hard')).toBe(2);
  });

  it('medium uses the optimal move when the rng selects the minimax path', () => {
    // rng() = 0 (< 0.5) => optimal path.
    expect(getMoveByDifficulty(winningLineForX(), 'medium', () => 0)).toBe(2);
  });

  it('medium uses a random (still legal) move when the rng selects the random path', () => {
    // rng() = 0.9 (>= 0.5) => random path; must be legal but not forced to be 2.
    const state = winningLineForX();
    const move = getMoveByDifficulty(state, 'medium', () => 0.9);
    expect(isLegalMove(state, move)).toBe(true);
  });

  it('medium sometimes picks the optimal move and sometimes does not (blend)', () => {
    const state = winningLineForX();
    let optimal = 0;
    let other = 0;
    for (let i = 0; i < 200; i += 1) {
      const move = getMoveByDifficulty(state, 'medium');
      if (move === 2) optimal += 1;
      else other += 1;
    }
    expect(optimal).toBeGreaterThan(0);
    expect(other).toBeGreaterThan(0); // proves it is a true blend, not always optimal
  });

  it('falls back to a legal move for an unknown difficulty', () => {
    const state = createInitialState();
    expect(isLegalMove(state, getMoveByDifficulty(state, 'unknown'))).toBe(true);
  });

  it('returns -1 when the game is over for every difficulty', () => {
    const full = {
      ...createInitialState(),
      board: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'],
      status: 'draw',
    };
    expect(getMoveByDifficulty(full, 'easy')).toBe(-1);
    expect(getMoveByDifficulty(full, 'medium')).toBe(-1);
    expect(getMoveByDifficulty(full, 'hard')).toBe(-1);
  });

  it('hard never loses as O over many full games vs random human X', () => {
    for (let game = 0; game < 60; game += 1) {
      let s = createInitialState();
      while (s.status === 'ongoing') {
        if (s.currentPlayer === 'X') s = applyMove(s, getRandomMove(s));
        else s = applyMove(s, getMoveByDifficulty(s, 'hard'));
      }
      expect(s.winner).not.toBe('X');
    }
  });
});

describe('AI edge cases and difficulty balance', () => {
  it('minimax of an empty board is 0 (optimal play draws)', () => {
    expect(minimax(createInitialState(), 'X', 0)).toBe(0);
    expect(minimax(createInitialState(), 'O', 0)).toBe(0);
  });

  it('getBestMove on an empty board returns 0 (deterministic tie-break, all draws)', () => {
    expect(getBestMove(createInitialState())).toBe(0);
  });

  it('getBestMove picks a winning cell when several winning moves exist', () => {
    // X: 0,1,4 ; O: 3,5,6 -> 6 plies, X to move.
    // X can win immediately at 2 (top row [0,1,2]) or at 8 (diagonal [0,4,8]).
    const moves = [0, 3, 1, 5, 4, 6];
    let s = createInitialState();
    for (const m of moves) s = applyMove(s, m);
    expect(s.currentPlayer).toBe('X');
    const move = getBestMove(s);
    const next = applyMove(s, move);
    expect(next.status).toBe('won');
    expect(next.winner).toBe('X');
  });

  it('medium at the exact boundary rng()=0.5 takes the random path', () => {
    // rng() < MEDIUM_OPTIMAL_PROBABILITY (0.5) is optimal; >= 0.5 is random.
    // 0.5 must therefore select the random branch (not forced to the winning cell 2).
    const state = winningLineForX();
    const move = getMoveByDifficulty(state, 'medium', () => 0.5);
    expect(isLegalMove(state, move)).toBe(true);
    // It may or may not be the optimal cell, but the branch taken is the random one.
  });

  it('medium just below the boundary takes the optimal path', () => {
    const state = winningLineForX();
    expect(getMoveByDifficulty(state, 'medium', () => 0.499)).toBe(2);
  });

  it('getRandomMove can eventually return every available cell', () => {
    const state = createInitialState();
    const seen = new Set();
    for (let i = 0; i < 500 && seen.size < 9; i += 1) {
      seen.add(getRandomMove(state));
    }
    expect(seen.size).toBe(9);
  });

  it('medium blend ratio is near 50/50 over many samples', () => {
    const state = winningLineForX(); // optimal = 2
    let optimal = 0;
    const samples = 400;
    for (let i = 0; i < samples; i += 1) {
      if (getMoveByDifficulty(state, 'medium') === 2) optimal += 1;
    }
    const ratio = optimal / samples;
    // Allow a wide band; the point is it is neither ~0 nor ~1.
    expect(ratio).toBeGreaterThan(0.3);
    expect(ratio).toBeLessThan(0.7);
  });

  it('difficulty is graduated: hard loses least, easy loses most, medium between', () => {
    // Computer is O (second) vs a random human X. Over many games the loss count
    // should strictly decrease as difficulty rises: easy > medium >= hard(0).
    const GAMES = 120;
    const losses = { easy: 0, medium: 0, hard: 0 };

    for (const diff of ['easy', 'medium', 'hard']) {
      for (let game = 0; game < GAMES; game += 1) {
        let s = createInitialState();
        while (s.status === 'ongoing') {
          if (s.currentPlayer === 'X') s = applyMove(s, getRandomMove(s));
          else s = applyMove(s, getMoveByDifficulty(s, diff));
        }
        if (s.winner === 'X') losses[diff] += 1;
      }
    }

    // Hard is optimal -> must never lose to a random opponent.
    expect(losses.hard).toBe(0);
    // Easy is fully random -> loses far more often than medium.
    expect(losses.easy).toBeGreaterThan(losses.medium);
    // Medium still loses some games (it is not optimal), confirming the blend.
    expect(losses.medium).toBeGreaterThan(0);
  });

  it('hard vs hard always ends in a draw (both optimal)', () => {
    for (let game = 0; game < 30; game += 1) {
      let s = createInitialState();
      while (s.status === 'ongoing') {
        s = applyMove(s, getMoveByDifficulty(s, 'hard'));
      }
      expect(s.status).toBe('draw');
    }
  });
});
