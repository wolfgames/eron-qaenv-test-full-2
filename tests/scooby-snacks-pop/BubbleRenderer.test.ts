/**
 * Tests for BubbleRenderer — 5 types visually distinct.
 *
 * Validates:
 * - 5 bubble types have distinct tint values (no two types share tint)
 * - Each type has a distinct emoji label string
 * - Visible bubble size ≥ 48px
 */

import { describe, test, expect, vi } from 'vitest';

// Prevent pixi.js loading in node test environment
vi.mock('pixi.js', () => ({
  Container: vi.fn().mockImplementation(() => ({ addChild: vi.fn(), destroy: vi.fn() })),
  Graphics: vi.fn().mockImplementation(() => ({ circle: vi.fn().mockReturnThis(), fill: vi.fn().mockReturnThis(), destroy: vi.fn() })),
  Text: vi.fn().mockImplementation(() => ({ destroy: vi.fn() })),
}));

import { treatVisuals } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';
import type { TreatKind } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';
import { BUBBLE_SIZE } from '../../src/game/scooby-snacks-pop/renderers/BubbleRenderer';

const treatKinds: TreatKind[] = ['SNACK_BONE', 'BURGER', 'PIZZA', 'HOTDOG', 'MYSTERY_GLOB'];

describe('BubbleRenderer — 5 types visually distinct', () => {
  test('5 bubble types have distinct tint values (no two types share tint)', () => {
    const tints = treatKinds.map((k) => treatVisuals[k].tint);
    const uniqueTints = new Set(tints);
    expect(uniqueTints.size).toBe(5);
  });

  test('each type has a distinct emoji label string', () => {
    const emojis = treatKinds.map((k) => treatVisuals[k].emoji);
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(5);
    // Each emoji must be a non-empty string
    emojis.forEach((e) => expect(e.length).toBeGreaterThan(0));
  });

  test('visible bubble size ≥ 48px', () => {
    expect(BUBBLE_SIZE).toBeGreaterThanOrEqual(48);
  });
});
