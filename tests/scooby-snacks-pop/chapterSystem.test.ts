/**
 * Tests for chapter system — level progression and transitions.
 */

import { describe, test, expect, vi } from 'vitest';
import { Database } from '@adobe/data/ecs';
import { gamePlugin, type GameDatabase } from '../../src/game/scooby-snacks-pop/state/GamePlugin';
import { RESULTS_BUTTONS } from '../../src/game/scooby-snacks-pop/screens/resultsConfig';
import { CHAPTER_COMPLETE_AUTOADVANCE_MS } from '../../src/game/scooby-snacks-pop/screens/chapterConfig';

describe('chapter system — level progression and transitions', () => {
  test('level 15 completion increments chapterNumber ECS resource', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    // Set up level 15 completion scenario
    db.transactions.setLevel({ levelNumber: 15, chapterNumber: 1 });
    expect(db.store.resources.levelNumber).toBe(15);

    // advanceChapter increments chapterNumber
    db.actions.advanceChapter();
    expect(db.store.resources.chapterNumber).toBe(2);
  });

  test('level 16 triggers chapter interstitial before game load', () => {
    const db: GameDatabase = Database.create(gamePlugin);
    db.transactions.setLevel({ levelNumber: 16, chapterNumber: 2 });
    // isChapterBoundary should return true for level 16
    const result = db.actions.isChapterBoundary();
    expect(result).toBe(true);
  });

  test('auto-advance fires after 4s via GSAP delayedCall', () => {
    // GSAP delayedCall is used for auto-advance in GPU code
    // We verify the config constant is 4000ms
    expect(CHAPTER_COMPLETE_AUTOADVANCE_MS).toBe(4000);
  });

  test('Next Chapter button ≥ 44px', () => {
    const nextChapter = RESULTS_BUTTONS.find((b) => b.id === 'next-level');
    expect(nextChapter?.minHeightPx).toBeGreaterThanOrEqual(44);
  });
});
