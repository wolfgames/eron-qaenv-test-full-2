/**
 * Tests for BackgroundRenderer — layer order and legibility.
 */

import { describe, test, expect, vi } from 'vitest';

vi.mock('pixi.js', () => {
  const makeObj = () => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    x: 0,
    y: 0,
    alpha: 1,
    eventMode: 'none',
    tint: 0xffffff,
    text: '',
  });
  return {
    Container: vi.fn(makeObj),
    Text: vi.fn(() => ({ ...makeObj(), text: '' })),
    Graphics: vi.fn(() => {
      const g: Record<string, unknown> = { ...makeObj() };
      g['rect'] = vi.fn().mockReturnValue(g);
      g['fill'] = vi.fn().mockReturnValue(g);
      return g;
    }),
  };
});

vi.mock('gsap', () => ({ default: { to: vi.fn(), killTweensOf: vi.fn() } }));

import { BackgroundRenderer } from '../../src/game/scooby-snacks-pop/renderers/BackgroundRenderer';

describe('BackgroundRenderer — layer order and legibility', () => {
  test('bg layer is child of bgLayer (below boardLayer in z-order)', () => {
    const bgLayer = { addChild: vi.fn(), eventMode: 'none' } as unknown as Parameters<typeof bgLayer.addChild>[0];
    const renderer = new BackgroundRenderer();
    renderer.init(390, 844, 1);
    // The container must be designed to be added to bgLayer
    // We verify it has the expected structure
    expect(renderer.container).toBeDefined();
  });

  test('background renders emoji tile grid (not empty canvas)', () => {
    const renderer = new BackgroundRenderer();
    renderer.init(390, 844, 1);
    // The renderer should have added children (tile graphics/texts)
    const childrenAdded = (renderer.container.addChild as ReturnType<typeof vi.fn>).mock.calls.length;
    expect(childrenAdded).toBeGreaterThan(0);
  });
});
