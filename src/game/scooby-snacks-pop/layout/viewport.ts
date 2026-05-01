/**
 * Viewport constants for Scooby Snacks Pop!
 *
 * Reference device: iPhone portrait 390×844.
 * All values derived from pipeline viewport budget in implementation-plan.yml.
 * No magic numbers in renderers — always reference these constants.
 */

/** Top HUD strip height (15% of 844px) */
export const HUD_TOP = 127;

/** Scooby companion strip height above logo */
export const COMPANION_H = 64;

/** Wolf Games logo DOM overlay reserved height */
export const LOGO_H = 64;

/** Gap between cells in pixels */
export const GAP = 3;

/** Board columns */
export const COLS = 7;

/** Board rows */
export const ROWS = 9;

/** Cell width including padding — safe hit target ≥ 44pt */
export const CELL_W = 56;

/** Cell height */
export const CELL_H = 65;

/** Visible bubble diameter (≥ 48px per canvas CoS) */
export const BUBBLE_SIZE = 50;

/** Grid y origin (flush below HUD strip) */
export const GRID_ORIGIN_Y = HUD_TOP;

/** Grid x origin (centered in 390px) */
export const GRID_ORIGIN_X = Math.floor((390 - COLS * CELL_W) / 2);

/** Bottom reserved space (companion + logo) */
export const BOTTOM_RESERVE = COMPANION_H + LOGO_H;

export const VIEWPORT = {
  HUD_TOP,
  COMPANION_H,
  LOGO_H,
  GAP,
  COLS,
  ROWS,
  CELL_W,
  CELL_H,
  BUBBLE_SIZE,
  GRID_ORIGIN_Y,
  GRID_ORIGIN_X,
  BOTTOM_RESERVE,
} as const;
