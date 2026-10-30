---
name: greese-animation
description: Working on greese.js (packages/js) or adding motion to greese ui - the timeline/track model and its invariants, value mixing, adapters, tests, size budget, and when to use CSS instead. Use for any change to packages/js, for animation features, or for the `greese` prop (utils/greese.ts, components/Motion).
---

# greese.js and motion in greese ui

Read ADR 0008 (`docs/adr/0008-greese-js-animation.md`) and, for component
motion, ADR 0009 (`docs/adr/0009-greese-prop.md`), which also summarises the
plan it implemented.

## Choose the cheapest tool

1. **CSS** (`transition`, `@keyframes`, `@starting-style`) for component
   states, enter/exit and decorative loops. Components animate this way;
   durations come from `--greese-duration-*` tokens, which collapse under
   reduced motion.
2. **greese.js** for sequencing, scrubbing, reversing, staggering, text,
   nesting, or animating non-CSS targets.
3. **Never** a third-party animation library.

## The model (keep these invariants)

| Module            | Role                                                                                                                                                                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/timeline.ts` | `Track` per `(target, property)`: segments in start order, sampled purely by time. `Timeline.render(time)` maps repeat/delay/yoyo, samples tracks, then renders nested timelines at `(local − start) × timeScale`. Positions, labels, controls                          |
| `src/value.ts`    | `mix(a, b)`: numbers inside same-shaped strings, unit borrowing, OKLab colors, discrete (`none`/`hidden` yield), `mixText`                                                                                                                                              |
| `src/target.ts`   | Adapters: elements (individual `translate`/`rotate`/`scale`, CSS, `--vars`, `text`, SVG attributes, numeric properties) and plain objects. All writes wait for `flush()` (one per render), and `batch()` holds flushes across timelines (the ticker batches each frame) |
| `src/ease.ts`     | `cubicBezier`, named eases (`power2.out`, `back.out(2)`…), CSS names, `steps(n)`                                                                                                                                                                                        |
| `src/ticker.ts`   | One shared rAF loop, only while something plays; gaps clamp to 1/30 s                                                                                                                                                                                                   |
| `src/split.ts`    | `splitText`, accessible                                                                                                                                                                                                                                                 |

**Invariants:**

- **Rendering is a pure function of time.** Seeking to `t` from anywhere
  gives the same result. Never accumulate state per frame; that's what makes
  reverse, scrub and nesting free.
- **A track before its first segment writes nothing.** It restores the
  original value exactly once, after having written, so rewinds work and
  sibling timelines aren't clobbered. From-tweens are the exception: they
  render `from` immediately.
- **Only root timelines tick.** `add()` pauses the child; the parent drives
  it.
- **Starting values are read lazily, once,** on first sample, and always
  before a track's first write (even when every keyframe is explicit), so
  `kill()` can restore them. `invalidate()` resets them.
- **`then()` resolves with no value**, and at once if already finished.
  Never resolve with the timeline, or it would be awaited again forever.
- **SSR-safe:** no DOM access at import time, and plain objects work in Node
  (`verify:packages` checks this).
- **Reads before writes:** never write a style while a render is still
  reading; buffer it for `flush()`. Interleaving forces a style recalculation
  per read (ADR 0008, 2026-10-19 addendum). Batch anything that starts many
  timelines at once.
- **Reduced motion:** playing under `prefers-reduced-motion: reduce` jumps to
  the end unless `reducedMotion: 'ignore'`.

## Changing greese.js

- **New property type:** extend the element adapter (`get`, `set`, `mixer`).
  New mixing behaviour goes in `value.ts` with unit tests.
- **New ease:** add it to `families` (as its _in_ form; out and inOut are
  derived) or to `keywords`.
- **API changes:** greese.js is 0.x, but its method names, ease names and
  position syntax are a promise to code ported onto it, which relies on
  them matching. Keep them.
- **Tests:**
  - `src/greese.test.ts` covers pure maths and plain objects, plus fake-timer
    playback (`vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })`);
  - anything that reads computed styles or real transforms goes in
    `apps/playground/e2e/motion.spec.ts`;
  - in Playwright, never return a timeline from `page.evaluate`, because
    it's a thenable and would be awaited.
- **Size:** `npm run build -w @greese/js && npm run size -w @greese/js`.
  The budget is 6.6 kB for everything (`animate` alone 5.7 kB). Measure per module (see
  `greese-lightweight`) before adding features. Heavyweight features (plugins,
  ScrollTrigger, morphing, physics) are out of scope.
- **Docs:**
  - `stories/guides/Animation.mdx` (the API tables);
  - `stories/motion/Greese.stories.tsx` (demos through `Player`, which opens
    paused on the last frame so snapshots are deterministic);
  - every demo that plays once gets a Replay button: `Replay` from
    `stories/_shared/Replay.tsx` (see `greese-conventions`, Docs);
  - `packages/js/README.md`;
  - ADR 0008 for decisions.
- **Changeset:** `'@greese/js': minor | patch`. Commit scope `greese`.

## Motion in components: the `greese` prop (ADR 0009)

| File                                 | Role                                                                                                                                                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/greese.ts`                    | Types, `resolveGreese` (pure: classes + `--greese-motion-*` variables), `withGreese` (clones the root; adds the island only when JavaScript is needed)                                                                       |
| `components/Motion/Motion.scss`      | CSS presets (each sets `--greese-motion-name`; shared rules animate), stagger index via `sibling-index()` with an `:nth-child` fallback, `--greese-ease-*`, exit classes; all behind `prefers-reduced-motion: no-preference` |
| `components/Motion/scope.ts`         | The `scope` option (ADR 0017): orders `enter`s across depth by setting `--greese-motion-scope`; lazy, no greese.js; budget 1 kB                                                                                              |
| `components/Motion/GreeseIsland.tsx` | The client island: Slot onto the root, marks out-of-view `inView` targets pending before paint, loads the runtime                                                                                                            |
| `components/Motion/registry.ts`      | `loadGreeseRuntime()`: the registered runtime, or a dynamic import (a lazy chunk)                                                                                                                                            |
| `components/Motion/greeseRuntime.ts` | Reveals, interactions, text effects, keyframe entrances, timelines; the `BUILT_IN` effect table and the sequence parser (`parseSequence`, `addMotion`)                                                                       |
| `components/Motion/effects.ts`       | `defineGreeseEffect()`: the custom-effect `Map`, outside the lazy chunk so defining never loads greese.js                                                                                                                    |
| `hooks/useGreese.ts`                 | greese.js tied to a component's lifetime: layout-effect build, a recorder of every timeline made through `g`, scope via greese.js `TimelineOptions.scope`; `useTimeline` wraps it                                            |
| `src/greese.ts`                      | The `@greese/react/greese` opt-in: registers the runtime eagerly                                                                                                                                                             |

