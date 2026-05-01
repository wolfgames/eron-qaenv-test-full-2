/**
 * GameController — Pixi-based game controller for Scooby Snacks Pop!
 *
 * Lifecycle order (enforced):
 * 1. ECS DB created → setActiveDb → bridgeEcsToSignals
 * 2. Pixi Application initialized → layers created
 * 3. Renderers instantiated
 * 4. Input wired on boardLayer
 *
 * Destroy order (enforced):
 * GSAP tweens → Pixi app → ECS bridge → setActiveDb(null)
 */
import { createSignal } from 'solid-js';
import { Application, Container } from 'pixi.js';
import gsap from 'gsap';
import { Database } from '@adobe/data/ecs';
import { setActiveDb } from '~/core/systems/ecs';
import type { GameControllerDeps, GameController, SetupGame } from '~/game/mygame-contract';
import { gamePlugin, type GameDatabase } from '../state/GamePlugin';
import { bridgeEcsToSignals } from '../state/bridgeEcsToSignals';
import { gameState } from '~/game/state';
import { BoardRenderer } from '../renderers/BoardRenderer';
import { HudRenderer } from '../renderers/HudRenderer';
import { ComboRenderer } from '../renderers/ComboRenderer';
import { BlockerRenderer } from '../renderers/BlockerRenderer';
import { TutorialOverlay } from '../renderers/TutorialOverlay';
import { CompanionRenderer } from '../renderers/CompanionRenderer';
import { BackgroundRenderer } from '../renderers/BackgroundRenderer';
import { applyGravity } from '../state/boardPhysics';
import { LevelGenerator } from '../levelgen/LevelGenerator';
import { useCompanionDialogue } from '../useCompanionDialogue';
import type { CompanionDialogueHook } from '../useCompanionDialogue';

