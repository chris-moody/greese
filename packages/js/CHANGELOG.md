# @greese/js

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
