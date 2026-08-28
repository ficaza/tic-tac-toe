/**
 * Pure tic-tac-toe AI logic. No DOM access — fully unit-testable.
 *
 * Basic implementation: provides uniform random move selection and a simple
 * difficulty dispatcher. Optimal minimax play will be layered on top of this
 * module in a later iteration; for now this keeps the pipeline-test build
 * free of complex logic.
 */

import { getAvailableMoves } from './game.js';

/**
 * Pick a uniformly random legal move index.
 * @param {import('./game.js').GameState} state
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getRandomMove(state) {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return -1;
  const idx = Math.floor(Math.random() * moves.length);
  return moves[idx];
}

/**
 * Return the best available move for the current player using a simple
 * heuristic: take an immediate win if one exists, otherwise fall back to a
 * random legal move. (A full minimax implementation replaces this later.)
 * @param {import('./game.js').GameState} state
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getBestMove(state) {
  const moves = getAvailableMoves(state);
  if (moves.length === 0) return -1;

  // Look for an immediate winning move for the current player.
  for (const move of moves) {
    const board = state.board.slice();
    board[move] = state.currentPlayer;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      const m = board[a];
      if (m && m === board[b] && m === board[c]) {
        return move;
      }
    }
  }
  return getRandomMove(state);
}

/**
 * Difficulty dispatcher. Maps a difficulty name to a move.
 *
 * - "easy":   always random.
 * - "medium": heuristic (take a win, else random).
 * - "hard":   heuristic (placeholder until full minimax lands).
 *
 * @param {import('./game.js').GameState} state
 * @param {("easy"|"medium"|"hard")} difficulty
 * @returns {number} a legal move index, or -1 if none are available
 */
export function getMoveByDifficulty(state, difficulty) {
  switch (difficulty) {
    case 'easy':
      return getRandomMove(state);
    case 'medium':
    case 'hard':
      return getBestMove(state);
    default:
      return getRandomMove(state);
  }
}