export const setupGame: SetupGame = (deps: GameControllerDeps): GameController => {
  const [ariaText, setAriaText] = createSignal('Scooby Snacks Pop — Loading');

  let app: Application | null = null;
  let ecsDb: GameDatabase | null = null;
  let cleanupBridge: (() => void) | null = null;
  let boardRenderer: BoardRenderer | null = null;
  let hudRenderer: HudRenderer | null = null;
  let comboRenderer: ComboRenderer | null = null;
  let tutorialOverlay: TutorialOverlay | null = null;
  let companionRenderer: CompanionRenderer | null = null;
  let backgroundRenderer: BackgroundRenderer | null = null;
  let companionDialogue: CompanionDialogueHook | null = null;
  const blockerRenderers: Map<number, BlockerRenderer> = new Map();

  // Layer containers (created during init)
  let bgLayer: Container | null = null;
  let boardLayer: Container | null = null;
  let hudLayer: Container | null = null;
  let uiLayer: Container | null = null;

  const init = (container: HTMLDivElement): void => {
    // 1. ECS setup
    ecsDb = Database.create(gamePlugin);
    // Restore level progress from signal (persists across GameController recreations)
    const persistedLevel = gameState.level();
    if (persistedLevel > 1) {
      ecsDb.transactions.setLevel({
        levelNumber: persistedLevel,
        chapterNumber: Math.max(1, Math.floor((persistedLevel - 4) / 12) + 1),
      });
    }
    setActiveDb(ecsDb);
    // Bridge wired here — hudRenderer setters are closures that read the current value
    cleanupBridge = bridgeEcsToSignals(ecsDb, {
      setScore: (s) => {
        gameState.setScore(s);
        hudRenderer?.updateScore(s);
      },
      setMovesRemaining: (m) => {
        hudRenderer?.updateMoves(m, ecsDb?.store.resources.movesAllotted ?? 20);
      },
    });

    // 2. Pixi Application init
    app = new Application();
    void app.init({
      resizeTo: container,
      background: 0x1a0a2e,
      resolution: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
    }).then(() => {
      if (!app) return;
      container.appendChild(app.canvas);

      // 3. Layers
      app.stage.eventMode = 'static';

      bgLayer = new Container();
      bgLayer.eventMode = 'none';  // no interactive children

      boardLayer = new Container();
      boardLayer.eventMode = 'passive'; // propagates to interactive children

      hudLayer = new Container();
      hudLayer.eventMode = 'none';  // HUD not interactive

      uiLayer = new Container();
      uiLayer.eventMode = 'passive'; // tutorial overlay etc.

      app.stage.addChild(bgLayer);
      app.stage.addChild(boardLayer);
      app.stage.addChild(hudLayer);
      app.stage.addChild(uiLayer);

      // Batch 6: load level data (tutorial levels 1-3 or generated levels 4+)
      const currentLevel = ecsDb?.store.resources.levelNumber ?? 1;
      const isTutorial = currentLevel <= 3;
      const levelData = isTutorial
        ? null // tutorial levels loaded separately via TutorialOverlay
        : LevelGenerator.generate(currentLevel);

      // Batch 2: BoardRenderer — 7×9 grid (or level-specific board)
      const initialBoard = levelData
        ? levelData.board
        : Array.from({ length: 7 * 9 }, (_, i) => ({ id: i, kind: 'EMPTY' as const }));
      boardRenderer = new BoardRenderer();
      boardRenderer.init(initialBoard, app.screen.width, app.screen.height);
      boardLayer.addChild(boardRenderer.container);

      // Wire level data to ECS
      if (levelData) {
        ecsDb?.transactions.replaceBoard({ board: levelData.board });
        ecsDb?.transactions.setMovesAllotted(levelData.movesAllotted);
        ecsDb?.transactions.setMovesRemaining(levelData.movesAllotted);
        ecsDb?.transactions.setObjectives(levelData.objectives);
      }

      // Batch 3: HUD renderer
      hudRenderer = new HudRenderer();
      hudRenderer.init(app.screen.width, app.screen.height);
      hudLayer.addChild(hudRenderer.container);

      // Batch 5: Combo + Blocker renderers
      comboRenderer = new ComboRenderer();
      boardLayer.addChild(comboRenderer.container);

      // Batch 9: Background + Companion
      const chapter = ecsDb?.store.resources.chapterNumber ?? 1;
      backgroundRenderer = new BackgroundRenderer();
      backgroundRenderer.init(app.screen.width, app.screen.height, chapter);
      bgLayer.addChild(backgroundRenderer.container);

      companionRenderer = new CompanionRenderer();
      companionRenderer.init(app.screen.width, app.screen.height);
      hudLayer.addChild(companionRenderer.container);

      // Wire useCompanionDialogue hook: subscribes to ECS phase → companion strip
      if (ecsDb) {
        const renderer = companionRenderer;
        companionDialogue = useCompanionDialogue(ecsDb, (event) => {
          renderer.showDialogue(event);
        });
      }

      // Batch 6: Tutorial overlay (uiLayer — top z-order)
      if (isTutorial) {
        // Suppress HUD move counter and objectives in tutorial mode
        hudRenderer?.setTutorialMode(true);

        // Load tutorial level data
        import('../data/tutorial-levels.json').then((mod) => {
          const tutData = (mod.default as { levels: Array<{ id: number; tutorialMode: boolean; dialogue: string[]; pointer: { col: number; row: number } }> }).levels;
          const tLevel = tutData.find((l) => l.id === currentLevel);
          if (tLevel && uiLayer) {
            tutorialOverlay = new TutorialOverlay();
            tutorialOverlay.init(tLevel, 7, 9);
            uiLayer.addChild(tutorialOverlay.container);
          }
        }).catch(() => { /* tutorial JSON load failure — play without overlay */ });
      }

      // Wire tap handler → ECS action → gravity → win/loss → render pipeline
      boardRenderer.setTapHandler(async (col, row) => {
        if (!ecsDb) return;
        const result = ecsDb.actions.executeTap({ col, row });
        if (result === null || result.invalid) {
          boardRenderer?.shakeCell(col, row);
          return;
        }

        // First-tap dialogue — fires once per session
        companionDialogue?.showDialogue('firstTap');

        // Tutorial overlay: advance step on correct tap
        if (tutorialOverlay?.isTutorialMode) {
          tutorialOverlay.onCorrectTap();
        }

        // Batch 4: gravity cascade animation
        ecsDb.transactions.setPhase('ANIMATING');
        const { boardState, boardCols, boardRows } = ecsDb.store.resources;
        const gravityResult = applyGravity(boardState, boardCols, boardRows);
        ecsDb.transactions.replaceBoard({ board: gravityResult.newBoard });
        await boardRenderer?.syncDrops(gravityResult.drops, 0);
        boardRenderer?.syncBoard(gravityResult.newBoard);
        ecsDb.transactions.setPhase('IDLE');

        // Batch 7: win/loss evaluation after each tap resolves
        const winLoss = ecsDb.actions.checkWinLoss();
        if (winLoss !== null) {
          if (winLoss.phase === 'WON') {
            // Persist tutorial completion before navigating away
            if (tutorialOverlay?.isTutorialMode) {
              tutorialOverlay.complete();
            }
            // Store win outcome in gameState for ResultsScreen
            gameState.setScore(winLoss.finalScore);
            gameState.setLastGameWon(true);
            const nextLevel = ecsDb.store.resources.levelNumber + 1;
            gameState.setLevel(nextLevel);
            // Check if this win also completes a chapter (level 15, 28, 40…)
            const completedLevel = ecsDb.store.resources.levelNumber;
            const isChapterEnd = completedLevel >= 4 && (completedLevel - 3) % 12 === 0;
            gameState.setLastCompletedChapter(
              isChapterEnd ? ecsDb.store.resources.chapterNumber : 0,
            );
            // Brief delay for win animation before navigating
            gsap.delayedCall(0.5, () => {
              deps.goto?.('results');
            });
          } else if (winLoss.phase === 'LOST') {
            // Board dim tween then navigate to results
            gsap.to(boardLayer, { alpha: 0.4, duration: 0.3, onComplete: () => {
              gameState.setScore(winLoss.finalScore);
              gameState.setLastGameWon(false);
              gsap.delayedCall(0.35, () => {
                deps.goto?.('results');
              });
            }});
          }
        }
      });

      setAriaText('Scooby Snacks Pop!');
      ecsDb!.transactions.setPhase('IDLE');
    });
  };

  const destroy = (): void => {
    // 1. Kill all GSAP tweens
    if (bgLayer) gsap.killTweensOf(bgLayer);
    if (boardLayer) gsap.killTweensOf(boardLayer);
    if (hudLayer) gsap.killTweensOf(hudLayer);
    if (uiLayer) gsap.killTweensOf(uiLayer);
    if (app?.stage) gsap.killTweensOf(app.stage);

    // 2. Destroy renderers (they kill their own tweens)
    boardRenderer?.destroy();
    boardRenderer = null;
    hudRenderer?.destroy();
    hudRenderer = null;
    comboRenderer?.destroy();
    comboRenderer = null;
    tutorialOverlay?.destroy();
    tutorialOverlay = null;
    companionRenderer?.destroy();
    companionRenderer = null;
    companionDialogue?.cleanup();
    companionDialogue = null;
    backgroundRenderer?.destroy();
    backgroundRenderer = null;
    for (const br of blockerRenderers.values()) br.destroy();
    blockerRenderers.clear();

    // 3. Destroy Pixi layers
    bgLayer?.destroy({ children: true });
    boardLayer?.destroy({ children: true });
    hudLayer?.destroy({ children: true });
    uiLayer?.destroy({ children: true });
    bgLayer = null;
    boardLayer = null;
    hudLayer = null;
    uiLayer = null;

    // 3. Destroy Pixi app
    app?.destroy(true, { children: true });
    app = null;

    // 4. Tear down ECS bridge
    cleanupBridge?.();
    cleanupBridge = null;

    // 5. Release DB reference
    setActiveDb(null);
    ecsDb = null;
  };

  return {
    gameMode: 'pixi',
    init,
    destroy,
    ariaText,
  };
};
