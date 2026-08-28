/**
 * Pure tic-tac-toe AI logic. No DOM access — fully unit-testable.
 *
 * Hybrid AI: a full minimax search (optimal play) combined with uniform
 * random move selection. The two strategies are blended per difficulty tier
 * to scale the computer opponent's strength:
 *
 * - "easy":   100% random — fully beatable.
 * - "medium": 50% minimax / 50% random — challenging but beatable.
 * - "hard":   100% minimax — optimal, never loses.
 *
 * An injectable RNG (`rng`) is accepted throughout so the blend and random
 * selection are deterministic under test.
 */

import {
  getAvailableMoves,
  applyMove,
  checkWinner,
} from './game.js';

/** Score awarded for a win (depth-adjusted so quicker wins rate higher). */
const WIN_SCORE = 10;

/**
 * Pick a uniformly random legal move index.
 * @param {import('./game.js').GameState} state
 * @param {() => number} [rng] optional RNG in [0, 1); defaults to Math.random
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getRandomMove(state, rng = Math.random) {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return -1;
  const idx = Math.floor(rng() * moves.length);
  // Guard against rng()===1 producing an out-of-range index.
  return moves[Math.min(idx, moves.length - 1)];
}

/**
 * Minimax search. Returns the score of `state` from the perspective of
 * `aiPlayer`: positive when aiPlayer wins (sooner = larger), negative when
 * aiPlayer loses (later = larger, i.e. closer to 0), and 0 for a draw.
 *
 * @param {import('./game.js').GameState} state
 * @param {("X"|"O")} aiPlayer  the player the search maximizes for
 * @param {number} depth        plies from the root (used to prefer fast wins)
 * @returns {number}
 */
export function minimax(state, aiPlayer, depth) {
  const result = checkWinner(state);
  if (result === aiPlayer) return WIN_SCORE - depth;
  if (result === 'draw') return 0;
  if (result) return depth - WIN_SCORE; // opponent wins

  const moves = getAvailableMoves(state);
  const isMaximizing = state.currentPlayer === aiPlayer;
  let best = isMaximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove(state, move);
    const score = minimax(next, aiPlayer, depth + 1);
    best = isMaximizing ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

/**
 * Return the optimal move for the current player via minimax.
 * Ties are broken toward the lowest index for deterministic behaviour.
 * @param {import('./game.js').GameState} state
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getBestMove(state) {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return -1;

  const aiPlayer = state.currentPlayer;
  let bestScore = -Infinity;
  let bestMove = moves[0];

  for (const move of moves) {
    const next = applyMove(state, move);
    const score = minimax(next, aiPlayer, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

/** Probability that "medium" plays the optimal (minimax) move (easy=0, medium=0.5, hard=1). */
const MEDIUM_OPTIMAL_PROBABILITY = 0.5;

/**
 * Difficulty dispatcher. Blends minimax and random selection per tier.
 *
 * - "easy":   always random.
 * - "medium": optimal with probability 0.5, else random.
 * - "hard":   always optimal (minimax).
 *
 * @param {import('./game.js').GameState} state
 * @param {("easy"|"medium"|"hard")} difficulty
 * @param {() => number} [rng] optional RNG in [0, 1); defaults to Math.random
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getMoveByDifficulty(state, difficulty, rng = Math.random) {
  switch (difficulty) {
    case 'hard':
      return getBestMove(state);
    case 'medium':
      return rng() < MEDIUM_OPTIMAL_PROBABILITY
        ? getBestMove(state)
        : getRandomMove(state, rng);
    case 'easy':
    default:
      return getRandomMove(state, rng);
  }
}
