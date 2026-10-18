---
name: sauce-animation
description: Working on sauce.js (packages/sauce) or adding motion to SauceUI - the timeline/track model and its invariants, value mixing, adapters, tests, size budget, and when to use CSS instead. Use for any change to packages/sauce, for animation features, or for the planned `sauce` prop.
---

# sauce.js and motion in SauceUI

Read ADR 0008 (`docs/adr/0008-sauce-js-animation.md`) and, for component
motion, `docs/plans/SAUCE_PROP_PLAN.md`.

## Choose the cheapest tool

1. **CSS** (`transition`, `@keyframes`, `@starting-style`) for component
   states, enter/exit and decorative loops. Components animate this way;
   durations come from `--sauce-duration-*` tokens, which collapse under
   reduced motion.
2. **sauce.js** for sequencing, scrubbing, reversing, staggering, text,
   nesting, or animating non-CSS targets.
3. **Never** a third-party animation library.

## The model (keep these invariants)

| Module            | Role                                                                                                                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/timeline.ts` | `Track` per `(target, property)`: segments in start order, sampled purely by time. `Timeline.render(time)` maps repeat/delay/yoyo, samples tracks, then renders nested timelines at `(local − start) × timeScale`. Positions, labels, controls |
| `src/value.ts`    | `mix(a, b)`: numbers inside same-shaped strings, unit borrowing, OKLab colours, discrete (`none`/`hidden` yield), `mixText`                                                                                                                    |
| `src/target.ts`   | Adapters: elements (individual `translate`/`rotate`/`scale`, CSS, `--vars`, `text`, SVG attributes, numeric properties) and plain objects. Writes are batched; `flush()` once per render                                                       |
| `src/ease.ts`     | `cubicBezier`, named GSAP-style eases, CSS names, `steps(n)`                                                                                                                                                                                   |
| `src/ticker.ts`   | One shared rAF loop, only while something plays; gaps clamp to 1/30 s                                                                                                                                                                          |
| `src/split.ts`    | `splitText`, accessible                                                                                                                                                                                                                        |

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
- **Starting values are read lazily, once,** on first sample.
  `invalidate()` resets them.
- **`then()` resolves with no value**, and at once if already finished.
  Never resolve with the timeline, or it would be awaited again forever.
- **SSR-safe:** no DOM access at import time, and plain objects work in Node
  (`verify:packages` checks this).
- **Reduced motion:** playing under `prefers-reduced-motion: reduce` jumps to
  the end unless `reducedMotion: 'ignore'`.

## Changing sauce.js

- **New property type:** extend the element adapter (`get`, `set`, `mixer`).
  New mixing behaviour goes in `value.ts` with unit tests.
- **New ease:** add it to `families` (as its _in_ form; out and inOut are
  derived) or to `keywords`.
- **API changes:** sauce.js is 0.x, but GSAP-compatible names and position
  syntax are a promise to GLOP users. Keep them.
- **Tests:**
  - `src/sauce.test.ts` covers pure maths and plain objects, plus fake-timer
    playback (`vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })`);
  - anything that reads computed styles or real transforms goes in
    `apps/playground/e2e/motion.spec.ts`;
  - in Playwright, never return a timeline from `page.evaluate`, because
    it's a thenable and would be awaited.
- **Size:** `npm run build -w @sauce-ui/sauce && npm run size -w @sauce-ui/sauce`.
  The budget is 5.5 kB for everything. Measure per module (see
  `sauce-lightweight`) before adding features. GSAP-scale features (plugins,
  ScrollTrigger, morphing, physics) are out of scope.
- **Docs:**
  - `stories/guides/Animation.mdx` (the API tables);
  - `stories/motion/Sauce.stories.tsx` (demos through `Player`, which opens
    paused on the last frame so snapshots are deterministic);
  - `packages/sauce/README.md`;
  - ADR 0008 for decisions.
- **Changeset:** `'@sauce-ui/sauce': minor | patch`. Commit scope `sauce`.

## Motion in components (the planned `sauce` prop)

Follow `docs/plans/SAUCE_PROP_PLAN.md`:

- Tier 1 is CSS presets with inline variables and no engine;
- Tier 2 is the sauce.js engine, opt-in, never statically imported by
  components;
- Tier 3 is full timelines.

Until that plan is approved, don't add a `sauce` prop to components ad hoc.
