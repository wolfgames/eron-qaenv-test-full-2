# Scooby Snacks Pop!
**Tagline:** Every haunted room hides a treat worth finding.
**Genre:** Casual Bubble Pop Puzzle / Match-and-Clear
**Platform:** Mobile first (portrait, touch), playable on web
**Target Audience:** Casual adults 30+

## Game Overview
Scooby Snacks Pop! is a vibrant bubble-popping puzzle game set across the Mystery Inc. gang's most beloved haunted locations. Players tap clusters of floating treat-filled bubbles to clear the board, helping Scooby and Shaggy track down their favorite snacks one spooky room at a time. Rendered in lush 70s Saturday morning cartoon style — warm earth tones, chunky outlines, groovy typography — the game delivers nostalgic comfort with every satisfying pop. The deeper you go, the spookier the scenery, but the snacks always taste just as good.

**Setting:** A rotating series of haunted locations drawn from the classic Scooby-Doo universe — the Haunted Mansion, the creaky Coolsville Warehouse, Crystal Cove Boardwalk, the Old Mill — each rendered in flat, graphic 70s cartoon illustration style with warm amber, harvest gold, avocado green, and burnt orange palettes.

**Core Loop:** Player taps a group of matching treat-bubbles → the group pops and spooky ghosts flee the board → Scooby collects the freed snacks to unlock the next haunted room.

---

## Table of Contents

