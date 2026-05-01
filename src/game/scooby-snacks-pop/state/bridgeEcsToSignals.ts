/**
 * bridgeEcsToSignals — connects ECS resource changes to SolidJS signal setters.
 *
 * ECS is the source of truth. Signals are a read-only DOM bridge.
 * This function subscribes to ECS resource observables and propagates
 * changes to the provided setter callbacks.
 *
 * Returns a cleanup function that unsubscribes all observers.
 * Observe<T> is a function: (notify: (value: T) => void) => unobserve
 */
import type { GameDatabase } from './GamePlugin';

export interface SignalSetters {
  setScore: (score: number) => void;
  setMovesRemaining: (moves: number) => void;
  setPhase?: (phase: string) => void;
  setStarCount?: (stars: number) => void;
  setLevelNumber?: (level: number) => void;
  setChapterNumber?: (chapter: number) => void;
}

export const bridgeEcsToSignals = (db: GameDatabase, setters: SignalSetters): (() => void) => {
  const unobservers: Array<() => void> = [];

  // Observe<T> is (notify: (v: T) => void) => unobserve
  const watch = <T>(obs: (notify: (v: T) => void) => () => void, fn: (v: T) => void) => {
    unobservers.push(obs(fn));
  };

  watch(db.observe.resources.score, setters.setScore);
  watch(db.observe.resources.movesRemaining, setters.setMovesRemaining);

  if (setters.setPhase) {
    watch(db.observe.resources.phase, (v) => setters.setPhase!(v));
  }
  if (setters.setStarCount) {
    watch(db.observe.resources.starCount, (v) => setters.setStarCount!(v));
  }
  if (setters.setLevelNumber) {
    watch(db.observe.resources.levelNumber, (v) => setters.setLevelNumber!(v));
  }
  if (setters.setChapterNumber) {
    watch(db.observe.resources.chapterNumber, (v) => setters.setChapterNumber!(v));
  }

  return () => unobservers.forEach((fn) => fn());
};
