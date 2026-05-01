/**
 * Tests for ResultsScreen — button positions and touch targets.
 *
 * DOM screen (SolidJS) — tests validate exported component props and
 * the structure of the button definitions. No rendering required.
 */

import { describe, test, expect } from 'vitest';
import { RESULTS_BUTTONS } from '../../src/game/scooby-snacks-pop/screens/resultsConfig';

describe('ResultsScreen: button positions and touch targets', () => {
  test('Next Level button ≥ 44px touch target in bottom half of screen', () => {
    const nextLevel = RESULTS_BUTTONS.find((b) => b.id === 'next-level');
    expect(nextLevel).toBeDefined();
    expect(nextLevel!.minHeightPx).toBeGreaterThanOrEqual(44);
    expect(nextLevel!.zone).toBe('bottom-half');
  });

  test('Try Again button ≥ 44px touch target', () => {
    const tryAgain = RESULTS_BUTTONS.find((b) => b.id === 'try-again');
    expect(tryAgain).toBeDefined();
    expect(tryAgain!.minHeightPx).toBeGreaterThanOrEqual(44);
  });

  test('Get 5 More Moves button present but disabled (core pass)', () => {
    const getMore = RESULTS_BUTTONS.find((b) => b.id === 'get-more-moves');
    expect(getMore).toBeDefined();
    expect(getMore!.disabled).toBe(true);
  });
});
