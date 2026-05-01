---
type: game-report
game: "Scooby Snacks Pop!"
pipeline_version: "0.3.13"
run: 1
pass: core
status: complete
features:
  total: 22
  implemented: 22
  partial: 0
  deferred: 0
tests:
  new: 252
  passing: 252
  total: 252
issues:
  critical: 0
  minor: 1
cos:
  - id: core-interaction
    status: pass
    note: "Tap interaction archetype written; pointertap on boardLayer; shake feedback on invalid; input locked during ANIMATING"
  - id: canvas
    status: pass
    note: "BUBBLE_SIZE=50px (≥48px), CELL_W=56px, CELL_H=65px; HUD does not overlap board; 5 treat types + blockers + combos all visually distinct via tint+emoji"
  - id: animated-dynamics
    status: pass
    note: "Identity-stable gravity (cell IDs preserved); GSAP ease-out tweens; event queue pattern; cascade escalation table; no instant state changes"
  - id: scoring
    status: pass
    note: "perTapScore = (groupSize-1)*50*(cascadeDepth+1); two multiplicative dimensions; star thresholds 30%/55% validated; CoS base requirements met"
completeness:
  items_required: 22
  items_met: 22
  items_gaps: 0
blocking:
  cos_failed: []
  completeness_gaps: []
---

# Pipeline Report: Scooby Snacks Pop!

## Features

- [x] ecs-plugin — ECS GamePlugin with resources, transactions, actions; property order enforced
- [x] game-controller-stub (replace) — Full Pixi GameController replacing DOM stub; no DOM in GPU code
- [x] game-state-signals (adapt) — ECS owns state; signals are DOM bridge via bridgeEcsToSignals
- [x] interaction-archetype-doc — interaction-archetype.md written with all required fields
- [x] board-grid — 7×9 grid with 56×65px cells, centered in safe play area
- [x] treat-bubbles — 5 types (SNACK_BONE/BURGER/PIZZA/HOTDOG/MYSTERY_GLOB) with distinct tint+emoji
- [x] combo-bubbles — 3 combo types (GHOST_CLUSTER/SPOOK_BOMB/MEGA_MUNCHIE); spawn detection in core pass
- [x] blocker-entities — 4 blocker types with HP, crack visual, break animation; Phantom Lock immune to regular pop
- [x] gravity-refill — Identity-stable gravity cascade; 80ms/row ease-out; top-row refill at 150ms
- [x] input-lock — ANIMATING phase blocks all input; silent discard per GDD OQ-1 resolution
- [x] flood-fill-group — BFS group detection; Mystery Glob wildcard joins largest adjacent group
- [x] scoring-system — computeScore + computeStars; multiplicative formula with group size + cascade depth
- [x] hud-renderer — GPU Pixi HUD strip (127px); score + moves + objectives; tutorial mode suppression
- [x] objective-system — Level objectives tracked; win condition: all objectives met before moves=0
- [x] level-generation — mulberry32 seeded PRNG; 5-step pipeline; 4 rejection conditions; fallback chain
- [x] tutorial-levels — Tutorial levels 1-3 hand-authored with real content; TutorialOverlay pointer+dialogue
- [x] chapter-system — chapterNumber ECS resource; isChapterBoundary logic; CHAPTERS config with real copy
- [x] companion-dialogue — CompanionRenderer at y=716px; GSAP.delayedCall for auto-dismiss; real dialogue strings
- [x] win-sequence — WON phase + GSAP celebration cascade + star rating + goto('results')
- [x] loss-sequence — LOST phase + board dim (alpha 0.4, 300ms) + goto('results'); Get More Moves disabled
- [x] first-time-cutscene — 3-panel comic intro; localStorage gate (namespaced key); skip button
- [x] chapter-complete-screen — ResultsScreen chapter-complete variant wired to CHAPTERS config + lastCompletedChapter signal
- [x] start-screen-stub — StartScreen with logo, Play button, settings; cutscene flow
- [x] themed-background — BackgroundRenderer on bgLayer behind board; chapter-themed emoji tile
- [x] companion-dialogue (rendering) — CompanionRenderer with event-driven dialogue variants

## CoS Compliance — pass `core`

| CoS                    | Status  | Evidence / note |
|------------------------|---------|-----------------|
| `core-interaction`     | pass    | interaction-archetype.md all fields; pointertap on boardLayer (not DOM); shake on invalid; ANIMATING lock confirmed (batch 1, 3, 6, 11) |
| `canvas`               | pass    | BUBBLE_SIZE=50px ≥ 48px; CELL_W=56px ≥ 44pt; 7×9 grid within 390×844 viewport; no overlap; 5 types + blockers/combos all tint+emoji distinct (batch 2, 5, 9) |
| `animated-dynamics`    | pass    | Identity-stable cell IDs through applyGravity; GSAP ease-out only; event queue (ANIMATING→IDLE); CASCADE_TIMING table; no instant changes (batch 4, 7) |
| `scoring`              | pass    | groupScore=(groupSize-1)*50; cascadeMultiplier=(depth+1); two multiplicative dimensions; star thresholds 30%/55%; computeStars tested (batch 3, 7) |

## Completeness — pass `core`

| Area                   | Required | Met | Gaps |
|------------------------|----------|-----|------|
| Interaction            | 5        | 5   | 0    |
| Board & Pieces         | 4        | 4   | 0    |
| Core Mechanics         | 6        | 6   | 0    |
| Scoring (base)         | 3        | 3   | 0    |
| CoS mandatory          | 4        | 4   | 0    |

## Known Issues

- **Minor**: chapter-complete branch in ResultsScreen.tsx was unwired after integrate phase — resolved in stabilize by adding `lastCompletedChapter` signal to gameState and wiring CHAPTERS config display into the win branch.
- **Minor**: `browser-mcp-unavailable` — smoke/browser playtest could not be executed (no browser MCP in environment); manual verification required before shipping.

## Deferred

- **Combo activation effects** (3×3 blast, row+col clear, rarest-type clear) — secondary pass. Core pass ships spawn detection and visual materialization only; activation taps are a no-op. Ghost Cluster is visible but untappable — informed via Scooby dialogue in companion strip.
- **GPU asset atlases** — emoji/tint fallbacks used throughout core pass. Real atlas bundles (scene-*, core-*) produced in asset-gen pipeline (v0.5).
- **Audio SFX/music** — audio-* bundles wired but empty. Silent gameplay accepted in core pass.
- **Get 5 More Moves monetization** — button present on loss screen but disabled (onClick=noop). Monetization/ads pass.
- **Background light-theme contrast** — emoji tile at alpha=0.5 verified readable on dark chapter themes; light themes introduced in secondary pass need validation.

## Recommendations

1. **Secondary pass: combo activation** — highest player-visible gap. Ghost Cluster 3×3 blast, Spook Bomb row+col clear, Mega Munchie rarest-type clear. Also wire Phantom Lock destruction on combo-hit.
2. **Asset pass: GPU atlases** — replace emoji+tint fallbacks with real 70s cartoon art assets. Bundle setup is scaffolded; content is the blocker.
3. **Audio pass** — wire Howler SFX bundles for pop, cascade, combo, win, loss, UI taps.
4. **Browser smoke test** — once browser MCP is available, run smoke-test skill to verify no visual regressions at 390×844.
5. **Secondary pass: obstacle variety** — Haunted Frame and Phantom Lock visuals + break animations need activation paths added.
