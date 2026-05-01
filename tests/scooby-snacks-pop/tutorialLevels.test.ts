/**
 * Tests for tutorial-levels.json — content validation.
 *
 * Tutorial levels are real authored content (no placeholders per guardrail #15).
 * These tests validate structural properties of each level.
 */

import { describe, test, expect } from 'vitest';
import { floodFill } from '../../src/game/scooby-snacks-pop/state/boardLogic';
import type { BoardCell } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tutorialData = require('../../src/game/scooby-snacks-pop/data/tutorial-levels.json') as {
  levels: Array<{
    id: number;
    rows: number;
    cols: number;
    cells: Array<{ id: number; kind: string; hp?: number }>;
    tutorialMode: boolean;
    dialogue: string[];
    pointer: { col: number; row: number };
  }>;
};

describe('tutorial-levels.json: content validation', () => {
  test('tutorial level 1: 5x5 grid, exactly 2 types (SNACK_BONE BURGER), ≥1 group of 3+', () => {
    const level = tutorialData.levels.find((l) => l.id === 1)!;
    expect(level).toBeDefined();
    expect(level.rows).toBe(5);
    expect(level.cols).toBe(5);
    expect(level.cells).toHaveLength(25);

    const kinds = new Set(level.cells.map((c) => c.kind).filter((k) => k !== 'EMPTY'));
    expect(kinds.size).toBe(2);
    expect(kinds.has('SNACK_BONE')).toBe(true);
    expect(kinds.has('BURGER')).toBe(true);

    // At least one flood-fill group of 3+
    const board = level.cells as BoardCell[];
    let foundGroup = false;
    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        const cell = board[row * level.cols + col];
        if (cell.kind === 'EMPTY') continue;
        const { group } = floodFill(board, col, row, level.cols, level.rows);
        if (group.length >= 3) { foundGroup = true; break; }
      }
      if (foundGroup) break;
    }
    expect(foundGroup).toBe(true);
  });

  test('tutorial level 2: grid has at least 1 exploitable gravity chain', () => {
    const level = tutorialData.levels.find((l) => l.id === 2)!;
    expect(level).toBeDefined();
    const board = level.cells as BoardCell[];

    // An exploitable gravity chain means: at least 1 column has an EMPTY or poppable gap
    // below a non-empty cell. We check for any column with a non-EMPTY cell above an EMPTY cell.
    let hasGravityChain = false;
    for (let col = 0; col < level.cols; col++) {
      for (let row = 1; row < level.rows; row++) {
        const above = board[(row - 1) * level.cols + col];
        const current = board[row * level.cols + col];
        if (above.kind !== 'EMPTY' && current.kind === 'EMPTY') {
          hasGravityChain = true;
          break;
        }
      }
      if (hasGravityChain) break;
    }
    expect(hasGravityChain).toBe(true);
  });

  test('tutorial level 3: has at least one group of 7+ same-type bubbles pre-placed', () => {
    const level = tutorialData.levels.find((l) => l.id === 3)!;
    expect(level).toBeDefined();
    const board = level.cells as BoardCell[];

    let found7Plus = false;
    const visited = new Set<string>();
    for (let row = 0; row < level.rows; row++) {
      for (let col = 0; col < level.cols; col++) {
        const cell = board[row * level.cols + col];
        if (cell.kind === 'EMPTY') continue;
        const key = `${row},${col}`;
        if (visited.has(key)) continue;
        const { group } = floodFill(board, col, row, level.cols, level.rows);
        group.forEach((idx) => {
          const r = Math.floor(idx / level.cols);
          const c = idx % level.cols;
          visited.add(`${r},${c}`);
        });
        if (group.length >= 7) { found7Plus = true; break; }
      }
      if (found7Plus) break;
    }
    expect(found7Plus).toBe(true);
  });
});
