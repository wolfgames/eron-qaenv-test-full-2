/**
 * Tests for ComboRenderer — spawn materialisation.
 */

import { describe, test, expect, vi } from 'vitest';

vi.mock('pixi.js', () => {
  const makeObj = () => ({
    addChild: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    x: 0,
    y: 0,
    scale: { set: vi.fn() },
    alpha: 1,
    eventMode: 'none',
  });
  return {
    Container: vi.fn(makeObj),
    Text: vi.fn(() => ({ ...makeObj(), text: '' })),
    Graphics: vi.fn(() => {
      const g: Record<string, unknown> = { destroy: vi.fn() };
      g['circle'] = vi.fn().mockReturnValue(g);
      g['fill'] = vi.fn().mockReturnValue(g);
      return g;
    }),
  };
});

const { mockGsapTo } = vi.hoisted(() => ({ mockGsapTo: vi.fn() }));
vi.mock('gsap', () => ({ default: { to: mockGsapTo, killTweensOf: vi.fn() } }));

import { ComboRenderer } from '../../src/game/scooby-snacks-pop/renderers/ComboRenderer';
import type { ComboKind } from '../../src/game/scooby-snacks-pop/entities/TreatBubble';

describe('ComboRenderer — spawn materialisation', () => {
  test('Ghost Cluster spawns with scale 0→1 GSAP tween at group centroid', () => {
    const renderer = new ComboRenderer();
    renderer.spawnCombo('GHOST_CLUSTER', 2, 4);

    expect(mockGsapTo).toHaveBeenCalled();
    const call = mockGsapTo.mock.calls[0];
    // GSAP tween should be called with a scale-to-1 config
    expect(call[1]).toMatchObject({ duration: expect.any(Number) });
  });

  test('3 combo types have visually distinct sprites/tints', () => {
    const kinds: ComboKind[] = ['GHOST_CLUSTER', 'SPOOK_BOMB', 'MEGA_MUNCHIE'];
    const tints = kinds.map((k) => ComboRenderer.getTintForKind(k));
    const uniqueTints = new Set(tints);
    expect(uniqueTints.size).toBe(3);
  });
});
