# Interaction Archetype — Scooby Snacks Pop!

## Interaction Type

**Tap** — single press to activate a bubble group.

## Pointer Sequence

```
pointerdown  → Record cell (col, row) from tap position
                (no pointer capture needed for tap — no drag tracking)

pointerup    → Resolve group via flood-fill from recorded cell
                If phase !== IDLE: discard silently (OQ-1 resolution)
                If group.size < 2: play shake animation on tapped cell; no move consumed
                If group.size ≥ 2: execute pop sequence → decrement move → score
```

Implementation uses `pointertap` (Pixi's synthetic pointer-up-without-drag event)
on the boardLayer container. This is equivalent to `pointerdown` + `pointerup`
within a drag-distance threshold, and handles both mouse and touch correctly.

## Cancel Behavior

Tap is atomic — no partial gesture. If the player taps during ANIMATING phase,
the tap is silently discarded. There is no drag threshold or cancel condition
because Tap has no drag phase.

## Invalid Gesture Feedback

- **Lone bubble tap** (group size = 1): tapped cell plays horizontal shake animation
  via GSAP (4 oscillations, ±6px, 300ms total). No move consumed. No score change.
- **Tap during ANIMATING**: silently discarded. The ongoing animation is the
  contextual feedback — the system is visibly busy.
- **Tap on EMPTY cell or blocker**: no action, no feedback.

## Feel Description

**Responsive and tactile.** The tap resolves immediately on pointerup. Group
highlighting (80ms flash before pop) gives 1 frame of confirmation. Pop burst
animation is snappy (scale 1→0, 150ms ease-in). Cascade gravity feels satisfying
and juicy — 80ms/row ease-out with squash/bounce on landing.

Rejection (lone bubble shake) is forgiving — the board state is preserved and
the player can immediately try again.

## Touch Target

Cell hit area: 56×65 px (cell_w × cell_h from viewport budget). Minimum 44pt
satisfied. Pointer events on boardLayer container with `eventMode='passive'`
propagating to cell sprites with `eventMode='static'`.
