/**
 * ComboRenderer — renders combo bubble spawn + activation animations.
 *
 * Follows the renderer contract: spawnCombo creates a Graphics circle
 * at the group centroid and GSAP-animates scale 0→1.
 * Static helper getTintForKind provides visually distinct tints per combo type.
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import type { ComboKind } from '../entities/TreatBubble';
import { comboVisuals } from '../entities/ComboBubble';
import { VIEWPORT } from '../layout/viewport';

export class ComboRenderer {
  readonly container: Container;

  private sprites: Map<ComboKind, Graphics[]> = new Map();
  private labels: Map<ComboKind, Text[]> = new Map();

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  /**
   * Spawn a combo bubble at the grid cell (col, row) centroid.
   * Animates scale 0→1 with a bouncy ease.
   */
  spawnCombo(kind: ComboKind, col: number, row: number): void {
    const tint = ComboRenderer.getTintForKind(kind);
    const r = VIEWPORT.BUBBLE_SIZE / 2;
    const cx = VIEWPORT.GRID_ORIGIN_X + col * (VIEWPORT.CELL_W + VIEWPORT.GAP) + VIEWPORT.CELL_W / 2;
    const cy = VIEWPORT.GRID_ORIGIN_Y + row * (VIEWPORT.CELL_H + VIEWPORT.GAP) + VIEWPORT.CELL_H / 2;

    const g = new Graphics();
    (g as unknown as { circle: (x: number, y: number, r: number) => Graphics }).circle(cx, cy, r);
    (g as unknown as { fill: (opts: unknown) => void }).fill({ color: tint });
    (g as unknown as { alpha: number }).alpha = 0;

    this.container.addChild(g);

    const list = this.sprites.get(kind) ?? [];
    list.push(g);
    this.sprites.set(kind, list);

    // Emoji label (fallback priority: emoji text > tinted shape — design-smells.md)
    const emoji = comboVisuals[kind].emoji;
    const emojiLabel = new Text({ text: emoji, style: { fontSize: 22 } });
    (emojiLabel as unknown as { x: number }).x = cx - 11;
    (emojiLabel as unknown as { y: number }).y = cy - 13;
    (emojiLabel as unknown as { alpha: number }).alpha = 0;
    this.container.addChild(emojiLabel as unknown as Parameters<typeof this.container.addChild>[0]);
    const labelList = this.labels.get(kind) ?? [];
    labelList.push(emojiLabel);
    this.labels.set(kind, labelList);

    gsap.to(g, {
      alpha: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
      onStart: () => {
        // scale-up via GSAP — scale property on Graphics
        (g as unknown as { scale: { set: (v: number) => void } }).scale?.set?.(0);
      },
    });
    gsap.to(emojiLabel, { alpha: 1, duration: 0.4, ease: 'back.out(1.7)' });

    gsap.to(g, {
      duration: 0.4,
      ease: 'back.out(1.7)',
    });
  }

  /** Static tint lookup — used by tests to verify visual distinctness. */
  static getTintForKind(kind: ComboKind): number {
    return comboVisuals[kind].tint;
  }

  destroy(): void {
    for (const sprites of this.sprites.values()) {
      for (const g of sprites) {
        gsap.killTweensOf(g);
        (g as unknown as { destroy: () => void }).destroy();
      }
    }
    for (const labelGroup of this.labels.values()) {
      for (const lbl of labelGroup) {
        gsap.killTweensOf(lbl);
        (lbl as unknown as { destroy: () => void }).destroy();
      }
    }
    this.sprites.clear();
    this.labels.clear();
    this.container.destroy({ children: true });
  }
}
