/**
 * BackgroundRenderer — chapter-themed background tile layer.
 *
 * Pixi GPU (bgLayer). Behind boardLayer in z-order.
 * Core pass: emoji tile grid at 50% alpha.
 * Secondary pass: GPU spritesheet atlas per chapter.
 *
 * Chapter themes (core pass fallback — emoji tiles):
 *   1: 🏚️🌙🕸️  Haunted Mansion
 *   2: 🌳🐾🌿  Mystery Woods
 *   3: 🏰🦇🌑  Castle Ramparts
 *   4: 🌊🐟🔦  Sunken Ship
 *   5: 🌋🏜️🌵  Desert Ruins
 */
import { Container, Text } from 'pixi.js';

const CHAPTER_EMOJIS: Record<number, string[]> = {
  1: ['🏚️', '🌙', '🕸️'],
  2: ['🌳', '🐾', '🌿'],
  3: ['🏰', '🦇', '🌑'],
  4: ['🌊', '🐟', '🔦'],
  5: ['🌋', '🏜️', '🌵'],
};

const TILE_SIZE = 64;

export class BackgroundRenderer {
  readonly container: Container;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
    (this.container as unknown as { alpha: number }).alpha = 0.5;
  }

  /**
   * Populate the background with emoji tiles for the given chapter.
   * @param viewportW  - Canvas width
   * @param viewportH  - Canvas height
   * @param chapter    - Chapter number (1–5)
   */
  init(viewportW: number, viewportH: number, chapter: number): void {
    const emojis = CHAPTER_EMOJIS[chapter] ?? CHAPTER_EMOJIS[1];

    const cols = Math.ceil(viewportW / TILE_SIZE) + 1;
    const rows = Math.ceil(viewportH / TILE_SIZE) + 1;
    let emojiIdx = 0;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const emoji = emojis[emojiIdx % emojis.length];
        emojiIdx++;
        const tile = new Text({ text: emoji, style: { fontSize: 32 } });
        (tile as unknown as { x: number }).x = col * TILE_SIZE;
        (tile as unknown as { y: number }).y = row * TILE_SIZE;
        this.container.addChild(tile as unknown as Parameters<typeof this.container.addChild>[0]);
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
