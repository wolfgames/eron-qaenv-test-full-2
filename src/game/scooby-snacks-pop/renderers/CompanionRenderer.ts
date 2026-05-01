/**
 * CompanionRenderer — Scooby companion dialogue strip.
 *
 * GPU Pixi strip at y = viewport_h - LOGO_H - COMPANION_H.
 * Scooby portrait: emoji "🐕" at x=8.
 * Dialogue bubble: Graphics rounded rect + Text.
 * showDialogue(event): GSAP fade-in, GSAP.delayedCall(3, hide).
 *
 * Dialogue variants map (real copy per guardrail #15):
 *   firstTap  — neutral encouragement
 *   win       — happy celebration
 *   loss      — droopy commiseration
 *   combo     — excited reaction
 *   tutorial  — guided instruction
 */
import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { VIEWPORT } from '../layout/viewport';

export type DialogueEvent = 'firstTap' | 'win' | 'loss' | 'combo' | 'tutorial';

const DIALOGUE_MAP: Record<DialogueEvent, string> = {
  firstTap: 'Ruh roh! Here we go! 🐕',
  win:      'Scooby Dooby Doo! 🎉',
  loss:     'Aww, no snacks... 😢',
  combo:    'Zoinks! Big pop! 💥',
  tutorial: 'Watch Scooby do it! 👆',
};

export class CompanionRenderer {
  readonly container: Container;

  private _stripY = 0;
  private _dialogueBg: Graphics | null = null;
  private _dialogueText: Text | null = null;
  private _autoDismissCancel: ReturnType<typeof gsap.delayedCall> | null = null;

  constructor() {
    this.container = new Container();
    this.container.eventMode = 'none';
  }

  get stripY(): number {
    return this._stripY;
  }

  init(viewportW: number, viewportH: number): void {
    this._stripY = viewportH - VIEWPORT.LOGO_H - VIEWPORT.COMPANION_H;
    (this.container as unknown as { y: number }).y = this._stripY;

    // Scooby portrait emoji
    const portrait = new Text({ text: '🐕', style: { fontSize: 48 } });
    (portrait as unknown as { x: number }).x = 8;
    (portrait as unknown as { y: number }).y = 4;
    this.container.addChild(portrait as unknown as Parameters<typeof this.container.addChild>[0]);

    // Dialogue bubble background
    const bg = new Graphics();
    const bgX = 72;
    const bgW = viewportW - bgX - 8;
    (bg as unknown as { rect: (x: number, y: number, w: number, h: number) => Graphics }).rect(bgX, 8, bgW, 48);
    (bg as unknown as { fill: (opts: unknown) => void }).fill({ color: 0xFFFFDD });
    (bg as unknown as { alpha: number }).alpha = 0;
    this._dialogueBg = bg;
    this.container.addChild(bg as unknown as Parameters<typeof this.container.addChild>[0]);

    // Dialogue text
    const dText = new Text({ text: '', style: { fontSize: 13, fill: 0x333333 } });
    (dText as unknown as { x: number }).x = 80;
    (dText as unknown as { y: number }).y = 20;
    (dText as unknown as { alpha: number }).alpha = 0;
    this._dialogueText = dText;
    this.container.addChild(dText as unknown as Parameters<typeof this.container.addChild>[0]);
  }

  /** Returns the dialogue string for a given event (used by tests). */
  getDialogueText(event: DialogueEvent): string {
    return DIALOGUE_MAP[event];
  }

  /** Show dialogue for the given event. Auto-dismisses after 3s. */
  showDialogue(event: DialogueEvent): void {
    if (!this._dialogueText || !this._dialogueBg) return;

    // Cancel any pending auto-dismiss
    this._autoDismissCancel?.kill();

    const text = DIALOGUE_MAP[event];
    (this._dialogueText as unknown as { text: string }).text = text;

    // Fade in
    gsap.to(this._dialogueBg, { alpha: 1, duration: 0.2 });
    gsap.to(this._dialogueText, { alpha: 1, duration: 0.2 });

    // Auto-dismiss after 3s
    this._autoDismissCancel = gsap.delayedCall(3, () => {
      if (this._dialogueBg) gsap.to(this._dialogueBg, { alpha: 0, duration: 0.3 });
      if (this._dialogueText) gsap.to(this._dialogueText, { alpha: 0, duration: 0.3 });
    });
  }

  destroy(): void {
    this._autoDismissCancel?.kill();
    if (this._dialogueBg) gsap.killTweensOf(this._dialogueBg);
    if (this._dialogueText) gsap.killTweensOf(this._dialogueText);
    this.container.destroy({ children: true });
    this._dialogueBg = null;
    this._dialogueText = null;
  }
}
