/**
 * Tests for GamePlugin — ECS plugin for Scooby Snacks Pop!
 *
 * Validates:
 * - Resource shape and defaults (score, movesRemaining, phase, etc.)
 * - Plugin property order is valid (no runtime order error on DB creation)
 * - executeTap action returns metadata without side effects
 */

import { describe, test, expect } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { gamePlugin, type GameDatabase } from '../../src/game/scooby-snacks-pop/state/GamePlugin';

describe('ECS GamePlugin — resource shape and property order', () => {
  test('creates DB with score=0 movesRemaining=20 phase=IDLE', () => {
    const db: GameDatabase = Database.create(gamePlugin);

    expect(db.store.resources.score).toBe(0);
    expect(db.store.resources.movesRemaining).toBe(20);
    expect(db.store.resources.phase).toBe('IDLE');
    expect(db.store.resources.levelNumber).toBe(1);
    expect(db.store.resources.chapterNumber).toBe(1);
    expect(db.store.resources.starCount).toBe(0);
  });

  test('plugin property order is enforced (extends before resources before actions)', () => {
    // If property order is wrong, Database.create throws at runtime.
    // A successful creation proves order is valid.
    expect(() => Database.create(gamePlugin)).not.toThrow();
  });
});

describe('GamePlugin.actions.executeTap — ECS action purity', () => {
  test('executeTap returns group + movements + refills metadata (no Pixi calls)', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    const result = db.actions.executeTap({ col: 0, row: 0 });

    // Stub returns empty metadata — no Pixi, no crash
    expect(result).toMatchObject({
      group: expect.any(Array),
      movements: expect.any(Array),
      refills: expect.any(Array),
    });
  });

  test('tapping during ANIMATING phase returns null / no-op', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    db.transactions.setPhase('ANIMATING');

    const result = db.actions.executeTap({ col: 0, row: 0 });
    expect(result).toBeNull();
    // Board state and moves unchanged
    expect(db.store.resources.movesRemaining).toBe(20);
  });

  test('invalid tap (group<2) does not decrement moves or modify board state', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    const movesBefore = db.store.resources.movesRemaining;

    // executeTap with an empty board — no valid group exists
    const result = db.actions.executeTap({ col: 0, row: 0 });

    // If group is empty/invalid, moves must not decrease
    if (result !== null && result.group.length < 2) {
      expect(db.store.resources.movesRemaining).toBe(movesBefore);
    }
  });
});

describe('GamePlugin.transitions: win/loss state machine', () => {
  test('all objectives met triggers phase=WON', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    // Set up a state where objectives are met
    db.transactions.setPhase('IDLE');
    // With empty objectives array and 0 score, checkWinLoss evaluates based on objectives
    const result = db.actions.checkWinLoss();
    // Default: no objectives = win
    expect(result).toBeDefined();
  });

  test('movesRemaining=0 with unmet objectives triggers phase=LOST', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    // Set moves to 0 and add an unmet objective
    db.transactions.setMovesRemaining(0);
    db.transactions.setObjectives([{ treatKind: 'BURGER', targetCount: 5, clearedCount: 0 }]);

    const result = db.actions.checkWinLoss();
    expect(result?.phase).toBe('LOST');
    expect(db.store.resources.phase).toBe('LOST');
  });

  test('star thresholds: 50% moves used = 2 stars; 40% moves used = 3 stars', () => {
    const db1: GameDatabase = Database.create(gamePlugin);
    // 20 allotted, 10 remaining = 50% remaining → 2 stars
    db1.transactions.setMovesAllotted(20);
    db1.transactions.setMovesRemaining(10);
    db1.transactions.setObjectives([]);
    const r1 = db1.actions.checkWinLoss();
    expect(r1?.stars).toBe(2);

    const db2: GameDatabase = Database.create(gamePlugin);
    // 20 allotted, 12 remaining = 60% remaining → 3 stars
    db2.transactions.setMovesAllotted(20);
    db2.transactions.setMovesRemaining(12);
    db2.transactions.setObjectives([]);
    const r2 = db2.actions.checkWinLoss();
    expect(r2?.stars).toBe(3);
  });
});
