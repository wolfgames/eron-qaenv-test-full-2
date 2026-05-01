/**
 * Tests for BlockerRenderer — hp and crack visual.
 */

import { describe, test, expect, vi } from 'vitest';

vi.mock('pixi.js', () => {
  const makeObj = () => ({
    addChild: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    x: 0,
    y: 0,
    alpha: 1,
    eventMode: 'none',
    tint: 0xffffff,
  });
  return {
    Container: vi.fn(makeObj),
    Text: vi.fn(() => ({ ...makeObj(), text: '' })),
    Graphics: vi.fn(() => {
      const g: Record<string, unknown> = { ...makeObj(), tint: 0xffffff };
      g['circle'] = vi.fn().mockReturnValue(g);
      g['fill'] = vi.fn().mockReturnValue(g);
      g['rect'] = vi.fn().mockReturnValue(g);
      return g;
    }),
  };
});

const { mockGsapTo, mockKillTweens } = vi.hoisted(() => ({
  mockGsapTo: vi.fn(),
  mockKillTweens: vi.fn(),
}));
vi.mock('gsap', () => ({ default: { to: mockGsapTo, killTweensOf: mockKillTweens } }));

import { BlockerRenderer } from '../../src/game/scooby-snacks-pop/renderers/BlockerRenderer';

describe('BlockerRenderer — hp and crack visual', () => {
  test('Cobweb at 2hp renders full sprite; at 1hp renders crack variant', () => {
    const renderer = new BlockerRenderer();
    renderer.init('COBWEB', 2, 3, 5);

    // 2hp = full tint
    expect(renderer.currentHp).toBe(2);
    const fullTint = renderer.displayTint;

    renderer.takeDamage(1);
    expect(renderer.currentHp).toBe(1);
    // 1hp = crack tint (different from full)
    expect(renderer.displayTint).not.toBe(fullTint);
  });

  test('Cobweb at 0hp plays break animation then removes from scene', () => {
    const renderer = new BlockerRenderer();
    renderer.init('COBWEB', 2, 3, 5);
    renderer.takeDamage(2); // reduce to 0hp

    expect(renderer.currentHp).toBe(0);
    // Break animation must be a GSAP tween
    expect(mockGsapTo).toHaveBeenCalled();
  });

  test('Phantom Lock does not accept hp damage from adjacent regular pop', () => {
    const renderer = new BlockerRenderer();
    renderer.init('PHANTOM_LOCK', 1, 3, 5);
    const beforeHp = renderer.currentHp;

    renderer.takeDamage(1); // regular pop — should NOT damage Phantom Lock
    expect(renderer.currentHp).toBe(beforeHp);
  });
});
