/**
 * BlockerRenderer — renders blocker obstacles with HP and crack states.
 *
 * Follows the renderer contract:
 *   init(kind, maxHp, col, row) → create visuals
 *   takeDamage(amount)          → update HP; play break animation at 0
 *   currentHp (getter)          → current hit points
 *   displayTint (getter)        → current tint reflecting HP state
 *   destroy()                   → GSAP kill → destroy
 *
 * Phantom Lock is immune to takeDamage (comboOnly blocker).
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import type { BlockerKind } from '../entities/TreatBubble';
import { blockerDefs } from '../entities/Blocker';
import { VIEWPORT } from '../layout/viewport';

export class BlockerRenderer {
  readonly container: Container;

  private _kind: BlockerKind | null = null;
  private _hp = 0;
  private _tintFull = 0xffffff;
  private _tintCracked = 0xffffff;
  private _comboOnly = false;
  private _circle: Graphics | null = null;
  private _label: Text | null = null;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  get currentHp(): number {
    return this._hp;
  }

  /**
   * Returns the tint currently displayed:
   * - At maxHp: tintFull
   * - At 1hp (cracked): tintCracked
   * - At 0hp: 0x000000 (removed from scene, but still readable)
   */
  get displayTint(): number {
    if (this._hp <= 0) return 0x000000;
    if (this._hp === 1) return this._tintCracked;
    return this._tintFull;
  }

  /**
   * Create the blocker visual at (col, row).
   * @param kind    - BlockerKind
   * @param maxHp   - Starting HP (passed explicitly to allow level overrides)
   * @param col     - Grid column
   * @param row     - Grid row
   */
  init(kind: BlockerKind, maxHp: number, col: number, row: number): void {
    const def = blockerDefs[kind];
    this._kind = kind;
    this._hp = maxHp;
    this._tintFull = def.tintFull;
    this._tintCracked = def.tintCracked;
    this._comboOnly = def.comboOnly;

    const cx = VIEWPORT.GRID_ORIGIN_X + col * (VIEWPORT.CELL_W + VIEWPORT.GAP) + VIEWPORT.CELL_W / 2;
    const cy = VIEWPORT.GRID_ORIGIN_Y + row * (VIEWPORT.CELL_H + VIEWPORT.GAP) + VIEWPORT.CELL_H / 2;
    const r = VIEWPORT.BUBBLE_SIZE / 2;

    const g = new Graphics();
    (g as unknown as { circle: (x: number, y: number, r: number) => Graphics }).circle(cx, cy, r);
    (g as unknown as { fill: (opts: unknown) => void }).fill({ color: this.displayTint });
    (g as unknown as { tint: number }).tint = this.displayTint;
    this._circle = g;
    this.container.addChild(g);

    // Emoji label (fallback priority: emoji text > tinted shape — design-smells.md)
    const emojiLabel = new Text({ text: def.emoji, style: { fontSize: 22 } });
    (emojiLabel as unknown as { x: number }).x = cx - 11;
    (emojiLabel as unknown as { y: number }).y = cy - 13;
    this._label = emojiLabel;
    this.container.addChild(emojiLabel as unknown as Parameters<typeof this.container.addChild>[0]);
  }

  /**
   * Apply damage to this blocker.
   * - Phantom Lock (comboOnly) ignores damage from regular adjacent pops.
   * - At 0 HP, plays break animation and removes visual.
   */
  takeDamage(amount: number): void {
    if (this._comboOnly) return; // Phantom Lock: immune to adjacent-pop damage

    this._hp = Math.max(0, this._hp - amount);
    this._syncTint();

    if (this._hp === 0) {
      this._playBreakAnimation();
    }
  }

  private _syncTint(): void {
    if (!this._circle) return;
    (this._circle as unknown as { tint: number }).tint = this.displayTint;
  }

  private _playBreakAnimation(): void {
    if (!this._circle) return;
    const g = this._circle;
    gsap.to(g, {
      alpha: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (this.container && g) {
          gsap.killTweensOf(g);
          this.container.removeChild(g as unknown as Parameters<typeof this.container.removeChild>[0]);
          (g as unknown as { destroy: () => void }).destroy();
          this._circle = null;
        }
      },
    });
  }

  destroy(): void {
    if (this._circle) {
      gsap.killTweensOf(this._circle);
    }
    this.container.destroy({ children: true });
    this._circle = null;
    this._label = null;
  }
}
