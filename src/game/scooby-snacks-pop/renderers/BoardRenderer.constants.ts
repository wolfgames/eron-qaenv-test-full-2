/**
 * BoardRenderer timing constants — gravity and cascade escalation.
 *
 * GDD-specified: 80ms per row (depth 1), escalating for deeper cascades.
 */
export const CASCADE_TIMING = {
  /** Base gravity fall: 80ms per row (GDD spec). */
  depth1PerRowMs: 80,
  /** Depth 2: 70% of depth 1. */
  depth2PerRowMs: 56,
  /** Depth 3+: 50% of depth 1. */
  depth3PlusPerRowMs: 40,
  /** New-bubble refill from top: 150ms per row (GDD spec). */
  refillPerRowMs: 150,
} as const;

export const getGravityDurationMs = (fallRows: number, cascadeDepth: number): number => {
  const perRowMs =
    cascadeDepth >= 3 ? CASCADE_TIMING.depth3PlusPerRowMs :
    cascadeDepth >= 2 ? CASCADE_TIMING.depth2PerRowMs :
    CASCADE_TIMING.depth1PerRowMs;
  return fallRows * perRowMs;
};
