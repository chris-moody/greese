# ADR 0008: greese.js, the animation library

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

greese ui needs animation that's simple, configurable and light, and that can
later power a `greese` prop on components (see
[ADR 0009](0009-greese-prop.md)). The codebase this work comes
from uses two systems:

- **A third-party tween library** in the game engine, used lightly: `to`,
  `fromTo` and kill-all-tweens-of-a-target, with named eases
  (`'elastic.out(1.2, 0.5)'`).
- **The Pixels timeline** (`@beta/ui/features/authoring`). Animation is data:
  per-layer keyframes on named numeric channels, tweens between adjacent keys,
  and `sampleTweenedRecord(timeline, frame)` returning every channel's value
  at any frame. Spans nest one timeline inside another through clamp, scale
  and loop. Colors mix in OKLCH. A single rAF clock drives the playhead.

The Pixels model is the useful intersection. Because sampling is a pure
function of time, seeking, reversing, time scaling and nesting are all just
choices of which time to sample.

## Decisions

### 1. A separate package, bundled with greese ui

The package is `@greese/js`, branded greese.js. The unscoped `greese.js`
name is taken on npm. It has no dependencies and no React; it works on any
element or object. `@greese/react` depends on it and re-exports `animate`,
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
  greese ui tokens, so animating `--greese-color-accent` restyles every
  component.
- **Text** counts between numbers, types on or deletes, or retypes.
- **SVG attributes** the element already has (an attribute wins over a
  same-named CSS property), numeric element properties (`scrollTop`) and
  plain object properties are animated directly.
- **Mixing:**
  - numbers inside same-shaped strings interpolate (`blur(0px)` →
    `blur(8px)`), and a bare `0` borrows the other end's unit;
  - numbers with different units (`16px` → `2rem`, `px` → `%`/`vw`) blend
    with `calc(a * (1 − t) + b * t)`, per number, so CSS converts them in
    the right context. There's no measuring or reflow, and it's exact at
    both ends. (Added after the animating-tokens demo snapped from `16px`
    to `2rem` halfway.)
  - colors mix in OKLab (Pixels uses OKLCH; OKLab is cheaper and has no hue
    wrap-around);
  - anything else switches at the midpoint, except `none`/`hidden`, which
    yield to the shown value as CSS does for `display`.
- **Starting values** are read from computed style once per property; call
  `invalidate()` to re-read them.

### 4. API: the engine's tween vocabulary, WAAPI's keyframes

- **From the engine's tween code** come `to`, `from`, `fromTo`, `set`, `add`, `call`, labels,
  the position syntax (`'<'`, `'>-0.2'`, `'+=0.5'`, `'label+=1'`), `stagger`,
  and named eases (`power2.out`, `back.out(2)`, `elastic.out(a, p)`,
  `bounce`, `expo`…). Existing engine code ports directly. Times are in
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
readers read words, not letters. (Since the 2026-11-02 addendum it splits
each text node where it is, keeping markup.)

## Consequences

- **Size (brotli):**
  - everything: 5.4 kB, with a 5.5 kB budget (5.9 kB and 6.5 kB after the
    addendum below);
  - `animate`: 5 kB, with a 5.25 kB budget;
  - `ease` alone: 0.85 kB.
  - The timeline core is about 2.5 kB, value mixing (colors, units, text)
    1.3 kB, easing 0.9 kB and targets 0.9 kB.
- **greese ui's whole-library budget** is split in two: components only
  (20 kB, greese.js excluded) and with greese.js (26 kB). The cost stays
  visible either way.
- **Tests:**
  - Unit tests cover easing, mixing, sequencing, positions, keyframes,
    stagger, from-tweens, repeat/yoyo, nesting, kill, the real-clock ticker
    under fake timers, reduced motion, element writes and `splitText`.
  - The e2e suite (`e2e/motion.spec.ts`) checks computed-style reads,
    transform, color and token writes, a component following an animated
    token, playback with reverse and time scale, and `splitText`
    accessibility in Chromium, Firefox, WebKit, Pixel 7 and iPhone.
  - Package verification proves greese.js imports and runs in Node without a
    DOM.
