# @greese/js

## 0.2.0

### Minor Changes

- d01af8c: - **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles). It shows the slide it opens on from the first paint, with no transition, so a page that renders the slide its route names (`defaultIndex`, or a controlled `index` that follows the route, writing the address in `onIndexChange`) deep-links to it, server-rendered or not. Its own controls and dots: `controls` and `indicators` also take a node that uses **CarouselPrevious**, **CarouselNext** and **CarouselIndicator**, each a named button or, with `asChild`, your element (a router link) with the wiring, `aria-disabled` at the end, and its own look. Every name it reads out can be translated: `previousLabel`, `nextLabel`, `slideLabel` and `indicatorLabel`. `announce={false}` quiets the viewport for a page that announces slide changes itself.
  - **ScrollCarousel** is the scroll-snapping carousel: slides in a row, several in view. It runs vertically with `orientation="vertical"` (`ScrollCarouselOrientation`). A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
  - **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code, and `MOTION_ATTR` from `@greese/ui` names the attribute.
  - **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name (`varsStyle`, `SvgVars` and `VarsProps` for your own).
  - Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
  - `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
  - `@greese/ui/style-manifest.json` is version 4: per block, each class's parent and the properties its rules set (`classes`), each state attribute's classes (`states`), and each variable's default, setters, the properties it ends up in and its type (`variableInfo`). Existing fields are unchanged.
  - **@greese/mcp** knows the new Carousel, ScrollCarousel's orientation, ThemeProvider's `motion` and the svg styling.
- 4242aa1: Add editor playback to timelines (ADR 0036): `fps` draws only whole frames while time stays in seconds, `bounds(start, end, { loop })` plays between two times or labels and loops there carrying the overshoot, and `ticker: false` lets a host's own clock advance a playing timeline with `tick(dt)`.
- efb19d8: Add `tweenEase` and `tweenEaseName`: an editor tween's named curve (`easeOut`, `back`, `stepped`, a bézier) as a greese.js ease, with CSS's keyword curves for Pixels (ADR 0040). `fromPixels` uses it, so a Pixels `back` tween is now `back.in`, as every Glop studio draws it.
- f472d19: `Timeline.kill()` and `killTweensOf()` now stop **in place**: animated
  properties keep the value they have, as in GSAP. The old put-everything-back
  behavior is the new `Timeline.revert()`, which `Motion` and `useGreese` now use
  for their cleanups so unmounting still leaves no inline styles behind.
- 6b2da3f: - **`killTweensOf(targets, scope?)`** stops every animation on a target,
  wherever it was started, leaving its properties where they are. Other targets in the
  same timelines keep running. Use it where something else is about to take a
  property over, so two animations don't fight: a new hit reaction on a sprite
  already recoiling, a particle returning to its pool, an element animated
  again from somewhere else in the code. A timeline has the method too
  (`tl.killTweensOf(o)`), scoped to itself and its children, as the counterpart
  to `kill()`: that stops a timeline you hold, this stops whatever is animating
  a target you hold.

  Targets are found through a `WeakMap` keyed by the target, so the entry goes
  when the target does — safe for the thousands of short-lived objects a game or
  particle system animates. While a target is alive the timelines animating it
  stay alive with it, which is the trade every library with this feature makes.

  - **`delay`** on `AnimateOptions`: seconds to wait before an animation starts.
    On a timeline a `Position` says this and more, so it is for the one-call
    `animate()`, where there is no timeline to position against. It shifts the
    whole segment, so a later `'<'` or `'>'` follows the delayed start.

  - **Budgets raised deliberately** for these: `everything` 6.9 → 7.1 kB,
    `animate` 5.95 → 6.1 kB, the `<script>` build 7.3 → 7.5 kB. The registry is
    written from `Timeline`'s own track bookkeeping, so `{ animate }` pays for it
    (77 B brotli) whether or not it calls `killTweensOf`. That is the cost of the
    feature being reliable: a registry only filled on demand would miss the
    animations started before anyone asked.

- 5c2774b: Animate the text nodes of the elements you target, keeping their markup.

  - greese.js's `text` writes into an element's text nodes in reading order, each up to its own length, so typing into `Read <a>the docs</a>` keeps the link and reveals it as it goes. An element with no text nodes still gets `textContent`.
  - `splitText` splits each text node where it is: links, emphasis and code stay the same elements, with their pieces inside, still focusable and clickable. Each text node's text is kept once, visually hidden, for screen readers. `revert()` puts the original nodes back.
  - The `greese` prop's `text: 'type'` and `text: 'split'` now work on content with markup; `type` plays on an inert, aria-hidden copy. `text: 'count'` still takes a plain number.

### Patch Changes

- d914054: A smaller check for `fps`: the same rule (a positive, finite rate snaps; anything else draws every instant), fewer bytes.
- 8a8dca5: Fire a cue on a looping timeline's in or out point every lap, call `onUpdate` once per tick across a wrap, and ignore an `fps` that isn't a positive number.

## 0.1.0

### Minor Changes

- cd9d411: Faster starts for many animations at once. greese.js holds every style write until its timeline has read its starting values, and adds `batch(fn)` to hold writes across timelines (the ticker batches each frame). The `greese` prop attaches each commit's elements in one batch, checks their positions together and reads RTL from the `dir` attribute, instead of forcing a style recalculation per element. An `inView` text effect on an element already in view now leaves its text alone; before, it showed the effect's first frame (a count stuck at `0`).
- cf0aa77: Add greese.js: keyframe and timeline animation for CSS properties, individual transforms, custom properties, text, SVG attributes and plain objects, with seek, reverse, time scale, repeat, yoyo, nesting, stagger, `splitText` and reduced-motion support.
- 6b77493: Keyframe values and `stagger` can be functions of each target (`(index, target, targets) => value`), worked out as the animation is built; CSS `cubic-bezier()` strings work as eases.
- 46c6b6a: Add `fromPixels`, which plays Pixels animations (layer keyframes and tweens) as a greese.js timeline, and a `<script>` build, `dist/greese.global.js` (also `@greese/js/global`, and the unpkg/jsDelivr default), which defines `window.greese`.

### Patch Changes

- 628bd6b: **Colors from `color-mix()` and the newer color spaces blend.** `parseColor` (and so `mix` and every tween) reads `oklab()`, `oklch()` and `color(srgb …)`, which browsers compute `color-mix()` and those spaces to, so animating from or to such a color (every greese ui token built with `color-mix`) blends instead of switching halfway. A `color()` in another space (`display-p3`…) still switches halfway.
- 6562ec0: - **`kill()` puts elements back as they were:** it removes the inline styles and attributes a timeline added, and restores ones that were already there, instead of writing each property's computed value inline, where it overrode the element's own CSS (a `:hover` rule, a class added later).
  - **Callbacks fire once per play-through:** with `repeat`, a callback added with `call()` fired again whenever a repeat started over. With `yoyo` it still fires on the way there and on the way back.
  - **`invalidate()` re-reads transforms** set on the element since, instead of composing stale ones.
  - **`seek()` to a label that doesn't exist throws**, instead of quietly adding it at the end. Positions in `to()`, `add()` and the rest still create a label they name.
- 7e6ba00: **greese.js doesn't rewrite a style or attribute that's already at its value.** A target holding still mid-timeline (between staggers, in a hold, a repeat's rest) cost a style change and a DOM mutation every frame; now it costs nothing, which also keeps devtools' Elements panel responsive while a loop runs.
- b9bb6d3: Interpolate between different units instead of snapping halfway: `16px` → `2rem`, `0px` → `50%`, `100px` → `50vw` and `200ms` → `1s` now blend smoothly through `calc()`, per number, so the browser converts them exactly where the value is used.
- 0cb3cbf: Add `useGreese()`, greese.js tied to a component's lifetime: the build runs before paint with refs set, selector strings are scoped to a ref, dependencies re-run it (pausing or, with `revertOnUpdate`, reverting the last build), and everything made through it, including animations started in handlers, is reverted on unmount. `useTimeline()` now builds on it, so it also applies before paint. greese.js: timelines take a `scope` option (selector strings match inside that element), and `kill()` now restores properties animated with explicit keyframes or `fromTo`, whose originals were previously never read.
