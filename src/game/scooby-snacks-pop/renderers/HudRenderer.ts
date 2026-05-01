/**
 * HudRenderer — GPU-rendered HUD strip (top 127px).
 *
 * Displays: score, moves remaining, objective progress.
 * eventMode='none' — HUD is not interactive.
 * All updates go through ECS bridge → updateScore / updateMoves / updateObjective.
 */
import { Container, Text, Graphics } from 'pixi.js';
import gsap from 'gsap';
import type { TreatKind } from '../entities/TreatBubble';
import type { ObjectiveEntry } from '../entities/TreatBubble';
import { treatVisuals } from '../entities/TreatBubble';
import { VIEWPORT } from '../layout/viewport';

export class HudRenderer {
  readonly container: Container;
  private scoreLabel!: Text;
  private movesLabel!: Text;
  private bg!: Graphics;
  private objectives: ObjectiveEntry[] = [];
  private _height = VIEWPORT.HUD_TOP;
  private _originY = 0;
  private tutorialMode = false;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  get height(): number { return this._height; }
  get originY(): number { return this._originY; }

  init(viewportW: number, _viewportH: number): void {
    this._height = VIEWPORT.HUD_TOP;
    this._originY = 0;
    this.container.x = 0;
    this.container.y = 0;

    // Background strip
    this.bg = new Graphics();
    (this.bg as unknown as { rect: (x: number, y: number, w: number, h: number) => Graphics })
      .rect(0, 0, viewportW, VIEWPORT.HUD_TOP);
    (this.bg as unknown as { fill: (opts: unknown) => void }).fill({ color: 0x0d0720, alpha: 0.85 });
    this.container.addChild(this.bg);

    // Score label
    this.scoreLabel = new Text();
    (this.scoreLabel as unknown as { text: string }).text = 'Score: 0';
    (this.scoreLabel as unknown as { x: number }).x = 16;
    (this.scoreLabel as unknown as { y: number }).y = 8;
    this.container.addChild(this.scoreLabel);

    // Moves label
    this.movesLabel = new Text();
    (this.movesLabel as unknown as { text: string }).text = 'Moves: 20';
    (this.movesLabel as unknown as { x: number }).x = viewportW - 120;
    (this.movesLabel as unknown as { y: number }).y = 8;
    this.container.addChild(this.movesLabel);
  }

  /** Set tutorial mode — suppresses move counter and objectives. */
  setTutorialMode(mode: boolean): void {
    this.tutorialMode = mode;
    const movesLabel = this.movesLabel as unknown as { visible: boolean };
    if (movesLabel) movesLabel.visible = !mode;
  }

  updateScore(score: number): void {
    if (!this.scoreLabel) return;
    (this.scoreLabel as unknown as { text: string }).text = `Score: ${score}`;
    // Float-up animation hint — controller handles GSAP timeline
  }

  updateMoves(movesRemaining: number, _movesAllotted: number): void {
    if (!this.movesLabel || this.tutorialMode) return;
    (this.movesLabel as unknown as { text: string }).text = `Moves: ${movesRemaining}`;

    if (movesRemaining <= 0) {
      // Pulse red — alert player
      gsap.to(this.movesLabel, {
        pixi: { tint: 0xff2222 },
        duration: 0.15,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  setObjectives(objectives: ObjectiveEntry[]): void {
    this.objectives = objectives;
  }

  updateObjective(treatKind: TreatKind, clearedCount: number): void {
    const obj = this.objectives.find((o) => o.treatKind === treatKind);
    if (!obj) return;
    obj.clearedCount = clearedCount;

    if (clearedCount >= obj.targetCount) {
      // Fill animation on completion
      gsap.to(this.container, {
        pixi: { tint: 0xffdd00 },
        duration: 0.3,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  destroy(): void {
    gsap.killTweensOf(this.movesLabel);
    gsap.killTweensOf(this.container);
    this.bg?.destroy();
    this.scoreLabel?.destroy();
    this.movesLabel?.destroy();
    this.container.destroy({ children: true });
  }
}
