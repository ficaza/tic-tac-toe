/**
 * Pure tic-tac-toe game logic. No DOM access — fully unit-testable.
 *
 * Board is represented as an array of 9 cells (indices 0-8):
 *   0 | 1 | 2
 *   3 | 4 | 5
 *   6 | 7 | 8
 *
 * Each cell is either null (empty), "X", or "O".
 */

export const SIZE = 9;

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6], // diagonals
];

/** @typedef {("X"|"O")} Player */
/** @typedef {("ongoing"|"won"|"draw")} GameStatus */

/**
 * @typedef {Object} GameState
 * @property {(Player|null)[]} board   9-cell board.
 * @property {Player} currentPlayer    Player whose turn it is.
 * @property {GameStatus} status       "ongoing" | "won" | "draw".
 * @property {(Player|null)} winner    Winning player, or null.
 * @property {(number[]|null)} winningLine Indices of the winning line, or null.
 */

/**
 * Create a fresh game state. "X" always moves first.
 * @returns {GameState}
 */
export function createInitialState() {
  return {
    board: Array(SIZE).fill(null),
    currentPlayer: 'X',
    status: 'ongoing',
    winner: null,
    winningLine: null,
  };
}

/**
 * Whether `index` is a legal move in the current state.
 * Legal: in range, empty cell, and game still ongoing.
 * @param {GameState} state
 * @param {number} index
 * @returns {boolean}
 */
export function isLegalMove(state, index) {
  if (state.status !== 'ongoing') return false;
  if (!Number.isInteger(index)) return false;
  if (index < 0 || index >= SIZE) return false;
  return state.board[index] === null;
}

/**
 * All legal move indices for the current state.
 * @param {GameState} state
 * @returns {number[]}
 */
export function getAvailableMoves(state) {
  if (state.status !== 'ongoing') return [];
  const moves = [];
  for (let i = 0; i < SIZE; i += 1) {
    if (state.board[i] === null) moves.push(i);
  }
  return moves;
}

/**
 * Inspect a board and return the result: "X", "O", "draw", or null (ongoing).
 * @param {GameState} state
 * @returns {(Player|"draw"|null)}
 */
export function checkWinner(state) {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const mark = state.board[a];
    if (mark && mark === state.board[b] && mark === state.board[c]) {
      return mark;
    }
  }
  if (state.board.every((cell) => cell !== null)) return 'draw';
  return null;
}

/**
 * Apply a move immutably and return the new state.
 * Throws if the move is illegal (caller may instead check isLegalMove first).
 * @param {GameState} state
 * @param {number} index
 * @returns {GameState} new state after the move
 */
export function applyMove(state, index) {
  if (!isLegalMove(state, index)) {
    throw new Error(`Illegal move at index ${index}`);
  }
  const board = state.board.slice();
  const player = state.currentPlayer;
  board[index] = player;

  const result = checkWinner({ ...state, board });
  if (result === 'draw') {
    return {
      board,
      currentPlayer: player,
      status: 'draw',
      winner: null,
      winningLine: null,
    };
  }
  if (result) {
    const winningLine = WINNING_LINES.find((line) => {
      const [a, b, c] = line;
      return board[a] === result && board[b] === result && board[c] === result;
    });
    return {
      board,
      currentPlayer: player,
      status: 'won',
      winner: result,
      winningLine,
    };
  }
  return {
    board,
    currentPlayer: player === 'X' ? 'O' : 'X',
    status: 'ongoing',
    winner: null,
    winningLine: null,
  };
}