**Rules:**

- **New presets** go in CSS first (a `@keyframes` and a class), and are
  mirrored in `BUILT_IN` (greeseRuntime.ts) for when greese.js plays them
  (sequences, non-CSS eases). Add the name to `CSS_PRESETS` in
  `utils/greese.ts` too.
- **Effect names are camelCase** in the API; CSS classes and keyframes are
  their kebab-case form (stylelint enforces kebab modifiers).
- **Sequences** (`'a+b,+2,c'`) always run in greese.js. Keep runtime code
  free of locals reassigned from each other (`let end = cursor` …
  `cursor = end`): Storybook's react-docgen recursed on that until the
  stack overflowed and the docs build failed.
- **Defaults** are `var()` fallbacks, never declarations on `.greese-Motion`,
  so ancestors can tune them.
- **Fill mode** is `backwards`, never `both`: overlays' exit transitions
  depend on it.
- **Anything new needing JavaScript** must keep the island path lazy and the
  resolver pure (it runs in Server Components).
- **Tests:**
  - unit: `src/components/motion.test.tsx`;
  - browsers: `apps/playground/e2e/greese-prop.spec.ts` (and
    `e2e/motion.spec.ts` for `useGreese`);
  - fake-timer tests: drain the shared ticker after each test (unmount,
    then advance a frame), or a frame left pending when real timers return
    stalls the loop for every later test;
  - visual snapshots run with reduced motion, so stories show final
    states;
  - a story whose motion plays once wraps it in `Replay`
    (`stories/_shared/Replay.tsx`), so visitors can watch it again.

## Page transitions (ADR 0029)

Read ADR 0029 and its addenda, and the guide `stories/guides/PageTransitions.mdx`.

| File                                                         | Role                                                                                                                                                                       |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `components/PageTransition/PageTransition.tsx`               | Wraps React's `<ViewTransition>`. A Server Component: everything it takes is data. Renders two empty `<template>` markers around the page (its live settings on the first) |
| `components/PageTransition/pageMotion.ts`                    | Pure: the class map by transition type, selector rules as CSS, navigation types                                                                                            |
| `components/PageTransition/pageExit.ts`                      | The live exit: finds the page and its members, decides the mode, plays the members' exits in CSS                                                                           |
| `components/PageTransition/PageShare.tsx`                    | A shared element, named from a key (`utils/share.ts`)                                                                                                                      |
| `hooks/usePageNavigate.ts`                                   | The client part: adds the types, holds the commit for a live exit, holds back and forward (Navigation API)                                                                 |
| `components/Motion/greeseRuntime.ts` `playPageExit`          | Timelines (sequences, selector maps) for a live exit, through greese.js                                                                                                    |
| `@greese/ui` `components/PageTransition/PageTransition.scss` | The snapshot rules and the exits' keyframes (`cssPlan().leave`)                                                                                                            |

**Rules:**

- **Exactly one direction type per navigation** (`greese-forward`,
  `greese-back` or `greese-replace`). React joins the classes of every active
  type in a `<ViewTransition>` map, so two directions would leave the effect to
  stylesheet order. Unmapped updates resolve to `none`.
- **Types before any `await`:** `addTransitionType` only reaches the
  transition it's called in, so whatever decides them (the mode included)
  runs synchronously at the click.
- **Start the router inside the async transition:** React entangles its
  update with the action and commits when both are done. That's how a live
  exit holds the commit while the next page loads.
- **Remove what a live exit sets, after the commit:** React keeps an
  element that's in the same place on both pages, and it would keep the
  exit's last frame.
- **No greese.js on snapshots:** pseudo-elements take no inline styles.
  Snapshots play named effects in CSS; sequences and maps play live.
- **Snapshot selectors start with `html`** (`html::view-transition-new(…)`):
  without it, the browser tries each rule against every element (see
  `greese-styles`).
- **Reduced motion:** greese snapshots don't animate, and a live exit's
  keyframes don't exist, so the page changes at once.
