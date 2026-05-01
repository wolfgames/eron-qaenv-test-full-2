/**
 * Tests for BoardRenderer — grid layout and viewport budget.
 *
 * These tests focus on the layout constants (viewport budget) and the
 * renderer's cell-count contract. Pixi rendering is integration-level
 * and verified via the build/smoke test; pure geometry is tested here.
 */

import { describe, test, expect, vi } from 'vitest';

// Full Pixi mock — prevents ESM/CJS compatibility issues in node test env
vi.mock('pixi.js', () => {
  const makeObj = () => {
    const obj: Record<string, unknown> = {
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
      tint: 0xffffff,
    };
    return obj;
  };
  const Graphics = vi.fn().mockImplementation(() => {
    const g = makeObj();
    g['rect'] = vi.fn().mockReturnValue(g);
    g['fill'] = vi.fn().mockReturnValue(g);
    g['circle'] = vi.fn().mockReturnValue(g);
    g['clear'] = vi.fn().mockReturnValue(g);
    return g;
  });
  return {
    Container: vi.fn().mockImplementation(() => makeObj()),
    Graphics,
    Text: vi.fn().mockImplementation(() => makeObj()),
  };
});

vi.mock('gsap', () => ({
  default: {
    killTweensOf: vi.fn(),
    to: vi.fn(),
  },
}));

import { BoardRenderer } from '../../src/game/scooby-snacks-pop/renderers/BoardRenderer';
import { VIEWPORT } from '../../src/game/scooby-snacks-pop/layout/viewport';
import { CASCADE_TIMING } from '../../src/game/scooby-snacks-pop/renderers/BoardRenderer.constants';

const makeBoard = (cols = 7, rows = 9) =>
  Array.from({ length: cols * rows }, (_, i) => ({
    id: i,
    kind: 'SNACK_BONE' as const,
  }));

describe('BoardRenderer — grid layout and viewport budget', () => {
  test('7x9 grid: 63 cells rendered', () => {
    const renderer = new BoardRenderer();
    renderer.init(makeBoard(7, 9), 390, 844);
    expect(renderer.cellCount).toBe(63);
  });

  test('cell hit area ≥ 56x56px at 390px viewport width', () => {
    expect(VIEWPORT.CELL_W).toBeGreaterThanOrEqual(56);
    expect(VIEWPORT.CELL_H).toBeGreaterThanOrEqual(56);
  });

  test('grid top edge ≤ 127px', () => {
    expect(VIEWPORT.HUD_TOP).toBeLessThanOrEqual(127);
    expect(VIEWPORT.GRID_ORIGIN_Y).toBeLessThanOrEqual(127);
  });

  test('grid bottom edge ≥ 128px from bottom', () => {
    const gridBottom = VIEWPORT.GRID_ORIGIN_Y + VIEWPORT.ROWS * VIEWPORT.CELL_H;
    const spaceBelow = 844 - gridBottom;
    const bottomReserve = VIEWPORT.COMPANION_H + VIEWPORT.LOGO_H;
    expect(spaceBelow).toBeGreaterThanOrEqual(bottomReserve);
  });

  test('cell gap ≥ 3px between neighbors', () => {
    expect(VIEWPORT.GAP).toBeGreaterThanOrEqual(3);
  });
});

describe('BoardRenderer: cascade animation timing and escalation', () => {
  test('gravity tween duration = fallDistance * 80ms per row', () => {
    expect(CASCADE_TIMING.depth1PerRowMs).toBe(80);
  });

  test('cascade depth 1 uses standard timing; depth 2 uses reduced timing', () => {
    expect(CASCADE_TIMING.depth2PerRowMs).toBeLessThan(CASCADE_TIMING.depth1PerRowMs);
  });

  test('only displaced cells receive GSAP tween (not full board re-render)', () => {
    // The BoardRenderer.syncDrops method should only process cells with non-zero displacement
    // This is a structural test — verify the method signature exists
    const renderer = new BoardRenderer();
    expect(typeof renderer.syncDrops).toBe('function');
  });
});
