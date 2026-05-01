/**
 * scoringLogic — pure scoring functions.
 *
 * Formula: perTapScore = (groupSize - 1) * 50 * (cascadeDepth + 1)
 * Stars: 1=complete; 2=movesRemaining≥30%; 3=movesRemaining≥55%
 *
 * No Pixi imports, no side effects.
 */

/**
 * Compute score for a single pop event.
 * @param groupSize - number of bubbles cleared (including wildcards)
 * @param cascadeDepth - 0 for first pop, increments with each cascade chain
 */
export const computeScore = (groupSize: number, cascadeDepth: number): number =>
  (groupSize - 1) * 50 * (cascadeDepth + 1);

/**
 * Compute star rating after level completion.
 * @param movesRemaining - moves left after all objectives met
 * @param movesAllotted - total moves given for the level
 */
export const computeStars = (movesRemaining: number, movesAllotted: number): 1 | 2 | 3 => {
  if (movesAllotted <= 0) return 1;
  const pct = movesRemaining / movesAllotted;
  if (pct >= 0.55) return 3;
  if (pct >= 0.30) return 2;
  return 1;
};