- **Docs:** the **Guides/Animation** guide and **Motion/greese.js** demos with
  play, pause, reverse, scrub and speed controls.

## Addendum (2026-10-18): `fromPixels` and a `<script>` build

- **`fromPixels(animation, targets, options)`** turns Pixels layer
  timelines into one greese.js timeline:
  - frames become seconds at the document's fps;
  - channels map `rotation` → `rotate` (shortest arc, as in Pixels' angle
    mode) and `alpha` → `opacity`, and any channel can be renamed;
  - tween types become eases (`steps(1)` for holds and `step`; real
    elastic, bounce and back curves where Pixels' own renderer plays linear);
  - spans aren't read.

  It's structurally typed, so Pixels documents pass straight in, with no
  dependency on their editor. It adds about 0.5 kB, tree-shaken away when unused.

- **`dist/greese.global.js`** is an esbuild IIFE that defines
  `window.greese`, for pages with no bundler. It's exported as
  `@greese/js/global` and is the `unpkg`/`jsdelivr` default.
  - Size: 6.3 kB, with a 6.75 kB budget.
  - `verify:packages` runs it in a bare VM context.
- **Budgets:**
  - everything: 6.5 kB (measured 5.9 kB);
  - `animate`: unchanged at 5 kB.

## Addendum (2026-10-19): writes wait for reads, and `batch()`

The greese ui homepage profiled at hundreds of milliseconds of main-thread
work starting a few dozen animations. `transformParts`, which reads computed
style, accounted for most of it. Writes went out as each track was sampled,
so every later computed-style read forced a style recalculation.

- **Within a timeline,** the element adapter now holds style writes until
  `flush()`, as it already did for transforms. A render reads every starting
  value before it writes anything.
- **Across timelines,** `batch(fn)` queues every adapter's flush until `fn`
  returns. The ticker renders each frame inside one batch, and the `greese`
  prop's runtime attaches a commit's elements inside one. Reads made inside a
  batch (in `onUpdate`, say) see values from before it.
- **Selector scope:** `TimelineOptions.scope` resolves selector strings
  inside an element (used by `useGreese`, ADR 0009 decision 11).
- **`kill()` restores explicit keyframes:** tracks read their original value
  before their first write, even when every keyframe is given.
- **Cost:** greese.js "everything" went from 6.04 to 6.1 kB (budget 6.5 kB).
  The `greese` prop's lazy runtime went from 6.98 to 7.08 kB, over its 7 kB
  budget, which was raised to 7.25 kB for this change.
- **Amended 2026-10-24: restoring and repeating correctly.** `kill()` wrote
  each property's computed value back inline, which then beat the element's
  own CSS (a `:hover` rule, a class); adapters now remember the inline style
  or attribute from before their first write and put exactly that back,
  removing what wasn't there. Callbacks fired twice per repeat, since a
  play-through starting over read as a step back; they're now checked per
  play-through. `seek()` to a label that doesn't exist throws. Cost:
  `animate` 5.18 → 5.47 kB and the `<script>` build 6.48 → 6.77 kB, over
  their budgets, raised to 5.5 and 6.85 kB for this change.
- **Amended 2026-10-24: computed colors.** Browsers compute `color-mix()` and
  the newer color spaces to `oklab()`, `oklch()` and `color(srgb …)`, which
  `parseColor` didn't read, so an animation from a greese ui token (built
  with `color-mix(in oklab, …)`) switched halfway instead of blending. It
  reads them now (other `color()` spaces still switch). Cost: everything
  6.42 → 6.52 kB, `animate` 5.49 → 5.61 kB and the `<script>` build 6.8 →
  6.9 kB; budgets raised to 6.55, 5.65 and 6.9 kB.
- **Measured gain, honestly:** on the homepage's first screen, these changes
  cut layouts during load from 194 to 94 and style recalculations from 338
  to 160. The time inside the forced first style calculation fell by about
  a fifth (130 → 107 ms at 4× CPU throttling). That first calculation is
  inherent, so most of the blocking-time win came from the finding below.

A finding for apps rather than the library: on the homepage, loading the
`greese` prop's runtime up front (`@greese/react/greese`) moved the page's
first full style calculation into a JavaScript task, which counted as
blocking time. Animating the first screen with CSS presets and letting the
runtime load lazily took Lighthouse's Total Blocking Time to 20 ms.

