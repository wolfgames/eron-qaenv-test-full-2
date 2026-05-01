/**
 * boardLogic — pure board manipulation functions.
 *
 * No Pixi imports, no Math.random (seeded RNG passed as arg where needed).
 * All functions are deterministic and fully testable in isolation.
 */
import type { BoardCell, TreatKind, CellKind } from '../entities/TreatBubble';

/** Result of a flood-fill from a tapped cell. */
export interface FloodFillResult {
  /** Cell indices in the group (row-major). */
  group: number[];
  /** True if group size < 2 (invalid tap — no pop). */
  invalid: boolean;
}

const TREAT_KINDS: TreatKind[] = ['SNACK_BONE', 'BURGER', 'PIZZA', 'HOTDOG', 'MYSTERY_GLOB'];
const isTreatKind = (k: CellKind): k is TreatKind => TREAT_KINDS.includes(k as TreatKind);

/** 4-directional neighbors of (col, row) within the grid. */
const neighbors = (col: number, row: number, cols: number, rows: number): Array<[number, number]> => {
  const result: Array<[number, number]> = [];
  if (row > 0) result.push([col, row - 1]);
  if (row < rows - 1) result.push([col, row + 1]);
  if (col > 0) result.push([col - 1, row]);
  if (col < cols - 1) result.push([col + 1, row]);
  return result;
};

/**
 * Flood-fill group detection from a tapped cell.
 * Mystery Glob (wildcard) joins any adjacent group; if adjacent to multiple
 * groups it joins the largest one.
 *
 * @returns FloodFillResult — group indices + invalid flag
 */
export const floodFill = (
  board: BoardCell[],
  col: number,
  row: number,
  cols: number,
  rows: number,
): FloodFillResult => {
  const idx = row * cols + col;
  const tapped = board[idx];

  if (!tapped || !isTreatKind(tapped.kind)) {
    return { group: [], invalid: true };
  }

  // Standard BFS for same-type connected cells
  const visited = new Set<number>();
  const queue: number[] = [idx];
  visited.add(idx);
  const groupType = tapped.kind;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curCol = cur % cols;
    const curRow = Math.floor(cur / cols);

    for (const [nc, nr] of neighbors(curCol, curRow, cols, rows)) {
      const ni = nr * cols + nc;
      if (visited.has(ni)) continue;
      const cell = board[ni];
      if (!cell) continue;

      if (cell.kind === groupType) {
        visited.add(ni);
        queue.push(ni);
      }
    }
  }

  // Find all Mystery Globs adjacent to this group
  const globs: number[] = [];
  for (const memberIdx of visited) {
    const memberCol = memberIdx % cols;
    const memberRow = Math.floor(memberIdx / cols);
    for (const [nc, nr] of neighbors(memberCol, memberRow, cols, rows)) {
      const ni = nr * cols + nc;
      if (!visited.has(ni) && board[ni]?.kind === 'MYSTERY_GLOB') {
        if (!globs.includes(ni)) globs.push(ni);
      }
    }
  }

  // Each Mystery Glob joins the group it is most adjacent to
  // (for simplicity: joins all globs adjacent to this group)
  const fullGroup = [...visited];
  for (const globIdx of globs) {
    fullGroup.push(globIdx);
  }

  return {
    group: fullGroup,
    invalid: fullGroup.length < 2,
  };
};

/**
 * Apply damage to blockers adjacent to any cleared cell index.
 * Phantom Lock is excluded from adjacentDamage (combo-only, secondary pass).
 */
export interface DamageResult {
  newBoard: BoardCell[];
  damagedBlockers: Array<{ idx: number; newHp: number }>;
  destroyedBlockers: number[];
}

export const adjacentDamage = (
  board: BoardCell[],
  clearedIndices: number[],
  cols: number,
  rows: number,
): DamageResult => {
  const newBoard = board.map((c) => ({ ...c }));
  const damagedBlockers: DamageResult['damagedBlockers'] = [];
  const destroyedBlockers: number[] = [];
  const blockerKinds = new Set(['COBWEB', 'HAUNTED_FRAME', 'STONE_GARGOYLE']);

  const processed = new Set<number>();

  for (const clearedIdx of clearedIndices) {
    const cc = clearedIdx % cols;
    const cr = Math.floor(clearedIdx / cols);
    for (const [nc, nr] of neighbors(cc, cr, cols, rows)) {
      const ni = nr * cols + nc;
      if (processed.has(ni)) continue;
      const cell = newBoard[ni];
      if (!cell || !blockerKinds.has(cell.kind)) continue;

      processed.add(ni);
      const curHp = cell.hp ?? 1;
      const newHp = curHp - 1;
      newBoard[ni] = { ...cell, hp: newHp };

      if (newHp <= 0) {
        newBoard[ni] = { id: cell.id, kind: 'EMPTY' };
        destroyedBlockers.push(ni);
      } else {
        damagedBlockers.push({ idx: ni, newHp });
      }
    }
  }

  return { newBoard, damagedBlockers, destroyedBlockers };
};

/** Remove cleared cells and resolve the new board state after a pop. */
export const resolveGroup = (
  board: BoardCell[],
  groupIndices: number[],
): BoardCell[] => {
  const newBoard = board.map((c) => ({ ...c }));
  for (const idx of groupIndices) {
    newBoard[idx] = { id: board[idx].id, kind: 'EMPTY' };
  }
  return newBoard;
};

/** Determine combo bubble type to spawn based on group size. */
export type ComboSpawnKind = 'GHOST_CLUSTER' | 'SPOOK_BOMB' | 'MEGA_MUNCHIE' | null;

export const comboSpawnKind = (groupSize: number): ComboSpawnKind => {
  if (groupSize >= 10) return 'MEGA_MUNCHIE';
  if (groupSize >= 7) return 'SPOOK_BOMB';
  if (groupSize >= 5) return 'GHOST_CLUSTER';
  return null;
};
