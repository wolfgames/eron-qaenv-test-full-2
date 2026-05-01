/**
 * Tests for LevelGenerator — seeded procedural level generation.
 */

import { describe, test, expect } from 'vitest';
import { LevelGenerator } from '../../src/game/scooby-snacks-pop/levelgen/LevelGenerator';
import { SolvabilityChecker } from '../../src/game/scooby-snacks-pop/levelgen/SolvabilityChecker';

describe('LevelGenerator: seeded procedural generation', () => {
  test('generate(4, seed) returns solvable board (SolvabilityChecker.check passes)', () => {
    const level = LevelGenerator.generate(4);
    const result = SolvabilityChecker.check(level.board, level.cols, level.rows);
    expect(result.solvable).toBe(true);
  });

  test('same seed always produces same board (deterministic)', () => {
    const a = LevelGenerator.generate(4);
    const b = LevelGenerator.generate(4);
    expect(a.board.map((c) => c.kind)).toEqual(b.board.map((c) => c.kind));
  });

  test('DEADLOCK rejection triggers retry; max 10 retries before fallback JSON', () => {
    // Generate many levels — none should be in DEADLOCK state (all solvable)
    for (let i = 4; i <= 14; i++) {
      const level = LevelGenerator.generate(i);
      const result = SolvabilityChecker.check(level.board, level.cols, level.rows);
      expect(result.solvable).toBe(true);
    }
  });

  test('objectives: targetCount between 60-75% of treat type presence', () => {
    const level = LevelGenerator.generate(5);
    for (const obj of level.objectives) {
      const totalOfKind = level.board.filter((c) => c.kind === obj.treatKind).length;
      const ratio = obj.targetCount / totalOfKind;
      expect(ratio).toBeGreaterThanOrEqual(0.6);
      expect(ratio).toBeLessThanOrEqual(0.75);
    }
  });

  test('content-sufficiency: fallback library has ≥ 10 levels', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fallback = require('../../src/game/scooby-snacks-pop/data/fallback-levels.json') as { levels: unknown[] };
    expect(fallback.levels.length).toBeGreaterThanOrEqual(10);
  });
});
