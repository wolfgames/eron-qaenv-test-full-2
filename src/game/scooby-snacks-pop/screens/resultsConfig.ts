/**
 * resultsConfig — button definitions for the Results screen.
 *
 * Imported by ResultsScreen.tsx (DOM screen) and tested independently.
 * Defines button ids, touch target minimums, and zone placement.
 */

export interface ResultsButtonDef {
  id: string;
  label: string;
  /** Minimum height in px (touch target — must be ≥ 44px). */
  minHeightPx: number;
  /** Screen zone for placement. */
  zone: 'bottom-half' | 'center';
  /** True if non-functional in core pass. */
  disabled: boolean;
  /** Win-only (shown on level complete). */
  winOnly?: boolean;
  /** Loss-only (shown on game over). */
  lossOnly?: boolean;
}

export const RESULTS_BUTTONS: ResultsButtonDef[] = [
  {
    id: 'next-level',
    label: 'Next Level',
    minHeightPx: 52,
    zone: 'bottom-half',
    disabled: false,
    winOnly: true,
  },
  {
    id: 'try-again',
    label: 'Try Again',
    minHeightPx: 52,
    zone: 'bottom-half',
    disabled: false,
    lossOnly: true,
  },
  {
    id: 'get-more-moves',
    label: 'Get 5 More Moves',
    minHeightPx: 44,
    zone: 'center',
    disabled: true, // monetization deferred to secondary pass
    lossOnly: true,
  },
];