## Addendum (2026-10-26): values per target, and CSS's cubic-bezier()

The site's footer logo loops dozens of particles, each with its own drift and
moment, and sweeps its sparkles across in order of position, at the pace and
ease of the motion theme being worn. Both were one `animate()` call per
target, and the theme's ease, a CSS `cubic-bezier()` string, wasn't one
greese.js read.

- **Per-target values (`PerTarget`).** Any keyframe value, in `to`, `from`,
  `fromTo`, `set` and `animate`, may be a function
  `(index, target, targets) => value`. It's called once per target as the
  animation is built, never while it plays, so rendering stays a pure
  function of time. The engine code it ports from has the same form.
- **Function staggers.** `stagger` also takes a `PerTarget<number>`: each
  target's own offset, such as one ordered by position.
- **`cubic-bezier()` strings** are eases, as easing tokens, motion themes and
  computed styles write them, beside the bézier arrays.
- **Typing:** `Keyframe` and `Vars` no longer list `EaseFn` in their index
  signatures. An ease function is already a `PerTarget` (it takes fewer
  parameters), and listing two function types left a value function's
  parameters untyped. In the property-list form of `Keyframes`, a function
  goes inside the list (`{ y: [0, (i) => …] }`): allowed alone, it made
  `{ keyframes: (ctx) => … }` (a `defineGreeseEffect` definition) read as
  keyframes too, and the definition's `ctx` lost its type.
- **Cost:** everything 6.52 → 6.59 kB, `animate` 5.61 → 5.67 kB, `ease`
  847 → 879 B and the `<script>` build 6.9 → 6.98 kB; budgets raised to 6.6,
  5.7 and 7 kB. In `@greese/react`, the whole library with greese.js
  34.22 → 34.38 kB, `useGreese` 5.97 → 6.05 kB and the `greese` prop's lazy
  runtime 10.85 → 10.91 kB; budgets raised to 34.4, 6.1 and 10.95 kB.

## Addendum (2026-11-02): text nodes, not textContent

`text` wrote `textContent`, and `splitText` rebuilt the element from its
`textContent`, so both flattened whatever markup was inside: a link in a
typed sentence stopped being a link, and the `greese` prop's text effects
skipped any element with children. Text is animated in the element's text
nodes now.

- **`text` writes into the text nodes,** in reading order, each filled up to
  its own length before the next; the last takes any overflow. Typing on or
  deleting reveals the markup as it goes (`Type <em>emph</em>`), and the
  original text lands back in the same nodes. Lengths are measured before
  the first write and again only when the nodes are replaced (half-typed
  lengths would be wrong). An element with no text nodes gets `textContent`,
  as before. A value of another shape is laid over the same lengths, so a
  count belongs on the element holding the number, not its paragraph.
- **`splitText` splits each text node where it is.** Links, emphasis and
  code stay the same elements, their pieces inside them; the visually hidden
  copy is kept per text node, beside its pieces, so a link's accessible name
  is its own text and it stays focusable and clickable while split.
  Whitespace-only nodes are left alone. `revert()` puts back the original
  nodes themselves.
- **The `greese` prop's `type` and `split`** take content with markup.
  `type` types into a copy that's `inert` as well as `aria-hidden`, so the
  copy's links can't take focus while it plays; the real nodes come back at
  the end. `count` still takes a plain number.
- **Not done:** `Text` nodes as targets of their own (`animate(node, …)`).
  Targeting the element covers it without a second adapter.
- **Underlines.** A link's underline doesn't propagate into inline blocks, so
  each piece, and the wrappers around it, take `text-decoration: inherit`: a
  split link is still underlined. A decoration from further up (a paragraph
  that underlines everything) still stops at the pieces.
- **Cost:** everything 6.7 → 6.86 kB, `animate` 5.78 → 5.89 kB and the
  `<script>` build 7.08 → 7.27 kB; budgets raised to 6.9, 5.95 and 7.3 kB. In
  `@greese/react`, the whole library with greese.js 39.99 → 40.17 kB,
  `useGreese` 6.11 → 6.24 kB, the `greese` prop's lazy runtime 11.21 →
  11.39 kB and the library with svg 50.04 → 50.13 kB; budgets raised to
  40.2, 6.3, 11.4 and 50.2 kB.