**The Game**
1. [Game Overview](#game-overview)
2. [At a Glance](#at-a-glance)

**How It Plays**
3. [Core Mechanics](#core-mechanics)
4. [Level Generation](#level-generation)

**How It Flows**
5. [Game Flow](#game-flow)

---

## At a Glance

| | |
|---|---|
| **Grid** | 7×9 bubble grid (portrait) |
| **Input** | Tap |
| **Treat Types** | 5 (Snack Bone, Burger Bubble, Pizza Pop, Hot Dog Fizz, Mystery Glob) |
| **Combo Bubbles** | Ghost Cluster (5-6), Spook Bomb (7-9), Mega Munchie (10+) |
| **Levels / Chapter** | 15 levels |
| **Session Target** | 2-5 min per level |
| **Move Range** | 12-40 taps |
| **Chapters at Launch** | 5 |
| **Blockers** | Cobweb (Ch.2), Haunted Frame (Ch.3), Stone Gargoyle (Ch.4), Phantom Lock (Ch.5) |
| **Failure** | Yes — out of moves |
| **Continue System** | Ad or in-game currency (Snack Coins) for +5 moves |
| **Star Rating** | 1-3 stars, cosmetic only |
| **Companion** | Scooby-Doo — loyal, goofy, enthusiastic about snacks, terrified of everything else |
| **Content Cadence** | 1 chapter every 3 weeks |

---

## Core Mechanics

### Primary Input
**Input type:** Tap (single finger tap)
**Acts on:** A bubble on the play grid
**Produces:** If the tapped bubble is part of a connected group of 2 or more same-type bubbles, the entire connected group pops simultaneously. If the bubble is isolated (no neighbors of the same type), the tap is invalid and produces feedback without spending a move.

### Play Surface
- **Dimensions:** 7 columns × 9 rows, portrait orientation
- **Cell size:** Each bubble occupies a 44pt minimum hit target (visually ~40pt bubble sprite within a 48pt touch cell)
- **Scaling:** Grid scales uniformly to fill the phone's safe area, preserving a minimum 44pt tap target at all supported resolutions (375pt–430pt wide)
- **Bounds:** Grid is centered horizontally. Top HUD (score, moves, treat-objective tracker) occupies the top ~15% of the viewport. Bottom companion strip occupies the bottom ~12%. The grid fills the remaining space.
- **Cell types:**
  - **Active cell:** Contains a treat-bubble, tap-interactive
  - **Blocked cell:** Contains a blocker entity, not tap-interactive
  - **Empty cell:** Air pocket; bubbles above it float down via gravity fill

### Game Entities

#### Treat Bubbles (5 types)
Each type is a distinct treat drawn in chunky 70s cartoon style inside a translucent bubble shell with a colored tint.

| Entity | Visual | Behavior Rules | Edge Cases |
|--------|--------|----------------|------------|
| **Snack Bone** | Blue-tinted bubble, cartoon dog-bone inside, thick white outline | Groups of 2+ matching neighbors pop on tap | Single isolated bone: tap is invalid — no move spent |
| **Burger Bubble** | Orange-tinted bubble, stacked cartoon burger | Groups of 2+ pop on tap | Same as above |
| **Pizza Pop** | Red-tinted bubble, cartoon pizza slice | Groups of 2+ pop on tap | Same as above |
| **Hot Dog Fizz** | Yellow-tinted bubble, cartoon hot dog | Groups of 2+ pop on tap | Same as above |
| **Mystery Glob** | Purple-tinted bubble, swirling "?" design | Groups of 2+ pop on tap; Mystery Glob counts as wildcard — connects with any other type when calculating group size | IF a Mystery Glob is adjacent to groups of two different types, it joins the larger group |

#### Combo Bubbles (spawned by large pops)
Combo bubbles replace one of the cleared bubbles when a large enough group is cleared in a single tap.

| Entity | Spawn Condition | Visual | Effect on Tap |
|--------|-----------------|--------|---------------|
| **Ghost Cluster** | Pop a group of exactly 5-6 bubbles | Cartoon ghost sprite inside a bubble, glowing edges | Clears all bubbles in a 3×3 area centered on tap position |
| **Spook Bomb** | Pop a group of 7-9 bubbles | Cartoonish bomb with a ghost face | Clears an entire row AND an entire column |
| **Mega Munchie** | Pop a group of 10+ bubbles | Giant glowing snack with sparkling outline | Clears all bubbles of the rarest treat type currently on the board |

#### Blockers (introduced progressively per chapter)

| Entity | Visual | HP | Break Condition | Gravity Behavior |
|--------|--------|----|-----------------|------------------|
| **Cobweb** | Sticky gray cobweb mesh over a cell | 2 hits | Pop an adjacent group twice (each adjacent pop = 1 hit) | Cobweb stays in place; bubbles below it fall normally |
| **Haunted Frame** | Ornate spooky picture frame locking a bubble in place | 1 hit (remove frame, bubble inside becomes active) | Pop any group containing an adjacent bubble once | Frame breaks, releasing the trapped bubble |
| **Stone Gargoyle** | Small stone gargoyle perched on a cell | 3 hits | Adjacent group pops (1 hit each) | Gargoyle does not fall; blocks gravity fill from passing through |
| **Phantom Lock** | Translucent padlock with ghost inside | Requires a Combo Bubble effect to hit it | Any Combo Bubble blast that overlaps the cell clears it instantly | No gravity effect |

### Movement & Physics Rules

**Gravity:**
- IF a bubble is cleared from a cell AND there is a bubble directly above it → the bubble above falls to fill the empty cell.
- IF a chain of cells above is cleared → all bubbles above cascade downward in sequence, settling into the lowest available empty cells in their column.
- Gravity fill animation: 80ms per row of fall, ease-out curve.

**Refill:**
- IF one or more cells in the top row are empty after gravity settle → new treat-bubbles drop in from above the top edge.
- New bubbles spawn with the same distribution weighting as the current level's configured treat mix.
- Refill animation: 150ms fall-in from off-screen top, ease-out.

**Input lock:**
- IF any animation is currently playing (pop, gravity, refill, combo) → tap input is locked.
- IF player taps during animation lock → the tap is silently discarded (no feedback, no move consumed).

**Tap resolution order:**
1. Register tap on cell
2. Resolve group: flood-fill matching neighbors (including Mystery Glob wildcards)
3. IF group size < 2 → invalid action (no move spent)
4. IF group size ≥ 2 → deduct 1 move, clear group, check combo threshold, animate pop, trigger gravity, trigger refill

> For invalid action feedback (visual, audio, duration), see [Feedback & Juice](#feedback--juice).

---

## Level Generation

### Method
**Hybrid** — Tutorial levels 1-3 are fully hand-crafted and stored in `/src/game/scooby-snacks-pop/data/tutorial-levels.json`. All Chapter 1-5 levels (levels 4-78) are procedurally generated at runtime using a seeded algorithm. The level designer can optionally hand-author override levels by dropping files into `/src/game/scooby-snacks-pop/data/overrides/level-{n}.json` — if a file exists for a level number, it loads directly and skips generation.

### Generation Algorithm

**Step 1: Seed Initialization**
- Inputs: `levelNumber` (integer), global constant `SEED_SALT = 98765`
- Outputs: A deterministic PRNG instance (`seededRng`)
- Formula: `seed = levelNumber * SEED_SALT`
- Constraint: Same `levelNumber` always produces the same seed, the same level.

**Step 2: Difficulty Parameter Derivation**
- Inputs: `levelNumber`, chapter progression table
- Outputs: `treatTypeCount` (2-5), `blockerCount` (0-12), `moveLimit` (12-40), `gridDensity` (0.7-1.0)
- Constraints:
  - Levels 4-13 (Ch.1): 2 treat types, 0 blockers, moveLimit 22-35, density 0.85
  - Levels 14-28 (Ch.2): 3 treat types, 0-2 cobwebs, moveLimit 18-32, density 0.88
  - Levels 29-43 (Ch.3): 3-4 treat types, 0-4 blockers (cobweb + haunted frame), moveLimit 16-30, density 0.90
  - Levels 44-58 (Ch.4): 4 treat types, 0-6 blockers (all prior + gargoyle), moveLimit 14-28, density 0.92
  - Levels 59-78 (Ch.5): 4-5 treat types, 0-12 blockers (all types including phantom lock), moveLimit 12-26, density 0.95
  - Within each chapter: levels 1-5 are ramp (easy), 6-12 are challenge, 13-15 are breathe (victory lap)

**Step 3: Grid Population**
- Inputs: `seededRng`, `treatTypeCount`, `blockerCount`, `gridDensity`, grid dimensions (7×9)
- Outputs: A populated 7×9 grid array
- Procedure:
  1. Fill all 63 cells with treat bubbles, randomly selected from the active treat pool, weighted equally among `treatTypeCount` types
  2. Randomly replace `blockerCount` non-top-row cells with blockers appropriate to the current chapter (weighted: common blockers more frequent)
  3. If `gridDensity` < 1.0, randomly convert `floor((1-gridDensity)*63)` cells in the top 3 rows to empty cells (creating visual variety and easier starts)
- Constraints:
  - Blockers may not be placed in row 1 (top row) — always accessible
  - No more than 2 blockers in any single column
  - Empty cells only in top 3 rows

**Step 4: Solvability Check**
- Inputs: populated grid
- Outputs: `isSolvable` boolean, `optimalMoveCount` estimate
- Method: Run a greedy simulation — repeatedly find the largest available group, pop it. Count moves to clear all objective treat types. If the simulation reaches a no-move state before objectives are met AND `movesRemaining` in simulation drops below 0, reject.
- Constraint: The greedy solve must complete all objectives within `moveLimit * 0.8` moves (20% headroom for casual play). Optimal solve must be possible.

**Step 5: Objective Injection**
- Inputs: solvable grid, `levelNumber`, chapter objectives
- Outputs: `levelObjectives` array (e.g., "Clear 12 Snack Bones and 10 Burger Bubbles")
- Procedure: Count treat type quantities on the final board. Set objectives at 60-75% of total available for each required treat type. Objectives increase proportionally with level difficulty.

### Seeding & Reproducibility
- Seed formula: `seed = levelNumber * 98765`
- The same seed always produces the same level — deterministic PRNG (`mulberry32` or equivalent)
- If a seeded level fails validation, increment seed by 1 and retry (up to 10 attempts): `seed = levelNumber * 98765 + attemptNumber`
- Failed seeds are logged client-side for analytics

### Solvability Validation

**Rejection Conditions (named):**
1. **DEADLOCK** — no group of 2+ matching bubbles exists anywhere on the board at start state
2. **OBJECTIVE_IMPOSSIBLE** — total available quantity of a required treat type is less than the objective count
3. **BLOCKER_SURROUNDED** — a blocker has no adjacent active cells (can never be damaged)
4. **OVERBUDGET** — greedy simulation requires more than `moveLimit * 0.8` moves

**Retry Logic:**
- On rejection: increment attempt counter, add attempt number to seed, regenerate from Step 2
- Retry limit: 10 attempts

**Fallback Chain:**
1. Attempts 1-10: standard generation with incrementing seed
2. If all 10 fail: reduce `blockerCount` by 50% and `treatTypeCount` by 1, retry once more
3. If fallback also fails: load the nearest valid hand-crafted level from the library (the set of tutorial levels extended with 15 pre-authored "safe" levels per chapter stored in `/src/game/scooby-snacks-pop/data/fallback-library/`)

**Last-Resort Guarantee:**
A minimal 7×9 grid filled entirely with 2 treat types and no blockers, with a 25-move limit, is always generatable — it can never be rejected. This is the absolute floor if the fallback library also somehow fails (defensive coding only; should never be reached in production).

### Hand-Crafted Levels
- **Which levels:** Tutorial levels 1, 2, 3 (absolute hand-crafted). Plus 15 fallback-library levels per chapter (75 total) stored as static JSON and never served to players directly unless the generation fallback chain is exhausted.
- **Where data lives:** `/src/game/scooby-snacks-pop/data/tutorial-levels.json` (tutorial), `/src/game/scooby-snacks-pop/data/fallback-library/ch{1-5}/` (fallback sets)
- **Who owns them:** Game Designer / Level Designer role. JSON format is human-editable and validated at build time by `bun run check:levels`.

---

## Game Flow

### Master Flow Diagram

```
App Open
  ↓ (assets load)
[Loading Screen] `lifecycle_phase: BOOT`
  ↓ (load complete)
[Title Screen] `lifecycle_phase: TITLE`
  ↓ (first-time only: "New Game" tap)
[First-Time Intro Cutscene] `lifecycle_phase: TITLE`
  ↓ (tap to skip / auto-advance)
[Tutorial Level 1] `lifecycle_phase: PLAY`
  ↓ (level cleared)
[Tutorial Level 2] `lifecycle_phase: PLAY`
  ↓ (level cleared)
[Tutorial Level 3] `lifecycle_phase: PLAY`
  ↓ (level cleared)
[Chapter 1 Start Interstitial] `lifecycle_phase: PROGRESSION`
  ↓ (tap "Let's Go!")
[Gameplay Screen — Level N] `lifecycle_phase: PLAY`
  ↓ [WIN] objectives met before moves = 0
[Level Complete Screen] `lifecycle_phase: OUTCOME`
  ↓ (tap "Next Level")
[Gameplay Screen — Level N+1] `lifecycle_phase: PLAY`
  ↓ [LOSE] moves = 0, objectives not met
[Loss Screen] `lifecycle_phase: OUTCOME`
  ↓ (tap "Try Again" or "Get Moves" for +5)
[Gameplay Screen — Level N retry] `lifecycle_phase: PLAY`
  ↓ (after Level 15 of chapter)
[Chapter Complete / Haunted Room Reveal] `lifecycle_phase: OUTCOME`
  ↓ (tap "Next Chapter")
[Chapter N+1 Start Interstitial] `lifecycle_phase: PROGRESSION`
  ↓
[Gameplay Screen — Level N+16] `lifecycle_phase: PLAY`
```

### Screen Breakdown

#### Loading Screen
- **Lifecycle phase:** BOOT
- **Purpose:** Load assets, initialize Pixi application
- **Player sees:** Full-screen branded loading screen — cartoon haunted mansion silhouette, Scooby peeking from a window, progress indicator styled as a Scooby Snack being nibbled away
- **Player does:** Nothing (passive wait)
- **Next:** Title Screen
- **Expected duration:** 2-6 seconds on LTE/WiFi

#### Title Screen
- **Lifecycle phase:** TITLE
- **Purpose:** Entry point — new game or resume
- **Player sees:** Game logo ("Scooby Snacks Pop!" in groovy 70s lettering), animated haunted mansion background, Scooby and Shaggy illustration, "Play" button, settings gear icon
- **Player does:** Taps "Play" to start (new player → tutorial; returning player → resumes at current level)
- **Next:** First-Time Intro Cutscene (new) OR Chapter Start Interstitial (returning) OR directly to Gameplay Screen if mid-chapter

#### First-Time Intro Cutscene
- **Lifecycle phase:** TITLE
- **Purpose:** Establish the narrative premise on first launch only
- **Player sees:** 3-panel comic-book style intro — Scooby and Shaggy in a haunted house, treats floating in bubbles everywhere, Scooby excited, Shaggy nervous. Dialogue panels with cartoon speech bubbles. Tap-to-advance each panel.
- **Player does:** Taps through 3 panels (or taps "Skip")
- **Next:** Tutorial Level 1

#### Tutorial Level 1
- **Lifecycle phase:** PLAY
- **Purpose:** Teach the core tap-to-pop mechanic; no move counter visible, no objectives tracker, no progress bar
- **Player sees:** Simplified 5×5 grid (subset of full grid), only Snack Bones (blue) and Burger Bubbles (orange), 2 large obvious clusters. Scooby portrait bottom-left with speech bubble. Ghost-finger pointer tap animation over the largest cluster.
- **Player does:** Taps the highlighted cluster
- **Next:** Tutorial Level 2

#### Tutorial Level 2
- **Lifecycle phase:** PLAY
- **Purpose:** Teach chaining — popping one group creates space for another group to form via gravity
- **Player sees:** 5×5 grid with mixed treat types, gravity-sensitive layout where popping the top cluster causes a cascade that connects a second cluster below. Scooby dialogue cue pointing to where new group will form.
- **Player does:** Pops the indicated cluster; watches gravity chain; pops the second formed cluster
- **Next:** Tutorial Level 3

#### Tutorial Level 3
- **Lifecycle phase:** PLAY
- **Purpose:** Teach combo bubbles — demonstrate a Spook Bomb forming from a large group
- **Player sees:** 5×5 grid with a pre-placed group of 7 matching bubbles, Scooby dialogue hinting "That's a HUGE group, Scooby!" with sparkle animation on the group
- **Player does:** Taps the large group; watches Spook Bomb spawn; taps the Spook Bomb
- **Next:** Chapter 1 Start Interstitial

#### Chapter Start Interstitial
- **Lifecycle phase:** PROGRESSION
- **Purpose:** Scene-setting transition; introduce the haunted location for the chapter
- **Player sees:** Full-screen chapter art (haunted location illustration in 70s style), chapter number badge, chapter title (e.g., "Chapter 1: The Haunted Mansion"), brief flavor text from Scooby, "Let's Go!" button
- **Player does:** Taps "Let's Go!" (or waits 4 seconds for auto-advance)
- **Next:** Gameplay Screen — first level of the chapter

#### Gameplay Screen
- **Lifecycle phase:** PLAY
- **Purpose:** Core game loop — the board the player interacts with
- **Player sees:**
  - Top strip (15% viewport): level number, move counter (ticking down), treat-objective progress icons
  - Center (73% viewport): 7×9 bubble grid, animated background matching chapter theme
  - Bottom strip (12% viewport): Scooby portrait + dialogue bubble (non-modal, auto-dismiss 3s)
- **Player does:** Taps bubble groups to pop them; watches gravity fills; works toward objectives
- **Next:** Level Complete Screen (win) or Loss Screen (lose)

#### Level Complete Screen
- **Lifecycle phase:** OUTCOME
- **Purpose:** Celebrate the win; show star rating; bridge to next level
- **Player sees:** Scooby doing a happy dance animation, star rating (1-3 based on moves remaining), score summary, "Next Level" button, optional "Share" button
- **Player does:** Taps "Next Level" (or share)
- **Next:** Gameplay Screen — next level (or Chapter Complete screen after Level 15 of a chapter)

#### Loss Screen
- **Lifecycle phase:** OUTCOME
- **Purpose:** Gentle failure state; offer retry or continue
- **Player sees:** Scooby looking sad with a half-eaten treat, "Out of moves!" text (styled warmly — not as a harsh failure), move count used, "Try Again" button (free retry), "Get 5 More Moves!" button (ad or Snack Coins)
- **Player does:** Taps "Try Again" (restart level) or "Get 5 More Moves!" (watch ad / spend currency)
- **Next:** Gameplay Screen — same level (retry or with bonus moves)

#### Chapter Complete / Haunted Room Reveal Screen
- **Lifecycle phase:** OUTCOME
- **Purpose:** Chapter climax — reveal the "mystery solved" narrative reward
- **Player sees:** Full-screen animated panel — Mystery Inc. gang celebrating, haunted room fully lit and de-ghosted, flavor narrative text ("Mystery solved! The ghost was Old Mr. Wickersham all along..."), treats scattered everywhere, Scooby eating gleefully, "Next Chapter" button
- **Player does:** Reads/views the reveal, taps "Next Chapter"
- **Next:** Chapter N+1 Start Interstitial

### Board States

| State | Description | Input Allowed? |
|-------|-------------|----------------|
| **IDLE** | Board fully settled, no animations running | YES — player can tap |
| **ANIMATING** | Pop burst, gravity fall, refill, or combo effect in progress | NO — tap is silently discarded |
| **WON** | Objectives met; level-complete sequence queued | NO |
| **LOST** | Moves reached 0; loss sequence queued | NO |
| **PAUSED** | Settings or pause overlay open | NO |

### Win Condition
`IF objectives.every(o => o.clearedCount >= o.targetCount) THEN state = WON`

### Lose Condition
`IF movesRemaining === 0 AND state !== WON THEN state = LOST`

### Win Sequence (ordered)
1. Last required bubble group pops (ANIMATING state, normal pop animation)
2. Gravity and refill complete (all animations settle)
3. Win condition evaluated: `true`
4. Board state transitions to WON (input locked)
5. Remaining bubbles play a celebratory pop cascade animation (200ms delay between each column, left to right)
6. Scooby happy dance animation plays on companion portrait
7. Star rating computed (1 star: level complete; 2 stars: ≥30% moves remaining; 3 stars: ≥55% moves remaining)
8. Score tallied with star bonus
9. Level Complete Screen slides up from bottom (animated, 350ms ease-out)

### Loss Sequence (ordered)
1. `movesRemaining` reaches 0 (move counter animation pulses red)
2. Any in-progress animation completes fully
3. Lose condition evaluated: `true`
4. Board state transitions to LOST (input locked)
5. Remaining bubbles dim to 40% alpha (300ms fade, ease-in-out)
6. Scooby droopy-ears expression animates
7. Loss Screen overlays from bottom (animated, 350ms ease-out)
8. "Try Again" and "Get 5 More Moves!" buttons appear
