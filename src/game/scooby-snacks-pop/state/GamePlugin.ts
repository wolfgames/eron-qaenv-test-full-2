/**
 * GamePlugin — ECS plugin for Scooby Snacks Pop!
 *
 * Central state/logic hub. Property order is strictly enforced by @adobe/data at runtime:
 * resources → archetypes → transactions → actions
 *
 * Board state is NOT stored in ECS components — the grid is a plain array resource for
 * simplicity in core pass. Entity archetypes cover individual board cells where needed.
 */
import { Database } from '@adobe/data/ecs';
import type { BoardCell, GamePhase, ObjectiveEntry } from '../entities/TreatBubble';
import { floodFill, resolveGroup, adjacentDamage, comboSpawnKind } from './boardLogic';
import { computeScore, computeStars } from './scoringLogic';

export const gamePlugin = Database.Plugin.create({
  components: {
    cellCol: { type: 'number', default: 0 } as const,
    cellRow: { type: 'number', default: 0 } as const,
    cellKind: { type: 'string', default: 'EMPTY' } as const,
  },

  resources: {
    score: { default: 0 as number },
    movesRemaining: { default: 20 as number },
    movesAllotted: { default: 20 as number },
    phase: { default: 'IDLE' as GamePhase },
    levelNumber: { default: 1 as number },
    chapterNumber: { default: 1 as number },
    starCount: { default: 0 as number },
    // boardState: flat row-major array of BoardCell, cols×rows
    boardState: { default: [] as BoardCell[] },
    boardCols: { default: 7 as number },
    boardRows: { default: 9 as number },
    objectives: { default: [] as ObjectiveEntry[] },
  },

  archetypes: {
    // BubbleCell archetype for per-cell ECS entities (secondary pass expansion)
    BubbleCell: ['cellCol', 'cellRow', 'cellKind'] as const,
  },

  transactions: {
    replaceBoard(store, { board }: { board: BoardCell[] }) {
      store.resources.boardState = board;
    },

    decrementMoves(store) {
      store.resources.movesRemaining = Math.max(0, store.resources.movesRemaining - 1);
    },

    setMovesRemaining(store, moves: number) {
      store.resources.movesRemaining = moves;
    },

    setMovesAllotted(store, moves: number) {
      store.resources.movesAllotted = moves;
    },

    addScore(store, amount: number) {
      store.resources.score = store.resources.score + amount;
    },

    setPhase(store, phase: GamePhase) {
      store.resources.phase = phase;
    },

    setObjectives(store, objectives: ObjectiveEntry[]) {
      store.resources.objectives = objectives;
    },

    updateObjective(store, { treatKind, delta }: { treatKind: string; delta: number }) {
      store.resources.objectives = store.resources.objectives.map((obj) =>
        obj.treatKind === treatKind
          ? { ...obj, clearedCount: obj.clearedCount + delta }
          : obj,
      );
    },

    setLevel(store, { levelNumber, chapterNumber }: { levelNumber: number; chapterNumber: number }) {
      store.resources.levelNumber = levelNumber;
      store.resources.chapterNumber = chapterNumber;
    },

    advanceChapterResource(store) {
      store.resources.chapterNumber = store.resources.chapterNumber + 1;
    },
  },

  actions: {
    /**
     * Primary tap resolution. Returns animation metadata for the controller.
     * Pure — no Pixi calls, no Math.random (board logic handles RNG separately).
     */
    executeTap(db, { col, row, cascadeDepth = 0 }: { col: number; row: number; cascadeDepth?: number }) {
      if (db.store.resources.phase !== 'IDLE') return null;

      const { boardState, boardCols, boardRows, movesAllotted } = db.store.resources;
      if (boardState.length === 0) {
        return { group: [], movements: [], refills: [], score: 0, comboSpawn: null };
      }

      const { group, invalid } = floodFill(boardState, col, row, boardCols, boardRows);

      if (invalid || group.length < 2) {
        // Invalid tap — no move consumed, return group for shake feedback
        return { group, movements: [], refills: [], score: 0, comboSpawn: null, invalid: true };
      }

      // Valid pop: resolve board, decrement moves, add score
      const score = computeScore(group.length, cascadeDepth);
      const newBoard = resolveGroup(boardState, group);
      const damageResult = adjacentDamage(newBoard, group, boardCols, boardRows);
      const combo = comboSpawnKind(group.length);

      db.transactions.replaceBoard({ board: damageResult.newBoard });
      db.transactions.decrementMoves();
      db.transactions.addScore(score);
      // Update objectives for cleared treat kinds
      for (const idx of group) {
        const kind = boardState[idx].kind;
        db.transactions.updateObjective({ treatKind: kind as string, delta: 1 });
      }

      return {
        group,
        movements: [],
        refills: [],
        score,
        comboSpawn: combo,
        damagedBlockers: damageResult.damagedBlockers,
        destroyedBlockers: damageResult.destroyedBlockers,
        invalid: false,
      };
    },

    /**
     * Increments chapterNumber in ECS. Called after level 15, 30, 45, etc.
     */
    advanceChapter(db) {
      db.transactions.advanceChapterResource();
      return { chapterNumber: db.store.resources.chapterNumber };
    },

    /**
     * Returns true if the current level is the start of a new chapter
     * (levels 16, 28, 40... i.e., every 12 campaign levels from level 4).
     */
    isChapterBoundary(db): boolean {
      const { levelNumber } = db.store.resources;
      // Chapter 1: levels 4-15 (12 campaign levels). Chapter 2 starts at level 16.
      if (levelNumber < 4) return false;
      const chapterOffset = levelNumber - 4; // 0 at level 4
      // Boundary at the start of each new chapter (every 12 levels after level 4)
      return chapterOffset > 0 && chapterOffset % 12 === 0;
    },

    /**
     * Evaluates win/loss after a tap resolves.
     * Returns { phase, stars, finalScore } or null if still playing.
     */
    checkWinLoss(db) {
      const { movesRemaining, movesAllotted, objectives, score } = db.store.resources;
      const allObjectivesMet = objectives.every((o) => o.clearedCount >= o.targetCount);

      if (allObjectivesMet) {
        const stars = computeStars(movesRemaining, movesAllotted);
        db.transactions.setPhase('WON');
        db.transactions.addScore(0); // trigger bridge
        return { phase: 'WON' as GamePhase, stars, finalScore: score };
      }

      if (movesRemaining <= 0) {
        db.transactions.setPhase('LOST');
        return { phase: 'LOST' as GamePhase, stars: 0, finalScore: score };
      }

      return null;
    },
  },
});

export type GameDatabase = Database.FromPlugin<typeof gamePlugin>;
