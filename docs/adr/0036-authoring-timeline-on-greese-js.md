# ADR 0036: The authoring timeline runs on greese.js

- **Status:** Accepted. The audit (2026-11-07, below) kept three of the five
  additions and struck two; the three landed in greese.js the same day (ADR
  0008 addendum).
- **Date:** 2026-11-06
- **Amends:** ADR 0008 (greese.js gains a few timeline features for editors)

## Context

Glop's authoring timeline plays and samples animation with code of its own:

- `usePlaybackClock` runs a `requestAnimationFrame` loop that advances
  `currentFrame`, looping or stopping at the playback bounds;
- `tween.helpers.ts` has its own `cubicBezier`, `evaluateFrame` and
  `sampleTweenedNumber` / `sampleTweenedRecord`;
- Amp layers musical time on top: time signatures, ticks, a rate curve and a
  pulse clock.

greese.js already covers most of this:

- timelines that play, pause, seek, reverse, scale time, repeat and nest;
- labels;
- plain-object tweens;
- `cubicBezier` and `mix`;
- a `fromPixels` adapter for Pixels animations.

Two implementations of tweening drift apart: an ease or a hold behaves
differently in the editor than in the exported game.

## Decision

**The authoring timeline keeps its document model and UI, and hands playback
and interpolation to greese.js.**

- **The model stays.** Layers hold frames, frames are keyframes or empty, and
  tweens span keyframes. That model is the timeline's persisted form, which
  Glop documents and Firestore depend on.
- **Playback:** a greese.js `Timeline` built from the document drives the
  playhead.
  - The store's `currentFrame` follows the timeline.
  - Scrubbing calls `seek`.
  - The hand-rolled `requestAnimationFrame` loop goes.
- **Interpolation:** tween sampling uses greese.js `ease`, `cubicBezier` and
  `mix`. `fromPixels` is the starting point: its types become authoring's
  shared shape, or are replaced by authoring's own types.

**Folded into greese.js**, where an editor needs it and a page might too.
Each is dependency-free, tested and measured against greese.js's budget:

| Addition          | What it does                                                                         | Glop source                       |
| ----------------- | ------------------------------------------------------------------------------------ | --------------------------------- |
| Frame snapping    | An `fps` option that quantizes the playhead to frames; time stays in seconds         | `timingModel`, `usePlaybackClock` |
| Hold keyframes    | Step values between keys                                                             | empty and hold frames             |
| In/out bounds     | Loop or stop between two times or labels, without rebuilding the timeline            | `playbackBounds`                  |
| A variable rate   | A `timeScale` that changes over time                                                 | `rateCurve`                       |
| An external clock | The host sets time each frame instead of the shared ticker: Amp's audio clock, tests | `usePulseClock`                   |

**Stays in authoring**, because it is musical, not motion:

- time signatures, ticks and pulses (`timingModel`, `resolutions`);
- the mapping from that time onto greese.js seconds.

## Consequences

- **What leaves Glop:** `usePlaybackClock`'s loop and the tween samplers. The
  editor and the exported game then share one implementation of easing and
  holds.
- **Phase 3 starts with an audit** (under the `greese-animation` skill) that
  maps each Glop helper onto the greese.js API. It confirms which of the
  additions above are real gaps. Any addition the audit finds unnecessary is
  struck from this ADR.
- **Amp's audio-driven transport** depends on the external clock. Until that
  lands, Amp keeps its own clock.

## Addendum (2026-11-07): the audit

Each Glop helper, against greese.js:

| Glop                                   | greese.js                                                                                                                                                                                  | Verdict                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `tween.helpers` `cubicBezier`          | `cubicBezier`, the same Newton-Raphson with a bisection fallback                                                                                                                           | Replaced                   |
| `evaluateFrame`, `sampleTweened*`      | The document model's own logic (key, tween, hold, empty frames). It stays in authoring, easing through greese.js's `ease` and `cubicBezier`                                                | Stays, re-based            |
| `usePlaybackClock`'s frame grid        | Nothing: greese.js renders continuous time, and Glop samples tweens on whole frames, so an editor's preview and the game would differ                                                      | **Added: `fps`**           |
| Hold keyframes                         | A hold is a value that steps at the next key: `set()` at that time, or a segment eased `steps(1)`                                                                                          | **Struck**                 |
| `playbackBounds`, the loop's overshoot | `repeat` loops the whole timeline, not a span of it                                                                                                                                        | **Added: `bounds()`**      |
| `rateCurve`                            | Not a clock rate: a piecewise ticks-to-seconds table in authoring's resolutions. The clock adds `dt × speed` in seconds and the mapping does the rest, so a constant `timeScale` is enough | **Struck**                 |
| `usePulseClock`, Amp's audio transport | `tick(dt)` and `render(t)` were public, but `play()` always joined the shared ticker                                                                                                       | **Added: `ticker: false`** |

- **`fps`** quantizes what tracks and nested timelines are sampled at; the
  playhead, `time()` and callbacks keep real seconds, and the end is exact.
- **`bounds(start, end, { loop })`** takes times or labels. A looping lap
  carries its overshoot into the next, as Glop's clock did, so laps keep
  exact time against a continuous clock; cues in the lap fire each time.
- **`ticker: false`** leaves a playing timeline for the host to `tick(dt)`.

Cost, together: about 0.2 kB brotli (ADR 0008 addendum).

## Addendum (2026-11-07): what the review changed

- **The clock reports whole frames.** `usePlaybackClock` maps the
  timeline's seconds to a frame through the resolution and floors it, so
  `currentFrame` is always an integer and changes only when the frame does.
  While playing, it listens to the store: a frame set from elsewhere (a scrub,
  a ruler click, a key) seeks the clock there, rather than being overwritten
  on the next tick.
- **The playhead, the playback bounds and the bezier editor's points are
  sliders** (WAI-ARIA APG): focusable, with arrows, Page keys, Home and End.
  The box you press is at least 24px (WCAG 2.5.8) with the drawing
  unchanged inside it, 44px on coarse pointers, and they take no browser
  panning (`touch-action: none`). A playhead standing on a bound is partly
  covered by the bound's bracket, which stays on top; the ruler still scrubs
  from anywhere, so axe's `target-size` flags only that overlap.
- **The keyframes have no keyboard path yet: a known gap.** Frames and
  keyframes are picked and dragged by pointer. The timeline's keymap acts on a
  selection (copy, paste, delete, tweens, splits), and the playhead moves by
  key, but nothing moves a focus through the cells. Closing it means a grid
  (`role="grid"`, one cell per layer and frame, roving focus) over a surface
  that renders thousands of frames, and is its own piece of work.
- **The keymap yields.** It ignores a key something else has already handled,
  and keys inside a dialog, popover, menu, listbox, select or slider. Escape
  is taken only when there's a selection to clear.
- **Reduced motion:** the beat pulses and the playhead's echo ring don't play
  under `prefers-reduced-motion` or the app's `data-greese-motion="reduce"`
  (greese.js's `prefersReducedMotion`). The playhead itself still moves: it's
  the tool, not decoration.
- **Time runs left to right** on a right-to-left page (`direction: ltr` on the
  timeline).
