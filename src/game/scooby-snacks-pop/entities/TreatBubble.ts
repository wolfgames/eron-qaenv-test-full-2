/**
 * Treat bubble entity definitions.
 *
 * TreatKind: the 5 main bubble types + wildcard.
 * ComboKind: 3 combo bubble types (spawn detection in core pass; activation secondary pass).
 * BlockerKind: 4 blocker types.
 * GamePhase: board state machine states.
 * BoardCell: single cell in the flat row-major grid resource.
 */

export type TreatKind =
  | 'SNACK_BONE'
  | 'BURGER'
  | 'PIZZA'
  | 'HOTDOG'
  | 'MYSTERY_GLOB';

export type ComboKind = 'GHOST_CLUSTER' | 'SPOOK_BOMB' | 'MEGA_MUNCHIE';

export type BlockerKind =
  | 'COBWEB'          // 2hp, adjacent-pop damage
  | 'HAUNTED_FRAME'   // 1hp, adjacent-pop damage
  | 'STONE_GARGOYLE'  // 3hp, gravity blocker
  | 'PHANTOM_LOCK';   // combo-only damage (secondary pass)

export type CellKind =
  | 'EMPTY'
  | TreatKind
  | ComboKind
  | BlockerKind;

export type GamePhase = 'IDLE' | 'ANIMATING' | 'WON' | 'LOST' | 'PAUSED';

/** A single cell in the flat row-major board grid (boardCols × boardRows). */
export interface BoardCell {
  id: number;       // stable identity across gravity moves
  kind: CellKind;
  hp?: number;      // for blockers with hit points
}

/** Level objective: clear N of treat type. */
export interface ObjectiveEntry {
  treatKind: TreatKind;
  targetCount: number;
  clearedCount: number;
}

/** Visual constants for each treat type. */
export const treatVisuals: Record<TreatKind, { tint: number; emoji: string; label: string }> = {
  SNACK_BONE:   { tint: 0x6EB5FF, emoji: '🦴', label: 'Snack Bone' },
  BURGER:       { tint: 0xFF8C00, emoji: '🍔', label: 'Burger Bubble' },
  PIZZA:        { tint: 0xFF4500, emoji: '🍕', label: 'Pizza Slice' },
  HOTDOG:       { tint: 0xFFE333, emoji: '🌭', label: 'Hot Dog' },
  MYSTERY_GLOB: { tint: 0x9B59B6, emoji: '🟣', label: 'Mystery Glob' },
};
