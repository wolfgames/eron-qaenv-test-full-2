/**
 * Tests for boardLogic — flood-fill group detection.
 *
 * Pure logic: no Pixi, no Math.random.
 */

import { describe, test, expect } from 'vitest';
import { floodFill, adjacentDamage, comboSpawnKind } from '../../src/game/scooby-snacks-pop/state/boardLogic';
import type { BoardCell } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';

describe('boardLogic: comboSpawnKind thresholds', () => {
  test('group size <5 returns comboSpawn=null', () => {
    expect(comboSpawnKind(4)).toBeNull();
    expect(comboSpawnKind(1)).toBeNull();
  });

  test('group size 5-6 returns comboSpawn=GHOST_CLUSTER', () => {
    expect(comboSpawnKind(5)).toBe('GHOST_CLUSTER');
    expect(comboSpawnKind(6)).toBe('GHOST_CLUSTER');
  });

  test('group size 7-9 returns comboSpawn=SPOOK_BOMB', () => {
    expect(comboSpawnKind(7)).toBe('SPOOK_BOMB');
    expect(comboSpawnKind(9)).toBe('SPOOK_BOMB');
  });

  test('group size 10+ returns comboSpawn=MEGA_MUNCHIE', () => {
    expect(comboSpawnKind(10)).toBe('MEGA_MUNCHIE');
    expect(comboSpawnKind(20)).toBe('MEGA_MUNCHIE');
  });
});

const makeGrid = (rows: number, cols: number, fill: (row: number, col: number) => BoardCell['kind']): BoardCell[] =>
  Array.from({ length: rows * cols }, (_, i) => ({
    id: i,
    kind: fill(Math.floor(i / cols), i % cols),
  }));

describe('boardLogic: flood-fill group detection', () => {
  test('detects connected group of same type', () => {
    // 3×3 grid, all BURGER except (0,2) which is PIZZA
    const board = makeGrid(3, 3, (r, c) => (c === 2 && r === 0 ? 'PIZZA' : 'BURGER'));
    const { group, invalid } = floodFill(board, 0, 0, 3, 3);
    expect(invalid).toBe(false);
    expect(group.length).toBeGreaterThanOrEqual(2);
    // All group cells should be BURGER
    group.forEach((idx) => expect(board[idx].kind).toBe('BURGER'));
  });

  test('group size 1 returns invalid (no pop)', () => {
    // Surround a single BURGER with PIZZA
    const board: BoardCell[] = [
      { id: 0, kind: 'PIZZA' }, { id: 1, kind: 'PIZZA' }, { id: 2, kind: 'PIZZA' },
      { id: 3, kind: 'PIZZA' }, { id: 4, kind: 'BURGER' }, { id: 5, kind: 'PIZZA' },
      { id: 6, kind: 'PIZZA' }, { id: 7, kind: 'PIZZA' }, { id: 8, kind: 'PIZZA' },
    ];
    const { group, invalid } = floodFill(board, 1, 1, 3, 3);
    expect(invalid).toBe(true);
    expect(group.length).toBe(1);
  });

  test('Mystery Glob joins adjacent group for size calculation', () => {
    // Row of 3 BURGER + 1 MYSTERY_GLOB adjacent
    const board: BoardCell[] = [
      { id: 0, kind: 'BURGER' }, { id: 1, kind: 'BURGER' }, { id: 2, kind: 'BURGER' },
      { id: 3, kind: 'MYSTERY_GLOB' }, { id: 4, kind: 'PIZZA' }, { id: 5, kind: 'PIZZA' },
    ];
    // Tap the first BURGER at col=0, row=0 in a 3-column grid
    const { group } = floodFill(board, 0, 0, 3, 2);
    // MYSTERY_GLOB at row=1,col=0 is adjacent to BURGER group — should be included
    expect(group.length).toBe(4);
  });

  test('Mystery Glob adjacent to two types joins the larger group', () => {
    // 2 BURGER on left, 1 PIZZA on right, MYSTERY_GLOB in center bottom
    // Layout (3 cols, 2 rows):
    // [BURGER][BURGER][PIZZA]
    // [EMPTY] [MGLOB] [EMPTY]
    const board: BoardCell[] = [
      { id: 0, kind: 'BURGER' }, { id: 1, kind: 'BURGER' }, { id: 2, kind: 'PIZZA' },
      { id: 3, kind: 'EMPTY' }, { id: 4, kind: 'MYSTERY_GLOB' }, { id: 5, kind: 'EMPTY' },
    ];
    // Tap BURGER at col=0, row=0 — glob should join BURGER group (size 3 > PIZZA group size 1)
    const { group } = floodFill(board, 0, 0, 3, 2);
    expect(group.length).toBe(3); // 2 BURGERs + 1 MYSTERY_GLOB
    expect(group).toContain(4); // MYSTERY_GLOB included
    expect(group).not.toContain(2); // PIZZA not included
  });
});
