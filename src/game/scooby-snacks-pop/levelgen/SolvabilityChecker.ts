/**
 * SolvabilityChecker — validates that a board has at least one valid pop sequence.
 *
 * A board is solvable if at least one cell has a connected group of 2+ same-type treat.
 * Pure function, no side effects, no random.
 */
import type { BoardCell } from '../entities/TreatBubble';
import { floodFill } from '../state/boardLogic';

export interface SolvabilityResult {
  solvable: boolean;
  /** Index of the first valid tap cell found, or -1 if none. */
  firstValidCell: number;
}

/**
 * Check whether at least one valid pop exists on the board.
 * Iterates cells in row-major order and returns on first valid group found.
 */
export const SolvabilityChecker = {
  check(board: BoardCell[], cols: number, rows: number): SolvabilityResult {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const cell = board[idx];
        if (!cell || cell.kind === 'EMPTY') continue;
        // Skip blockers — they don't pop via tap
        const treatKinds = ['SNACK_BONE', 'BURGER', 'PIZZA', 'HOTDOG', 'MYSTERY_GLOB'];
        if (!treatKinds.includes(cell.kind)) continue;

        const { group, invalid } = floodFill(board, col, row, cols, rows);
        if (!invalid && group.length >= 2) {
          return { solvable: true, firstValidCell: idx };
        }
      }
    }
    return { solvable: false, firstValidCell: -1 };
  },
};
