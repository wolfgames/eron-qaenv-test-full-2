/**
 * Tests for CompanionRenderer — dialogue triggers and positioning.
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
      g['circle'] = vi.fn().mockReturnValue(g);
      g['fill'] = vi.fn().mockReturnValue(g);
      g['rect'] = vi.fn().mockReturnValue(g);
      g['roundRect'] = vi.fn().mockReturnValue(g);
      return g;
    }),
  };
});

const { mockGsapTo, mockDelayedCall } = vi.hoisted(() => ({
  mockGsapTo: vi.fn(),
  mockDelayedCall: vi.fn(),
}));
vi.mock('gsap', () => ({ default: { to: mockGsapTo, killTweensOf: vi.fn(), delayedCall: mockDelayedCall } }));

import { CompanionRenderer } from '../../src/game/scooby-snacks-pop/renderers/CompanionRenderer';
import { VIEWPORT } from '../../src/game/scooby-snacks-pop/layout/viewport';

describe('CompanionRenderer — dialogue triggers and positioning', () => {
  test('companion strip y position = viewport_h - companion_h - logo_h = 844-64-64=716', () => {
    const renderer = new CompanionRenderer();
    renderer.init(390, 844);
    // Container y should be at 844 - 64(logo) - 64(companion) = 716
    const expectedY = 844 - VIEWPORT.LOGO_H - VIEWPORT.COMPANION_H;
    expect(renderer.stripY).toBe(expectedY);
  });

  test('first-tap event triggers dialogue text update', () => {
    const renderer = new CompanionRenderer();
    renderer.init(390, 844);
    renderer.showDialogue('firstTap');
    // GSAP to() should have been called for the fade-in animation
    expect(mockGsapTo).toHaveBeenCalled();
  });

  test('dialogue auto-dismisses after 3000ms (GSAP delayedCall)', () => {
    const renderer = new CompanionRenderer();
    renderer.init(390, 844);
    renderer.showDialogue('firstTap');
    // GSAP delayedCall must be used for 3s auto-dismiss (not setTimeout)
    expect(mockDelayedCall).toHaveBeenCalledWith(3, expect.any(Function));
  });

  test('win event shows distinct happy dialogue variant', () => {
    const renderer = new CompanionRenderer();
    renderer.init(390, 844);
    const winText = renderer.getDialogueText('win');
    const neutralText = renderer.getDialogueText('firstTap');
    expect(winText).not.toBe(neutralText);
    expect(winText.length).toBeGreaterThan(0);
  });
});
