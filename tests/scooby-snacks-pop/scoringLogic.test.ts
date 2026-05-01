/**
 * Tests for scoringLogic — multiplicative scoring formula.
 *
 * Formula: perTapScore = (groupSize - 1) * 50 * (cascadeDepth + 1)
 * Stars: 1=complete; 2=movesRemaining≥30%; 3=movesRemaining≥55%
 */

import { describe, test, expect } from 'vitest';
import { computeScore, computeStars } from '../../src/game/scooby-snacks-pop/state/scoringLogic';

describe('scoringLogic: multiplicative formula', () => {
  test('group of 2 at cascade 0 scores 50', () => {
    expect(computeScore(2, 0)).toBe(50); // (2-1)*50*(0+1) = 50
  });

  test('group of 5 at cascade 0 scores 200', () => {
    expect(computeScore(5, 0)).toBe(200); // (5-1)*50*(0+1) = 200
  });

  test('group of 5 at cascade 2 scores 600 (chain multiplier x3)', () => {
    expect(computeScore(5, 2)).toBe(600); // (5-1)*50*(2+1) = 600
  });

  test('star thresholds: 0% moves remaining = 1 star; 30% = 2 stars; 55% = 3 stars', () => {
    // 0% remaining → 1 star
    expect(computeStars(0, 20)).toBe(1);
    // 30% remaining → 2 stars (exactly 30%)
    expect(computeStars(6, 20)).toBe(2); // 6/20 = 30%
    // 55% remaining → 3 stars (exactly 55%)
    expect(computeStars(11, 20)).toBe(3); // 11/20 = 55%
    // 29% remaining → 1 star
    expect(computeStars(5, 20)).toBe(1); // 5/20 = 25% < 30%
  });
});
