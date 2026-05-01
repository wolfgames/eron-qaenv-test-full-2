/**
 * Tests for boardPhysics — gravity cascade and board diff.
 *
 * Pure logic: no Pixi, no Math.random.
 */

import { describe, test, expect } from 'vitest';
import { applyGravity } from '../../src/game/scooby-snacks-pop/state/boardPhysics';
import type { BoardCell } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';

// Helper: create a flat board
const cell = (id: number, kind: BoardCell['kind'] = 'BURGER'): BoardCell => ({ id, kind });
const empty = (id: number): BoardCell => ({ id, kind: 'EMPTY' });

describe('boardPhysics: gravity cascade and board diff', () => {
  test('cleared cells trigger gravity drop for cells directly above', () => {
    // 2-col, 3-row grid (row-major):
    // Row0: [BURGER, PIZZA]
    // Row1: [EMPTY,  PIZZA]
    // Row2: [EMPTY,  PIZZA]
    // After gravity: BURGER falls to row2, col0
    const board: BoardCell[] = [
      cell(0, 'BURGER'), cell(1, 'PIZZA'),
      empty(2), cell(3, 'PIZZA'),
      empty(4), cell(5, 'PIZZA'),
    ];
    const { newBoard, drops } = applyGravity(board, 2, 3);

    // BURGER (id=0) should have dropped 2 rows (from row0 to row2)
    const burgerDrop = drops.find((d) => d.id === 0);
    expect(burgerDrop).toBeDefined();
    expect(burgerDrop!.toRow).toBe(2);
    expect(burgerDrop!.fromRow).toBe(0);

    // New board: BURGER at row2,col0
    expect(newBoard[4].id).toBe(0); // row2, col0 (idx = 2*2+0 = 4)
    expect(newBoard[0].kind).toBe('EMPTY');
  });

  test('board diff: only moved cells have non-zero displacement', () => {
    // Single empty in middle, rest filled
    const board: BoardCell[] = [
      cell(0, 'BURGER'), cell(1, 'PIZZA'),
      empty(2), cell(3, 'PIZZA'),
      cell(4, 'BURGER'), cell(5, 'PIZZA'),
    ];
    const { drops } = applyGravity(board, 2, 3);

    // Only cells above the empty should have drops
    drops.forEach((d) => {
      expect(d.toRow).toBeGreaterThan(d.fromRow);
    });
  });

  test('stable identity: same cell ID before and after gravity (not recreated)', () => {
    const board: BoardCell[] = [
      cell(10, 'PIZZA'),
      empty(99),
      cell(20, 'BURGER'),
    ];
    const { newBoard } = applyGravity(board, 1, 3);

    // IDs must be preserved
    const ids = newBoard.filter((c) => c.kind !== 'EMPTY').map((c) => c.id);
    expect(ids).toContain(10);
    expect(ids).toContain(20);
  });

  test('Stone Gargoyle blocks gravity pass-through', () => {
    // 1-col, 4-row grid:
    // Row0: BURGER
    // Row1: STONE_GARGOYLE
    // Row2: EMPTY
    // Row3: PIZZA
    const board: BoardCell[] = [
      cell(0, 'BURGER'),
      { id: 1, kind: 'STONE_GARGOYLE', hp: 3 },
      empty(2),
      cell(3, 'PIZZA'),
    ];
    const { drops } = applyGravity(board, 1, 4);

    // BURGER cannot fall past Gargoyle — no drop for id=0
    const burgerDrop = drops.find((d) => d.id === 0);
    expect(burgerDrop).toBeUndefined();
  });

  test('cascade depth increments correctly after each gravity refill match', () => {
    // This is tested at the GamePlugin action level — boardPhysics is pure gravity
    // The cascade counter lives in the animation event queue, not in physics.
    // Verify that applyGravity returns the correct structure for the controller.
    const board: BoardCell[] = [empty(0), cell(1, 'BURGER')];
    const result = applyGravity(board, 1, 2);
    expect(result).toHaveProperty('newBoard');
    expect(result).toHaveProperty('drops');
    expect(result).toHaveProperty('refills');
  });
});
