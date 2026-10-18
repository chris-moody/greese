# ADR 0008: greese.js, the animation library

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

GreeseUI needs animation that's simple, configurable and light, and that can
later power a `greese` prop on components (see
[the plan](../plans/GREESE_PROP_PLAN.md)). GLOP, the codebase this work comes
from, uses two systems:

- **GSAP** in the game engine, used lightly: `gsap.to`, `fromTo` and
  `killTweensOf` with named eases (`'elastic.out(1.2, 0.5)'`).
- **The Pixels timeline** (`@beta/ui/features/authoring`). Animation is data:
  per-layer keyframes on named numeric channels, tweens between adjacent keys,
  and `sampleTweenedRecord(timeline, frame)` returning every channel's value
  at any frame. Spans nest one timeline inside another through clamp, scale
  and loop. Colours mix in OKLCH. A single rAF clock drives the playhead.

The Pixels model is the useful intersection. Because sampling is a pure
function of time, seeking, reversing, time scaling and nesting are all just
choices of which time to sample.

## Decisions

### 1. A separate package, bundled with GreeseUI

The package is `@greese-ui/greese`, branded greese.js. The unscoped `greese.js`
name is taken on npm. It has no dependencies and no React; it works on any
element or object. `@greese-ui/react` depends on it and re-exports `animate`,
`timeline`, `ease`, `cubicBezier`, `splitText` and their types, so one
install covers both. `sideEffects: false` means apps that never import it pay
nothing.

It starts at 0.x, so the API can still move.

### 2. Sampling in JavaScript, not the Web Animations API

WAAPI runs `transform` and `opacity` off the main thread, but it can't nest
timelines (`GroupEffect` never shipped), animate objects or text, or seek a
group of animations atomically. So greese.js follows the Pixels model:

- **Tracks.** Each `(target, property)` pair is a track of segments in start
  order. `sample(time)` returns the value, and seeking anywhere, in any
  order, gives the same result.
  - Before its first segment, a track leaves the property alone. If it has
    already written, it restores the original value once, which makes
    rewinds correct without clobbering other timelines.
  - From-tweens show their start value immediately, so nothing flashes.
- **Timelines.** A timeline is `render(time)`: it maps total time through
  repeat, repeat delay and yoyo to one play-through, samples its tracks, then
  renders nested timelines at `(time − start) × timeScale`. That's Pixels'
  span mapping, generalised.
- **One clock.** A single shared `requestAnimationFrame` loop runs only while
  something plays. Nested timelines have no clock of their own. A gap longer
  than 1/30 s (a background tab) counts as one frame, so animations resume
  rather than jump.

The cost is main-thread work per frame. The docs say to prefer CSS for
long-running decorative loops.

### 3. What it animates, and how values mix

- **Transforms** (`x`, `y`, `z`, `rotate`, `scale`, `scaleX`, `scaleY`) write
  the individual CSS `translate`, `rotate` and `scale` properties, which are
  Baseline 2022. They compose without matrix decomposition and never fight a
  `transform` from author CSS. There's no skew, since it has no individual
  property.
- **CSS properties** take camelCase names; bare numbers mean px except for
  unitless properties. Custom properties are supported too, including
  GreeseUI tokens, so animating `--greese-color-accent` restyles every
  component.
- **Text** counts between numbers, types on or deletes, or retypes.
- **SVG attributes** the element already has (an attribute wins over a
  same-named CSS property), numeric element properties (`scrollTop`) and
  plain object properties are animated directly.
- **Mixing:**
  - numbers inside same-shaped strings interpolate (`blur(0px)` →
    `blur(8px)`), and a bare `0` borrows the other end's unit;
  - colours mix in OKLab (Pixels uses OKLCH; OKLab is cheaper and has no hue
    wrap-around);
  - anything else switches at the midpoint, except `none`/`hidden`, which
    yield to the shown value as CSS does for `display`.
- **Starting values** are read from computed style once per property; call
  `invalidate()` to re-read them.

### 4. API: GSAP's vocabulary, WAAPI's keyframes

- **From GSAP** come `to`, `from`, `fromTo`, `set`, `add`, `call`, labels,
  the position syntax (`'<'`, `'>-0.2'`, `'+=0.5'`, `'label+=1'`), `stagger`,
  and named eases (`power2.out`, `back.out(2)`, `elastic.out(a, p)`,
  `bounce`, `expo`…). GLOP's engine code ports directly. Times are in
  seconds.
- **From WAAPI** come the keyframe forms: frame arrays with `offset` and
  per-frame `ease`, or property lists such as `{ opacity: [0, 1] }`.
  `animate()` is the one-call form.
- **Controls:** `play`, `pause`, `resume`, `reverse`, `restart`, `seek`,
  `progress`, `time`, `timeScale`, `kill` (which restores the original
  values) and `invalidate`.
- **Awaiting:** a timeline is awaitable. It resolves with _no value_, because
  a thenable that resolves to itself is awaited again forever, and it
  resolves at once if it has already finished. The docs warn not to return a
  paused timeline from an `async` function; the e2e suite tripped over this
  with Playwright's `evaluate`.
- **Out of scope:** plugins, scroll-linked playback, motion paths, morphing
  and physics.

### 5. Reduced motion by default

With `prefers-reduced-motion: reduce`, a played timeline jumps to its end, so
the final state applies and only the movement is skipped.
`reducedMotion: 'ignore'` opts out, for motion that carries meaning.

### 6. `splitText` stays accessible

`splitText` splits text into one inline-block span per character, grouped per
word so lines wrap normally, or into words. The pieces are `aria-hidden`, and
the original sentence is kept once in a visually hidden span, so screen
readers read words, not letters.

## Consequences

- **Size (brotli):**
  - everything: 5.4 kB, with a 5.5 kB budget;
  - `animate`: 5 kB, with a 5.25 kB budget;
  - `ease` alone: 0.85 kB.
  - The timeline core is about 2.5 kB, value mixing (colours, units, text)
    1.3 kB, easing 0.9 kB and targets 0.9 kB.
  - For comparison, GSAP's core is about 27 kB.
- **GreeseUI's whole-library budget** is split in two: components only
  (20 kB, greese.js excluded) and with greese.js (26 kB). The cost stays
  visible either way.
- **Tests:**
  - Unit tests cover easing, mixing, sequencing, positions, keyframes,
    stagger, from-tweens, repeat/yoyo, nesting, kill, the real-clock ticker
    under fake timers, reduced motion, element writes and `splitText`.
  - The e2e suite (`e2e/motion.spec.ts`) checks computed-style reads,
    transform, colour and token writes, a component following an animated
    token, playback with reverse and time scale, and `splitText`
    accessibility in Chromium, Firefox, WebKit, Pixel 7 and iPhone.
  - Package verification proves greese.js imports and runs in Node without a
    DOM.
- **Docs:** the **Guides/Animation** guide and **Motion/greese.js** demos with
  play, pause, reverse, scrub and speed controls.
