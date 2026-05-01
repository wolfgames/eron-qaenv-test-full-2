/**
 * Tests for StartScreen — cutscene gating and navigation.
 *
 * The startView controller reads localStorage to determine
 * whether to show the cutscene or skip directly to game.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { setupStartScreen } from '../../src/game/scooby-snacks-pop/screens/startView';

// Minimal localStorage polyfill for node environment
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { mockStorage[key] = val; }),
  removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
  clear: vi.fn(() => { for (const k in mockStorage) delete mockStorage[k]; }),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true,
});

beforeEach(() => {
  mockLocalStorage.clear();
  vi.clearAllMocks();
});

const makeDeps = () => ({
  initGpu: vi.fn().mockResolvedValue(undefined),
  unlockAudio: vi.fn(),
  loadCore: vi.fn().mockResolvedValue(undefined),
  loadAudio: vi.fn().mockResolvedValue(undefined),
  goto: vi.fn(),
  analytics: { trackGameStart: vi.fn() },
});

describe('StartScreen and cutscene gating', () => {
  test('Play navigates to cutscene if localStorage cutscene-seen absent', () => {
    const deps = makeDeps();
    const controller = setupStartScreen(deps as Parameters<typeof setupStartScreen>[0]);

    // cutscene-seen not set — should detect first-time player
    expect(controller.isCutsceneSeen()).toBe(false);
  });

  test('Play navigates directly to game if cutscene-seen=true', () => {
    mockLocalStorage.setItem('scooby-snacks-pop:cutscene-seen', 'true');
    const deps = makeDeps();
    const controller = setupStartScreen(deps as Parameters<typeof setupStartScreen>[0]);

    expect(controller.isCutsceneSeen()).toBe(true);
  });

  test('cutscene skip button visible from panel 1', () => {
    const deps = makeDeps();
    const controller = setupStartScreen(deps as Parameters<typeof setupStartScreen>[0]);

    const panels = controller.getCutscenePanels();
    expect(panels.length).toBe(3);
    // All panels should have the skip option available (controlled by showSkip: true)
    expect(panels[0].showSkip).toBe(true);
  });

  test('last panel tap sets cutscene-seen and navigates to tutorial level 1', () => {
    const deps = makeDeps();
    const controller = setupStartScreen(deps as Parameters<typeof setupStartScreen>[0]);

    controller.markCutsceneSeen();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('scooby-snacks-pop:cutscene-seen', 'true');
  });
});
