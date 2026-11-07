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
