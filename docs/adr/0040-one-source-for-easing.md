# ADR 0040: greese.js is the one source of easing curves

- **Status:** Accepted
- **Date:** 2026-11-07
- **Builds on:** ADR 0008 (greese.js), ADR 0031 (`@greese/svg`), ADR 0036
  (editor playback)

## Context

Easing curves were written out in several places:

- **greese:** greese.js's `ease.ts`; `@greese/svg`'s own `in`, `out` and
  `inOut` (the same cubic curves as greese.js's); and the site's count-up.
- **Glop:** the same seven named tweens (`linear`, `easeIn`, `easeOut`,
  `easeInOut`, `bounce`, `elastic`, `back`) three times over, in Rigatron,
  the game runtime's `glop.anim` and Sound Studio; a fourth, unused copy; a
  bézier solver of its own in Rigatron; and Pixels' renderer, which drew the
  same `easeIn` names as CSS's keyword curves and `elastic`, `bounce` and
  `back` as straight lines.

Glop's names don't parse as greese.js eases, and they mean different curves:
its `easeIn` is quadratic, where greese.js's bare `in` is cubic, and its
`back` pulls back at the start (`back.in`), where `fromPixels` had drawn
`back.out`. Saved rigs, Pixels and sound documents, and AI-written game code
hold these names, so they have to keep drawing what they drew.

## Decision

- **Curves are defined only in greese.js.** Everything else names a
  greese.js ease or calls `ease()`.
- **`tweenEase(type, { bezier, keywords })`** in greese.js maps an editor
  tween's name to a greese.js ease. `tweenEaseName` returns the name instead,
  for a timeline or for storing. Its table:
  - `easeIn`, `easeOut`, `easeInOut` (and the older `easeInQuad` spellings)
    are `power1`; with `keywords: 'css'` they're CSS's `ease-in` curves
    instead, which is how Pixels has always drawn them;
  - `elastic` and `bounce` are `.out`, and `back` is `back.in`, as Glop drew
    them;
  - `step` and `stepped` are `steps(1)`; `bezier` takes the tween's points;
  - any greese.js name passes through, and anything unknown is `linear`, so
    a saved document never fails to load over a name.
- **`fromPixels` uses it,** so its `back` becomes `back.in`.
- **`@greese/authoring` exports `tweenEaseResolver(keywords?)`,** the
  `TweenEaseResolver` every medium can hand the frame sampler instead of
  writing its own.
- **`@greese/svg` depends on greese.js** for its `ease` option. It was
  dependency-free (ADR 0031); greese.js has no dependencies itself, so svg
  still pulls in nothing from outside greese. Its `ease` now takes any
  greese.js ease, not just four names.

## Consequences

- **Size:** greese.js's "everything" budget goes from 7.4 to 7.55 kB and its
  `<script>` build from 7.8 to 7.95 kB, for the table (`tweenEase` alone is
  1.05 kB, and gets its own budget of 1.3 kB). `@greese/svg`'s "everything"
  goes from 9.4 to 9.95 kB, because it now includes greese.js's ease parser.
  Its per-function entries are unchanged, since only `tween` eases.
  `@greese/react/svg` carries the parser too: `Morph` goes from 3.95 to
  4.65 kB and the whole subpath from 12.6 to 13.25 kB.
- **Pixels' `elastic`, `bounce` and `back`** play their real curves in Glop
  too, not straight lines: what the tween picker shows is what plays.
- **The one difference left is deliberate:** Pixels' `easeIn` names are
  CSS's curves, and every other medium's are quadratic. Making them agree
  would change how existing documents of one kind play.
- **CSS can't call JavaScript:** `--greese-ease-in`, `-out` and `-in-out` stay
  `cubic-bezier()` approximations of greese.js's cubic curves, for CSS
  transitions.
