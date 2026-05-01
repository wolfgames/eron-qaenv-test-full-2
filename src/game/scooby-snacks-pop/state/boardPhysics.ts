/**
 * boardPhysics — gravity and refill logic.
 *
 * Pure functions: no Pixi imports, no Math.random.
 * Cells have stable IDs through gravity moves.
 *
 * Gravity rules:
 * - Cells fall down (increasing row index) when cells below them are EMPTY.
 * - Stone Gargoyle blocks gravity pass-through: cells above a Gargoyle fall
 *   only to the row immediately above the Gargoyle.
 * - Cobweb and Haunted Frame do NOT block gravity.
 */
import type { BoardCell } from '../entities/TreatBubble';

export interface Drop {
  id: number;
  col: number;
  fromRow: number;
  toRow: number;
}

export interface Refill {
  id: number;
  col: number;
  kind: BoardCell['kind'];
  fromRow: number; // virtual row above grid (negative)
  toRow: number;
}

export interface GravityResult {
  newBoard: BoardCell[];
  drops: Drop[];
  refills: Refill[];
}

/** Returns true if a cell kind blocks gravity downward movement. */
const isGravityBlocker = (kind: BoardCell['kind']): boolean =>
  kind === 'STONE_GARGOYLE';

/**
 * Apply gravity to a board.
 * For each column: cells fall down to fill empty spaces, stopping at blockers.
 * Returns the new board, the drop events (for animation), and refill events.
 *
 * Refills are returned as stubs (kind=EMPTY) — the caller fills them with
 * seeded-random kinds from LevelGenerator.
 */
export const applyGravity = (
  board: BoardCell[],
  cols: number,
  rows: number,
): GravityResult => {
  const newBoard = board.map((c) => ({ ...c }));
  const drops: Drop[] = [];
  const refills: Refill[] = [];

  for (let col = 0; col < cols; col++) {
    // Process each column bottom-up, respecting blockers
    // Build a list of segments separated by blockers
    let writeRow = rows - 1;

    for (let readRow = rows - 1; readRow >= 0; readRow--) {
      const readIdx = readRow * cols + col;
      const cell = newBoard[readIdx];

      if (isGravityBlocker(cell.kind)) {
        // Gargoyle stays in place — skip, reset writeRow to above it
        writeRow = readRow - 1;
        continue;
      }

      if (cell.kind === 'EMPTY') continue;

      // This cell needs to fall to writeRow
      if (writeRow !== readRow) {
        const writeIdx = writeRow * cols + col;
        drops.push({ id: cell.id, col, fromRow: readRow, toRow: writeRow });
        newBoard[writeIdx] = cell;
        newBoard[readIdx] = { id: cell.id, kind: 'EMPTY' };
      }
      writeRow--;
    }

    // Fill any remaining empty rows at the top with refill stubs
    for (let emptyRow = writeRow; emptyRow >= 0; emptyRow--) {
      const emptyIdx = emptyRow * cols + col;
      if (newBoard[emptyIdx].kind !== 'STONE_GARGOYLE') {
        refills.push({
          id: -(emptyRow * cols + col + 1), // negative ID = new cell to be assigned
          col,
          kind: 'EMPTY',
          fromRow: emptyRow - rows, // virtual position above grid
          toRow: emptyRow,
        });
      }
    }
  }

  return { newBoard, drops, refills };
};
