import { createSignal, createRoot } from 'solid-js';

/**
 * Game state that persists across screens.
 * Created in a root to avoid disposal issues.
 *
 * Add your game-specific signals here.
 * Pause state lives in core/systems/pause (scaffold feature).
 */

export interface GameState {
  score: () => number;
  setScore: (score: number) => void;
  addScore: (amount: number) => void;

  level: () => number;
  setLevel: (level: number) => void;
  incrementLevel: () => void;

  /** True when the last completed game was a win; false = loss. Used by ResultsScreen. */
  lastGameWon: () => boolean;
  setLastGameWon: (won: boolean) => void;

  /**
   * Populated on win when the level also completed a chapter.
   * Zero means no chapter complete on last win. Used by ResultsScreen.
   */
  lastCompletedChapter: () => number;
  setLastCompletedChapter: (chapter: number) => void;

  reset: () => void;
}

function createGameState(): GameState {
  const [score, setScore] = createSignal(0);
  const [level, setLevel] = createSignal(1);
  const [lastGameWon, setLastGameWon] = createSignal(false);
  const [lastCompletedChapter, setLastCompletedChapter] = createSignal(0);

  return {
    score,
    setScore,
    addScore: (amount: number) => setScore((s) => s + amount),

    level,
    setLevel,
    incrementLevel: () => setLevel((l) => l + 1),

    lastGameWon,
    setLastGameWon,

    lastCompletedChapter,
    setLastCompletedChapter,

    reset: () => {
      setScore(0);
      setLevel(1);
      setLastCompletedChapter(0);
    },
  };
}

export const gameState = createRoot(createGameState);