- **Tests:** `src/greese.test.ts` (typing into markup, splitting around a
  link, an empty element), `src/components/motion.test.tsx` (`type` and
  `split` with a link) and `e2e/motion.spec.ts` (a split link still named
  and clickable, typing order, in five browsers). Demos: the `Text in markup`
  story (greese.js) and `Text with markup` (the `greese` prop).

## Addendum (2026-11-03): taking a target back, and `delay`

Porting an app off GSAP found two gaps. Both are about the one-call `animate()`
and about code that doesn't hold the timeline it needs to affect.

**`killTweensOf(targets, scope?)`** stops every animation on a target, wherever
it was started, and leaves its properties where they are; the target's neighbours in those
timelines keep running. `Timeline.kill()` already stopped a timeline you hold a
reference to; this stops whatever is animating a target you hold a reference to,
which is the case that comes up in a game loop: a sprite is already recoiling
when the next hit lands, a particle goes back to its pool mid-tween, an element
is animated again from another module.

**A `WeakMap` keyed by the target, not a list of timelines.** `Timeline` already
keys its tracks by target, so registration is two lines where a track is first
made for one. The alternatives were worse:

- a global `Set` of every timeline would grow without bound, since timelines are
  made constantly and most finish in under a second;
- a registry filled only once someone asks would miss every animation already
  running, which is exactly the case the feature exists for.

The WeakMap entry dies with its target, so animating thousands of short-lived
objects leaks nothing. While a target is alive, the timelines animating it stay
alive with it — the same trade every library with this feature makes, and the
reason the registry holds timelines rather than closures (one entry per
target-and-timeline either way, but closures would also capture their props
map).

Two entry points, deliberately: the free function reaches every timeline through
the registry, including nested ones, since a nested timeline owns its own tracks
and registers itself. The method (`tl.killTweensOf(o)`) is scoped to one
timeline and recurses into its children, for code that does hold the timeline
and means "this one only".

**`delay`** on `AnimateOptions`. A timeline's `Position` already expresses this
and more (`'+=0.5'`, `'<0.2'`, a label), so `delay` is for `animate()`, which
has no timeline to position against — and for a reader coming from a library
where `delay` is the only way to say it. It shifts the whole segment, so
`#placed` records the delayed start and a later `'<'`/`'>'` follows it.

- **Cost:** everything 6.9 → 7.03 kB, `animate` 5.95 → 6.03 kB and the
  `<script>` build 7.3 → 7.44 kB; budgets raised to 7.1, 6.1 and 7.5 kB. The
  registry is written from `Timeline`'s own bookkeeping, so `{ animate }` pays
  the 77 B whether it calls `killTweensOf` or not. In `@greese/react`, the whole
  library with greese.js 40.28 → 40.38 kB, `useGreese` 6.3 → 6.37 kB, the
  `greese` prop's lazy runtime 11.4 → 11.54 kB and the library with svg
  50.25 → 50.41 kB; budgets raised to 40.5, 6.5, 11.6 and 50.5 kB. The motion
  `scope` chunk is unchanged, carrying no greese.js.
- **Tests:** nine in `src/greese.test.ts` — a delay shifting a one-call
  animation and a later relative position; and for `killTweensOf`: one target
  restored while its neighbour keeps animating, every timeline animating a
  target reached, a nested timeline reached, 0 and no effect for an unanimated
  target, idempotence, selectors with the timeline keeping its other elements,
  and the method leaving other timelines alone.

## Addendum (2026-11-04): killing leaves values in place

`kill()` and `killTweensOf()` now stop an animation **without** restoring the
properties it wrote, which is what GSAP does and what a game loop wants: a
sprite killed mid-squash should not snap back before the next animation takes
over. The old behavior (put everything back, remove added inline styles) is
`Timeline.revert()`, and the React runtime (`Motion`, `useGreese`) uses it for
its own cleanups, where leaving no trace on unmount is the point.
