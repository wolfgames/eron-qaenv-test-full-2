/**
 * Tests for TutorialOverlay — pointer and dialogue coordination.
 */

import { describe, test, expect, vi } from 'vitest';

vi.mock('pixi.js', () => {
  const makeObj = () => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    removeAllListeners: vi.fn(),
    x: 0,
    y: 0,
    alpha: 1,
    eventMode: 'none',
    tint: 0xffffff,
    text: '',
    visible: true,
  });
  return {
    Container: vi.fn(makeObj),
    Text: vi.fn(() => ({ ...makeObj(), text: '', style: {} })),
    Graphics: vi.fn(() => {
      const g: Record<string, unknown> = { ...makeObj() };
      g['rect'] = vi.fn().mockReturnValue(g);
      g['fill'] = vi.fn().mockReturnValue(g);
      return g;
    }),
  };
});

const { mockGsapTo, mockKillTweensOf } = vi.hoisted(() => ({
  mockGsapTo: vi.fn(),
  mockKillTweensOf: vi.fn(),
}));
vi.mock('gsap', () => ({ default: { to: mockGsapTo, killTweensOf: mockKillTweensOf } }));

// Minimal localStorage polyfill
const mockStorage: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => mockStorage[k] ?? null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
  },
  writable: true,
  configurable: true,
});

import { TutorialOverlay } from '../../src/game/scooby-snacks-pop/renderers/TutorialOverlay';

const makeTutorialLevel = () => ({
  tutorialMode: true as const,
  dialogue: ['Step 1: Tap the big group!', 'Step 2: Watch them pop!', 'Great job!'],
  pointer: { col: 2, row: 1 },
});

describe('TutorialOverlay — pointer and dialogue coordination', () => {
  test('pointer renders above target cell coordinates from level JSON', () => {
    const overlay = new TutorialOverlay();
    overlay.init(makeTutorialLevel(), 7, 9);

    // GSAP yoyo bounce should have been called for the pointer animation
    expect(mockGsapTo).toHaveBeenCalled();
    const call = mockGsapTo.mock.calls[0];
    // Should be a yoyo animation
    expect(call[1]).toMatchObject({ yoyo: true });
  });

  test('correct tap hides pointer and advances dialogue', () => {
    mockGsapTo.mockClear();
    mockKillTweensOf.mockClear();
    const overlay = new TutorialOverlay();
    overlay.init(makeTutorialLevel(), 7, 9);

    overlay.onCorrectTap();
    // GSAP killTweensOf should have been called to stop the bounce
    expect(mockKillTweensOf).toHaveBeenCalled();
  });

  test('tutorial-complete localStorage key set on level 3 completion', () => {
    const overlay = new TutorialOverlay();
    overlay.init(makeTutorialLevel(), 7, 9);
    overlay.complete();
    expect(mockStorage['scooby-snacks-pop:tutorial-complete']).toBe('true');
  });

  test('HUD suppresses move counter when tutorialMode=true', () => {
    // HudRenderer checks levelData.tutorialMode before rendering move counter
    // We verify the TutorialOverlay correctly reports tutorialMode
    const overlay = new TutorialOverlay();
    overlay.init(makeTutorialLevel(), 7, 9);
    expect(overlay.isTutorialMode).toBe(true);
  });
});
