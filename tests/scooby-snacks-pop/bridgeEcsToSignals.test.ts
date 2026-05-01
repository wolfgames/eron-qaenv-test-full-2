/**
 * Tests for bridgeEcsToSignals — ECS → SolidJS signal propagation.
 *
 * Validates:
 * - addScore transaction propagates to gameState.score() signal
 * - decrementMoves transaction propagates to movesRemaining signal
 */

import { describe, test, expect, vi } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { gamePlugin, type GameDatabase } from '../../src/game/scooby-snacks-pop/state/GamePlugin';
import { bridgeEcsToSignals } from '../../src/game/scooby-snacks-pop/state/bridgeEcsToSignals';

// Mock solid-js to allow createSignal outside a reactive context
vi.mock('solid-js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('solid-js')>();
  return { ...actual };
});

describe('bridgeEcsToSignals — ECS → signal propagation', () => {
  test('addScore transaction propagates to gameState.score() signal', async () => {
    const db: GameDatabase = Database.create(gamePlugin);

    const scoreSignal = { value: 0 };
    const setScore = (n: number) => { scoreSignal.value = n; };
    const movesSignal = { value: 20 };
    const setMoves = (n: number) => { movesSignal.value = n; };

    const cleanup = bridgeEcsToSignals(db, { setScore, setMovesRemaining: setMoves });

    db.transactions.addScore(100);

    // Allow observe to propagate (synchronous in ECS)
    expect(scoreSignal.value).toBe(100);

    cleanup();
  });

  test('decrementMoves transaction propagates to movesRemaining signal', async () => {
    const db: GameDatabase = Database.create(gamePlugin);

    const movesSignal = { value: 20 };
    const setMoves = (n: number) => { movesSignal.value = n; };

    const cleanup = bridgeEcsToSignals(db, {
      setScore: () => {},
      setMovesRemaining: setMoves,
    });

    db.transactions.decrementMoves();

    expect(movesSignal.value).toBe(19);

    cleanup();
  });
});
