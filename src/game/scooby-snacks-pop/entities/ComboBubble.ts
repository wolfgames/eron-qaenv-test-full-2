/**
 * ComboBubble entity definitions.
 *
 * Combo bubbles spawn when a group of 5+ same-type treats is cleared.
 * Each type has a distinct visual tint and activation effect.
 */
import type { ComboKind } from './TreatBubble';

export interface ComboVisual {
  tint: number;
  label: string;
  /** Emoji displayed on the combo bubble (fallback priority: emoji text > tinted shape) */
  emoji: string;
  /** Min group size to spawn this combo */
  minGroupSize: number;
}

export const comboVisuals: Record<ComboKind, ComboVisual> = {
  GHOST_CLUSTER: { tint: 0x00FFFF, label: 'Ghost Cluster', emoji: '👻', minGroupSize: 5 },
  SPOOK_BOMB:    { tint: 0xFF6600, label: 'Spook Bomb',    emoji: '💣', minGroupSize: 7 },
  MEGA_MUNCHIE:  { tint: 0xFF00FF, label: 'Mega Munchie',  emoji: '🌟', minGroupSize: 10 },
};
