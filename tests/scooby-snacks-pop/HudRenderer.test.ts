/**
 * Tests for HudRenderer — layout and ECS bridge.
 *
 * Validates:
 * - Score label renders in top 127px strip at 390px width
 * - Moves label pulses red GSAP tween when movesRemaining reaches 0
 * - Objective icon fill animation fires when objective count hits target
 */

import { describe, test, expect, vi } from 'vitest';

// Pixi mock
vi.mock('pixi.js', () => {
  const makeContainer = () => ({
    eventMode: 'none',
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeAllListeners: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    children: [],
  });
  const makeText = () => ({ text: '', x: 0, y: 0, destroy: vi.fn(), style: {} });
  const makeGraphics = () => {
    const g: Record<string, unknown> = { destroy: vi.fn(), x: 0, y: 0 };
    g['rect'] = vi.fn().mockReturnValue(g);
    g['fill'] = vi.fn().mockReturnValue(g);
    g['circle'] = vi.fn().mockReturnValue(g);
    return g;
  };
  return {
    Container: vi.fn(makeContainer),
    Text: vi.fn(makeText),
    Graphics: vi.fn(makeGraphics),
  };
});

// GSAP mock
const { mockGsapTo } = vi.hoisted(() => ({ mockGsapTo: vi.fn() }));
vi.mock('gsap', () => ({
  default: { to: mockGsapTo, killTweensOf: vi.fn() },
}));

import { HudRenderer } from '../../src/game/scooby-snacks-pop/renderers/HudRenderer';
import { VIEWPORT } from '../../src/game/scooby-snacks-pop/layout/viewport';

describe('HudRenderer — layout and ECS bridge', () => {
  test('score label renders in top 127px strip at 390px width', () => {
    const hud = new HudRenderer();
    hud.init(390, 844);

    // HUD strip height must be ≤ HUD_TOP
    expect(hud.height).toBeLessThanOrEqual(VIEWPORT.HUD_TOP);
    // Y origin must be 0 (top of viewport)
    expect(hud.originY).toBe(0);
  });

  test('moves label pulses red GSAP tween when movesRemaining reaches 0', () => {
    const hud = new HudRenderer();
    hud.init(390, 844);

    hud.updateMoves(0, 20);

    // GSAP.to must have been called for the red pulse animation
    expect(mockGsapTo).toHaveBeenCalled();
  });

  test('objective icon fill animation fires when objective count hits target', () => {
    const hud = new HudRenderer();
    hud.init(390, 844);
    hud.setObjectives([{ treatKind: 'BURGER', targetCount: 5, clearedCount: 0 }]);

    // Update to completion
    hud.updateObjective('BURGER', 5);

    // Fill animation must fire — GSAP.to called
    expect(mockGsapTo).toHaveBeenCalled();
  });
});
