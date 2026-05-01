/**
 * BubbleRenderer — renders a single bubble cell sprite.
 *
 * Uses Graphics (filled circle) + Text (emoji label) for core pass.
 * GPU-only — no DOM. Each type distinguishable by color AND emoji (never color alone).
 */
import { Container, Graphics, Text } from 'pixi.js';
import { treatVisuals, type TreatKind } from '../entities/TreatBubble';
import { BUBBLE_SIZE } from './BubbleRenderer.constants';

export { BUBBLE_SIZE } from './BubbleRenderer.constants';

export class BubbleRenderer {
  readonly container: Container;
  private circle: Graphics;
  private label: Text;

  constructor() {
    this.container = new Container();
    this.circle = new Graphics();
    this.label = new Text();
    this.container.addChild(this.circle);
    this.container.addChild(this.label);
  }

  renderKind(kind: TreatKind): void {
    const { tint, emoji } = treatVisuals[kind];
    const r = BUBBLE_SIZE / 2;

    this.circle.clear?.();
    (this.circle as unknown as { circle: (x: number, y: number, r: number) => Graphics })
      .circle(0, 0, r)?.fill?.({ color: tint });

    (this.label as unknown as { text: string; x: number; y: number; style: unknown }).text = emoji;
    (this.label as unknown as { x: number }).x = -6;
    (this.label as unknown as { y: number }).y = -10;
  }

  destroy(): void {
    this.circle.destroy();
    this.label.destroy();
    this.container.destroy({ children: true });
  }
}
