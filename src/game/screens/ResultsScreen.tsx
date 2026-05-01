import { Show } from 'solid-js';
import { useScreen } from '~/core/systems/screens';
import { Button } from '~/core/ui/Button';
import { gameState } from '~/game/state';
import { RESULTS_BUTTONS } from '~/game/scooby-snacks-pop/screens/resultsConfig';
import { CHAPTERS } from '~/game/scooby-snacks-pop/screens/chapterConfig';

/**
 * ResultsScreen — shown after win or loss.
 *
 * Win branch: star rating reveal + Next Level button.
 * Loss branch: "Out of moves!" + Try Again + (disabled) Get 5 More Moves.
 * Both primary buttons ≥ 44px touch target in bottom-center thumb zone.
 */
export function ResultsScreen() {
  const { goto } = useScreen();
  const isWin = () => gameState.lastGameWon();
  const completedChapter = () => gameState.lastCompletedChapter();
  const chapterDef = () => CHAPTERS.find((c) => c.number === completedChapter()) ?? null;

  const handleNextLevel = () => {
    goto('game');
  };

  const handleTryAgain = () => {
    // Reset score only — preserve level so retry replays the same level
    gameState.setScore(0);
    gameState.setLastGameWon(false);
    goto('game');
  };

  const handleMainMenu = () => {
    goto('start');
  };

  const winButton = RESULTS_BUTTONS.find((b) => b.id === 'next-level')!;
  const lossButton = RESULTS_BUTTONS.find((b) => b.id === 'try-again')!;
  const getMoreButton = RESULTS_BUTTONS.find((b) => b.id === 'get-more-moves')!;

  return (
    <div class="fixed inset-0 flex flex-col items-center bg-gradient-to-b from-slate-900 to-black px-6 pb-8">
      <Show when={isWin()} fallback={
        // Loss branch
        <div class="flex flex-col items-center justify-end h-full gap-4 pb-safe">
          <h1 class="text-3xl font-bold text-white mb-2">Out of moves!</h1>
          <div class="text-center mb-4">
            <p class="text-white/60 text-sm mb-1">Score</p>
            <p class="text-5xl font-bold text-white">{gameState.score()}</p>
          </div>
          <div class="w-full flex flex-col gap-3" style={{ "margin-top": "auto" }}>
            <Button
              onClick={handleTryAgain}
              style={{ "min-height": `${lossButton.minHeightPx}px` }}
            >
              {lossButton.label}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {}}
              disabled={getMoreButton.disabled}
              style={{ "min-height": `${getMoreButton.minHeightPx}px` }}
            >
              {getMoreButton.label}
            </Button>
          </div>
        </div>
      }>
        {/* Win branch — standard level complete OR chapter complete */}
        <Show when={chapterDef()} fallback={
          <div class="flex flex-col items-center justify-end h-full gap-4 pb-safe">
            <h1 class="text-3xl font-bold text-yellow-400 mb-2">Level Complete!</h1>
            <div class="text-center mb-4">
              <p class="text-white/60 text-sm mb-1">Score</p>
              <p class="text-5xl font-bold text-white">{gameState.score()}</p>
            </div>
            <div class="w-full flex flex-col gap-3" style={{ "margin-top": "auto" }}>
              <Button
                onClick={handleNextLevel}
                style={{ "min-height": `${winButton.minHeightPx}px` }}
              >
                {winButton.label}
              </Button>
              <Button variant="secondary" onClick={handleMainMenu}>
                Main Menu
              </Button>
            </div>
          </div>
        }>
          {/* Chapter complete variant */}
          <div class="flex flex-col items-center justify-center h-full gap-6 px-6">
            <div class="text-8xl">{chapterDef()!.emoji}</div>
            <h1 class="text-3xl font-bold text-yellow-400 text-center">
              Chapter {completedChapter()} Complete!
            </h1>
            <h2 class="text-xl text-white/80 text-center">{chapterDef()!.name}</h2>
            <p class="text-white/60 text-sm text-center">{chapterDef()!.interstitialText}</p>
            <div class="text-center">
              <p class="text-white/60 text-sm mb-1">Score</p>
              <p class="text-4xl font-bold text-white">{gameState.score()}</p>
            </div>
            <div class="w-full flex flex-col gap-3 mt-auto">
              <Button
                onClick={handleNextLevel}
                style={{ "min-height": "56px" }}
              >
                Next Chapter →
              </Button>
              <Button variant="secondary" onClick={handleMainMenu}>
                Main Menu
              </Button>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
