/**
 * BoardRenderer — renders the 7×9 bubble grid on the GPU canvas.
 *
 * Follows the renderer contract: init → sync/update → destroy.
 * No DOM, no game state — reads BoardCell array from ECS resource.
 *
 * Input: pointertap on boardLayer container → onCellTap(col, row) callback.
 * All cell sprites pre-allocated; no per-frame allocation.
 */
import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { BoardCell, TreatKind, CellKind } from '../entities/TreatBubble';
import { treatVisuals } from '../entities/TreatBubble';
import { VIEWPORT } from '../layout/viewport';
import { getGravityDurationMs } from './BoardRenderer.constants';
import type { Drop } from '../state/boardPhysics';

export { CASCADE_TIMING } from './BoardRenderer.constants';

type CellTapCallback = (col: number, row: number) => void;

interface CellSprite {
  container: Container;
  circle: Graphics;
  col: number;
  row: number;
}

export class BoardRenderer {
  readonly container: Container;
  private cellSprites: CellSprite[] = [];
  private onCellTap: CellTapCallback | null = null;
  private _cols = 0;
  private _rows = 0;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'passive';
  }

  get cellCount(): number {
    return this.cellSprites.length;
  }

  /**
   * Create cell sprites and position the grid within the safe play area.
   * Pre-allocates all sprites — no allocation during render/update.
   */
  init(board: BoardCell[], viewportW: number, viewportH: number, cols = VIEWPORT.COLS, rows = VIEWPORT.ROWS): void {
    this._cols = cols;
    this._rows = rows;

    const cellW = Math.floor(viewportW / cols);
    const cellH = cellW; // square cells (use CELL_W as basis)
    const gridW = cols * VIEWPORT.CELL_W + (cols - 1) * VIEWPORT.GAP;
    const originX = Math.floor((viewportW - gridW) / 2);
    const originY = VIEWPORT.GRID_ORIGIN_Y;

    // Pre-allocate one container+circle per cell
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const cell = board[idx];

        const cellContainer = new Container();
        cellContainer.eventMode = 'static';
        cellContainer.x = originX + col * (VIEWPORT.CELL_W + VIEWPORT.GAP);
        cellContainer.y = originY + row * (VIEWPORT.CELL_H + VIEWPORT.GAP);

        const circle = new Graphics();
        // Hit-test area (invisible rect, covers full cell)
        (circle as unknown as { rect: (x: number, y: number, w: number, h: number) => Graphics })
          .rect(0, 0, VIEWPORT.CELL_W, VIEWPORT.CELL_H);
        (circle as unknown as { fill: (opts: unknown) => void }).fill({ color: 0x000000, alpha: 0.01 });

        // Visible bubble (colored circle inside cell)
        const tint = this.getTint(cell?.kind ?? 'EMPTY');
        if (tint !== null) {
          const r = VIEWPORT.BUBBLE_SIZE / 2;
          const cx = VIEWPORT.CELL_W / 2;
          const cy = VIEWPORT.CELL_H / 2;
          (circle as unknown as { circle: (x: number, y: number, r: number) => Graphics })
            .circle(cx, cy, r);
          (circle as unknown as { fill: (opts: unknown) => void }).fill({ color: tint });
        }

        cellContainer.addChild(circle);
        this.container.addChild(cellContainer);

        // Tap handler
        const c = col;
        const r = row;
        cellContainer.on('pointertap', () => this.onCellTap?.(c, r));

        this.cellSprites.push({ container: cellContainer, circle, col, row });
      }
    }
  }

  /** Register tap callback — called by GameController. */
  setTapHandler(cb: CellTapCallback): void {
    this.onCellTap = cb;
  }

  /** Shake animation for invalid tap (group < 2). */
  shakeCell(col: number, row: number): void {
    const sprite = this.cellSprites[row * this._cols + col];
    if (!sprite) return;
    const origX = sprite.container.x;
    gsap.to(sprite.container, {
      x: origX + 6,
      duration: 0.05,
      yoyo: true,
      repeat: 5,
      ease: 'power1.inOut',
      onComplete: () => { sprite.container.x = origX; },
    });
  }

  syncBoard(board: BoardCell[]): void {
    board.forEach((cell, idx) => {
      const sprite = this.cellSprites[idx];
      if (!sprite) return;
      const tint = this.getTint(cell.kind);
      if (tint !== null) {
        (sprite.circle as unknown as { tint: number }).tint = tint;
      }
    });
  }

  /**
   * Animate gravity drops — only displaced cells receive GSAP tweens.
   * @param drops - array of {id, col, fromRow, toRow} from boardPhysics.applyGravity
   * @param cascadeDepth - for timing escalation
   */
  syncDrops(drops: Drop[], cascadeDepth = 0): Promise<void> {
    if (drops.length === 0) return Promise.resolve();

    return new Promise((resolve) => {
      let completed = 0;
      for (const drop of drops) {
        const sprite = this.cellSprites.find((s) => s.col === drop.col && s.row === drop.fromRow);
        if (!sprite) {
          completed++;
          if (completed === drops.length) resolve();
          continue;
        }
        const fallRows = drop.toRow - drop.fromRow;
        const durationMs = getGravityDurationMs(fallRows, cascadeDepth);
        const targetY = VIEWPORT.GRID_ORIGIN_Y + drop.toRow * (VIEWPORT.CELL_H + VIEWPORT.GAP);

        gsap.to(sprite.container, {
          y: targetY,
          duration: durationMs / 1000,
          ease: 'power2.out',
          onComplete: () => {
            sprite.row = drop.toRow;
            completed++;
            if (completed === drops.length) resolve();
          },
        });
      }
    });
  }

  private getTint(kind: CellKind): number | null {
    if (kind === 'EMPTY') return null;
    const treatKinds: TreatKind[] = ['SNACK_BONE', 'BURGER', 'PIZZA', 'HOTDOG', 'MYSTERY_GLOB'];
    if (treatKinds.includes(kind as TreatKind)) {
      return treatVisuals[kind as TreatKind].tint;
    }
    // Blocker/combo default tint
    return 0x888888;
  }

  destroy(): void {
    gsap.killTweensOf(this.cellSprites.map((s) => s.container));
    this.cellSprites.forEach((s) => {
      s.container.removeAllListeners?.();
      s.container.destroy({ children: true });
    });
    this.cellSprites = [];
    this.container.destroy({ children: true });
  }
}
