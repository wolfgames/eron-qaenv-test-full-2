/**
 * difficultyTable — maps level number to difficulty parameters.
 *
 * Used by LevelGenerator to tune board generation per level.
 * Pure data, no imports.
 */

export interface DifficultyParams {
  /** Number of active treat kinds on this level (2–5). */
  treatTypeCount: number;
  /** Max blocker density as fraction of total cells (0–0.15). */
  maxBlockerDensity: number;
  /** Allotted move count. */
  movesAllotted: number;
  /** Objective count ratio: fraction of a treat type's board presence (0.6–0.75). */
  objectiveRatio: number;
}

/**
 * Returns difficulty parameters for a given level number.
 * Difficulty scales gradually; clamped at max values for level 50+.
 */
export const getDifficultyParams = (levelNumber: number): DifficultyParams => {
  // Clamp to sensible range
  const lvl = Math.max(4, levelNumber);

  const treatTypeCount = Math.min(5, 2 + Math.floor((lvl - 4) / 5));
  const maxBlockerDensity = Math.min(0.15, (lvl - 4) * 0.005);
  const movesAllotted = Math.max(15, 25 - Math.floor((lvl - 4) / 3));
  const objectiveRatio = 0.65; // fixed midpoint in [0.60, 0.75]

  return { treatTypeCount, maxBlockerDensity, movesAllotted, objectiveRatio };
};
