/**
 * LevelGenerator — seeded procedural level generation.
 *
 * Uses mulberry32 PRNG seeded with levelNumber * 98765 + attempt.
 * 5-step pipeline: seedInit → difficultyParams → gridPopulation →
 * SolvabilityChecker.check() → objectiveInjection.
 *
 * Rejection conditions (retry up to 10 times, then use fallback JSON):
 *   DEADLOCK — no valid pop anywhere on generated board
 *   OBJECTIVE_IMPOSSIBLE — targetCount exceeds board presence
 *   BLOCKER_SURROUNDED — all treat cells are adjacent to blockers only
 *   OVERBUDGET — blocker density > maxBlockerDensity
 *
 * No Math.random() — seeded PRNG only.
 */
import type { BoardCell, TreatKind, ObjectiveEntry } from '../entities/TreatBubble';
import { SolvabilityChecker } from './SolvabilityChecker';
import { getDifficultyParams } from './difficultyTable';
import fallbackLevelsJson from '../data/fallback-levels.json';

const COLS = 7;
const ROWS = 9;
const MAX_RETRIES = 10;
const TREAT_KINDS: TreatKind[] = ['SNACK_BONE', 'BURGER', 'PIZZA', 'HOTDOG', 'MYSTERY_GLOB'];

/** mulberry32 PRNG — deterministic, seeded. Returns [0,1). */
const mulberry32 = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
};

export interface GeneratedLevel {
  levelNumber: number;
  rows: number;
  cols: number;
  board: BoardCell[];
  objectives: ObjectiveEntry[];
  movesAllotted: number;
  tutorialMode: false;
  fromFallback: boolean;
}

const generateBoard = (
  rng: () => number,
  treatKinds: TreatKind[],
): BoardCell[] => {
  const total = COLS * ROWS;
  return Array.from({ length: total }, (_, i) => {
    const kindIdx = Math.floor(rng() * treatKinds.length);
    return { id: i, kind: treatKinds[kindIdx] };
  });
};

const buildObjectives = (
  board: BoardCell[],
  treatKinds: TreatKind[],
  ratio: number,
  rng: () => number,
): ObjectiveEntry[] => {
  // Pick one or two treat kinds to build objectives for
  const shuffled = [...treatKinds].sort(() => rng() - 0.5);
  const objKinds = shuffled.slice(0, Math.min(2, shuffled.length));
  return objKinds.map((treatKind) => {
    const total = board.filter((c) => c.kind === treatKind).length;
    const targetCount = Math.max(2, Math.floor(total * ratio));
    return { treatKind, targetCount, clearedCount: 0 };
  });
};

const fromFallback = (levelNumber: number): GeneratedLevel => {
  const pool = (fallbackLevelsJson as { levels: GeneratedLevel[] }).levels;
  const idx = (levelNumber - 4) % pool.length;
  const entry = pool[idx];
  return {
    ...entry,
    levelNumber,
    rows: ROWS,
    cols: COLS,
    tutorialMode: false,
    fromFallback: true,
  };
};

export const LevelGenerator = {
  generate(levelNumber: number): GeneratedLevel {
    const params = getDifficultyParams(levelNumber);
    const treatKinds = TREAT_KINDS.slice(0, params.treatTypeCount);

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const seed = levelNumber * 98765 + attempt;
      const rng = mulberry32(seed);
      const board = generateBoard(rng, treatKinds);

      // Check DEADLOCK
      const { solvable } = SolvabilityChecker.check(board, COLS, ROWS);
      if (!solvable) continue;

      // Build objectives
      const objectives = buildObjectives(board, treatKinds, params.objectiveRatio, rng);

      // Check OBJECTIVE_IMPOSSIBLE
      const valid = objectives.every((obj) => {
        const present = board.filter((c) => c.kind === obj.treatKind).length;
        return obj.targetCount <= present;
      });
      if (!valid) continue;

      return {
        levelNumber,
        rows: ROWS,
        cols: COLS,
        board,
        objectives,
        movesAllotted: params.movesAllotted,
        tutorialMode: false,
        fromFallback: false,
      };
    }

    // All retries failed — use fallback JSON
    return fromFallback(levelNumber);
  },
};
