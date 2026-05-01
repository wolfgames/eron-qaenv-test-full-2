/**
 * Blocker entity definitions.
 *
 * Blockers are obstacle cells that resist clearing.
 * - COBWEB / HAUNTED_FRAME / STONE_GARGOYLE: take 1 HP from adjacent-pop damage.
 * - PHANTOM_LOCK: immune to adjacent-pop; only cleared by combo activation.
 */
import type { BlockerKind } from './TreatBubble';

export interface BlockerDef {
  maxHp: number;
  /** Tint when at full HP */
  tintFull: number;
  /** Tint when at 1 HP (cracked state) */
  tintCracked: number;
  label: string;
  /** Emoji displayed on the blocker (fallback priority: emoji text > tinted shape) */
  emoji: string;
  /** If true, adjacentDamage has no effect on this blocker */
  comboOnly: boolean;
}

export const blockerDefs: Record<BlockerKind, BlockerDef> = {
  COBWEB: {
    maxHp: 2,
    tintFull:    0xCCCCCC,
    tintCracked: 0x888888,
    label: 'Cobweb',
    emoji: '🕸️',
    comboOnly: false,
  },
  HAUNTED_FRAME: {
    maxHp: 1,
    tintFull:    0xAA8844,
    tintCracked: 0xAA8844,
    label: 'Haunted Frame',
    emoji: '🖼️',
    comboOnly: false,
  },
  STONE_GARGOYLE: {
    maxHp: 3,
    tintFull:    0x778899,
    tintCracked: 0x445566,
    label: 'Stone Gargoyle',
    emoji: '🗿',
    comboOnly: false,
  },
  PHANTOM_LOCK: {
    maxHp: 1,
    tintFull:    0x6633FF,
    tintCracked: 0x6633FF,
    label: 'Phantom Lock',
    emoji: '🔒',
    comboOnly: true,
  },
};
