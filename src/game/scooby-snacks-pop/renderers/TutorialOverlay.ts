/**
 * TutorialOverlay — in-play tutorial guidance overlay.
 *
 * GPU Pixi (not DOM). Lives on uiLayer (top z-order).
 * Ghost-finger pointer bounces over target cell with GSAP yoyo.
 * Dialogue bubble shows step-by-step guidance from level JSON.
 *
 * Usage:
 *   overlay.init(levelData, cols, rows, viewportW, viewportH)
 *   overlay.onCorrectTap()    — advance tutorial step
 *   overlay.destroy()
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { VIEWPORT } from '../layout/viewport';

export interface TutorialLevelData {
  tutorialMode: boolean;
  dialogue: string[];
  pointer: { col: number; row: number };
}

export class TutorialOverlay {
  readonly container: Container;

  private _finger: Text | null = null;
  private _dialogueBg: Graphics | null = null;
  private _dialogueText: Text | null = null;
  private _dialogueSteps: string[] = [];
  private _stepIndex = 0;
  private _tutorialMode = false;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  get isTutorialMode(): boolean {
    return this._tutorialMode;
  }

  init(levelData: TutorialLevelData, _cols: number, _rows: number): void {
    this._tutorialMode = levelData.tutorialMode;
    if (!levelData.tutorialMode) return;

    this._dialogueSteps = levelData.dialogue;
    this._stepIndex = 0;

    // Ghost-finger pointer
    const fx = VIEWPORT.GRID_ORIGIN_X + levelData.pointer.col * (VIEWPORT.CELL_W + VIEWPORT.GAP) + VIEWPORT.CELL_W / 2 - 12;
    const fy = VIEWPORT.GRID_ORIGIN_Y + levelData.pointer.row * (VIEWPORT.CELL_H + VIEWPORT.GAP) - 24;

    const finger = new Text({ text: '👆', style: { fontSize: 32 } });
    (finger as unknown as { x: number }).x = fx;
    (finger as unknown as { y: number }).y = fy;
    this._finger = finger;
    this.container.addChild(finger as unknown as Parameters<typeof this.container.addChild>[0]);

    // GSAP yoyo bounce
    gsap.to(finger, {
      y: fy - 12,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
    });

    // Dialogue bubble
    const bg = new Graphics();
    (bg as unknown as { rect: (x: number, y: number, w: number, h: number) => Graphics }).rect(8, 8, 374, 40);
    (bg as unknown as { fill: (opts: unknown) => void }).fill({ color: 0xFFFFEE });
    this._dialogueBg = bg;
    this.container.addChild(bg as unknown as Parameters<typeof this.container.addChild>[0]);

    const dText = new Text({ text: levelData.dialogue[0] ?? '', style: { fontSize: 14, fill: 0x333333 } });
    (dText as unknown as { x: number }).x = 16;
    (dText as unknown as { y: number }).y = 16;
    this._dialogueText = dText;
    this.container.addChild(dText as unknown as Parameters<typeof this.container.addChild>[0]);
  }

  /** Call when the player performs the tutorial-indicated tap. */
  onCorrectTap(): void {
    // Hide ghost finger on first correct tap
    if (this._finger) {
      gsap.killTweensOf(this._finger);
      (this._finger as unknown as { visible: boolean }).visible = false;
    }

    // Advance dialogue
    this._stepIndex++;
    if (this._dialogueText && this._dialogueSteps[this._stepIndex]) {
      (this._dialogueText as unknown as { text: string }).text = this._dialogueSteps[this._stepIndex];
    }
  }

  /** Mark tutorial complete in localStorage. */
  complete(): void {
    try {
      localStorage.setItem('scooby-snacks-pop:tutorial-complete', 'true');
    } catch {
      // localStorage unavailable (server-side or private mode) — silent fail
    }
  }

  destroy(): void {
    if (this._finger) gsap.killTweensOf(this._finger);
    this._finger = null;
    this._dialogueBg = null;
    this._dialogueText = null;
    this.container.destroy({ children: true });
  }
}
