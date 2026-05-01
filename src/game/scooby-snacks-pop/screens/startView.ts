/**
 * StartScreenController — branded start screen for Scooby Snacks Pop!
 *
 * Manages:
 * - First-time cutscene gating (localStorage 'scooby-snacks-pop:cutscene-seen')
 * - 3-panel comic book intro with skip button
 * - Navigation to tutorial level 1 (first-time) or current level (returning)
 *
 * DOM screen (start phase): document.createElement is OK here.
 */
import type { StartScreenDeps, StartScreenController, SetupStartScreen } from '~/game/mygame-contract';

const CUTSCENE_SEEN_KEY = 'scooby-snacks-pop:cutscene-seen';

export interface CutscenePanel {
  text: string;
  emoji: string;
  showSkip: boolean;
}

/** Real cutscene copy per plan spec (guardrail #15 — no placeholder text). */
const CUTSCENE_PANELS: CutscenePanel[] = [
  { text: "Mystery Inc. gets a call! 🐕💼", emoji: '🏚️', showSkip: true },
  { text: "Scooby Snacks are missing! 🦴",  emoji: '😱', showSkip: true },
  { text: "Help Scooby find them all! 👆",   emoji: '🐕', showSkip: true },
];

export interface ScoobyStartScreenController extends StartScreenController {
  /** Returns true if the player has already seen the cutscene. */
  isCutsceneSeen(): boolean;
  /** Returns the 3 cutscene panel definitions. */
  getCutscenePanels(): CutscenePanel[];
  /** Writes the cutscene-seen flag to localStorage. */
  markCutsceneSeen(): void;
}

export const setupStartScreen: SetupStartScreen = (deps: StartScreenDeps): ScoobyStartScreenController => {
  let wrapper: HTMLDivElement | null = null;
  let cutscenePanel = 0;
  let cutsceneContainer: HTMLDivElement | null = null;

  const isCutsceneSeen = (): boolean => {
    try {
      return localStorage.getItem(CUTSCENE_SEEN_KEY) === 'true';
    } catch {
      return false;
    }
  };

  const markCutsceneSeen = (): void => {
    try {
      localStorage.setItem(CUTSCENE_SEEN_KEY, 'true');
    } catch {
      // localStorage unavailable — silent fail
    }
  };

  const goToGame = async (playBtn?: HTMLButtonElement): Promise<void> => {
    if (playBtn) {
      playBtn.disabled = true;
      playBtn.textContent = 'Loading...';
    }
    await deps.initGpu();
    deps.unlockAudio();
    await deps.loadCore();
    try { await deps.loadAudio(); } catch { /* audio optional in core pass */ }
    deps.analytics.trackGameStart({ start_source: 'play_button', is_returning_player: isCutsceneSeen() });
    deps.goto('game');
  };

  const showCutscene = (container: HTMLDivElement, playBtn: HTMLButtonElement): void => {
    cutscenePanel = 0;
    cutsceneContainer = document.createElement('div');
    cutsceneContainer.style.cssText =
      'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'background:#1a0a2e;color:#fff;font-family:system-ui,sans-serif;gap:24px;padding:24px;z-index:100;';

    const renderPanel = () => {
      if (!cutsceneContainer) return;
      cutsceneContainer.innerHTML = '';
      const panel = CUTSCENE_PANELS[cutscenePanel];

      const emojiEl = document.createElement('div');
      emojiEl.textContent = panel.emoji;
      emojiEl.style.cssText = 'font-size:5rem;';

      const textEl = document.createElement('p');
      textEl.textContent = panel.text;
      textEl.style.cssText = 'font-size:1.25rem;font-weight:600;text-align:center;max-width:300px;';

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:12px;margin-top:24px;';

      if (panel.showSkip) {
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip';
        skipBtn.style.cssText =
          'padding:12px 24px;border:1px solid rgba(255,255,255,0.4);border-radius:12px;' +
          'background:transparent;color:#fff;cursor:pointer;min-height:48px;';
        skipBtn.addEventListener('click', () => {
          markCutsceneSeen();
          cutsceneContainer?.remove();
          cutsceneContainer = null;
          void goToGame();
        }, { once: true });
        btnRow.append(skipBtn);
      }

      const nextBtn = document.createElement('button');
      const isLast = cutscenePanel === CUTSCENE_PANELS.length - 1;
      nextBtn.textContent = isLast ? "Let's go! 🐕" : 'Next →';
      nextBtn.style.cssText =
        'padding:12px 32px;border:none;border-radius:12px;background:#f5c842;' +
        'color:#1a0a2e;font-weight:700;cursor:pointer;min-height:48px;';
      nextBtn.addEventListener('click', () => {
        if (isLast) {
          markCutsceneSeen();
          cutsceneContainer?.remove();
          cutsceneContainer = null;
          void goToGame();
        } else {
          cutscenePanel++;
          renderPanel();
        }
      }, { once: true });
      btnRow.append(nextBtn);

      cutsceneContainer.append(emojiEl, textEl, btnRow);
    };

    renderPanel();
    container.append(cutsceneContainer);
    // Disable the play button while cutscene is active
    playBtn.disabled = true;
  };

  return {
    backgroundColor: '#1a0a2e',

    isCutsceneSeen,
    getCutscenePanels: () => CUTSCENE_PANELS,
    markCutsceneSeen,

    init(container: HTMLDivElement) {
      wrapper = document.createElement('div');
      wrapper.style.cssText =
        'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:24px;' +
        'background:#1a0a2e;color:#fff;font-family:system-ui,sans-serif;';

      const title = document.createElement('h1');
      title.textContent = 'Scooby Snacks Pop!';
      title.style.cssText = 'font-size:2rem;font-weight:700;margin:0;color:#f5c842;text-align:center;';

      const subtitle = document.createElement('p');
      subtitle.textContent = '🐕 Help Scooby find the snacks! 🦴';
      subtitle.style.cssText = 'font-size:1rem;margin:0;opacity:0.8;text-align:center;';

      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play 🎮';
      playBtn.style.cssText =
        'font-size:1.25rem;font-weight:600;padding:16px 56px;border:none;border-radius:16px;' +
        'background:#f5c842;color:#1a0a2e;cursor:pointer;min-height:56px;min-width:160px;' +
        'box-shadow:0 4px 16px rgba(245,200,66,0.3);';

      playBtn.addEventListener('click', () => {
        if (isCutsceneSeen()) {
          // Returning player — skip cutscene
          void goToGame(playBtn);
        } else {
          // First-time player — show cutscene
          showCutscene(container, playBtn);
        }
      }, { once: true });

      wrapper.append(title, subtitle, playBtn);
      container.append(wrapper);
    },

    destroy() {
      cutsceneContainer?.remove();
      cutsceneContainer = null;
      wrapper?.remove();
      wrapper = null;
    },
  };
};
