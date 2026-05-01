/**
 * useCompanionDialogue — hook that fires dialogue events based on game phase.
 *
 * Subscribes to ECS phase changes and game events (win, loss, first tap).
 * Returns a showDialogue callback that GameController calls.
 *
 * No DOM, no Pixi — pure subscription logic.
 */
import type { GameDatabase } from './state/GamePlugin';
import type { DialogueEvent } from './renderers/CompanionRenderer';

export interface CompanionDialogueHook {
  showDialogue(event: DialogueEvent): void;
  cleanup(): void;
}

export const useCompanionDialogue = (
  db: GameDatabase,
  onDialogue: (event: DialogueEvent) => void,
): CompanionDialogueHook => {
  let firstTapFired = false;

  // Subscribe to phase changes
  const unobservePhase = db.observe.resources.phase((phase) => {
    if (phase === 'WON') {
      onDialogue('win');
    } else if (phase === 'LOST') {
      onDialogue('loss');
    }
  });

  return {
    showDialogue(event: DialogueEvent) {
      if (event === 'firstTap' && !firstTapFired) {
        firstTapFired = true;
        onDialogue(event);
      } else if (event !== 'firstTap') {
        onDialogue(event);
      }
    },
    cleanup() {
      unobservePhase();
    },
  };
};
