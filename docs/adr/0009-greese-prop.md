# ADR 0009: The `greese` prop

- **Status:** Accepted
- **Date:** 2026-10-18
- **Implements:** the `greese` prop plan, phases 1–6 (summarised below)

## Context

Components needed simple, configurable motion through one prop, without:

- costing anything per render;
- breaking Server Components;
- flashing on first paint;
- ignoring reduced motion.

About half the components are server-component safe (Box, Stack, Text,
Button, Card…), so the prop can't simply add a client hook everywhere.

### The plan

| Phase | Scope                                                                                               |
| ----- | --------------------------------------------------------------------------------------------------- |
| 0     | Review of the plan and its open questions; this ADR                                                 |
| 1     | CSS presets (`enter`, `inView`, `stagger`) on the layout and text components                        |
| 2     | The prop on every component, with a check that none lacks it                                        |
| 3     | The runtime: registry, the `@greese/react/greese` opt-in, `hover`/`press`/`focus`, custom keyframes |
| 4     | Text effects (`type`, `count`, `split`) on Text and Heading                                         |
| 5     | Exits: `exit` on overlays; a decision on generic exit-on-unmount                                    |
| 6     | `fromPixels` and JSON presets                                                                       |

Its open questions, answered in the decisions below:

1. One `greese` prop, or separate `greeseIn` / `greeseHover` props? One
   (decision 1).
2. Stagger before hydration: together until hydrated, or an index rendered
   on the server? Moot, since CSS sets the index (decision 5).
3. Runtime loading: require the opt-in, or allow a lazy chunk? Lazy, with
   the opt-in (decision 3).
4. Is the preset set right, and should themes tune motion? Yes, through
   inherited CSS variables (decision 5).
5. Is `fromPixels` worth prioritising? Yes (decision 9).

## Decisions

### 1. One prop, three tiers

`greese` is one prop: an effect name or sequence (decision 10), or an options object (`enter`, `inView`,
`once`, `exit`, `hover`, `press`, `focus`, `text`, `duration`, `delay`,
`ease`, `distance`, `stagger`, `timeline`).

| Tier     | Covers                                                                             | How                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| CSS      | Entrance presets, stagger, overlay exits, CSS-expressible eases                    | `resolveGreese()`, a pure function run during render, returns classes and custom properties; `Motion.scss` does the rest  |
| Runtime  | Scroll reveals, hover/press/focus, text effects, keyframe entrances, non-CSS eases | `GreeseIsland` (a client component, rendered only when needed) wraps the root via Slot and hands it to `greeseRuntime.ts` |
| Timeline | `timeline: (tl, el) => …`                                                          | The runtime fills and plays a greese.js timeline                                                                          |

### 2. Server-safe by construction

`withGreese(element, greese)` is pure. Without a prop it returns the element
untouched. With CSS-only options it clones the element with classes and
variables, so Server Components render presets into the HTML. Only when the
runtime is needed does it add `GreeseIsland`, a client component. Functions
(`timeline`) can't cross from a Server Component to the client, and the docs
say so.

### 3. The runtime is a lazy chunk; an opt-in loads it up front

Components reach the runtime through `import('./greeseRuntime.ts')`, which
app bundlers split into its own chunk (about 6.4 kB with greese.js),
fetched the first time a prop needs it. `verify:packages` proves that a Vite
app rendering a plain Button never includes greese.js.

For JavaScript entrances on the first screen, `import '@greese/react/greese'`
puts the runtime in the main bundle: its promise is already resolved, so it
attaches in a microtask, before the first paint.

**Open question 3** (above) is answered this way: lazy by default, with
an opt-in. JavaScript entrances without the opt-in may start a moment late;
CSS presets never do.

### 4. Static cost: about 0.75 kB, shared once

The resolver plus the island add about 0.75 kB (brotli) to an app that uses
any GreeseUI component. It's shared, not per component.

- **Per-component budgets** rose by that amount: Button 1.25 → 2.25 kB,
  Dialog 2.5 → 3.25 kB, and so on. All components 20 → 22 kB.
- **CSS:** `greese-ui.css` rose to a budget of 18 kB, measured at 16.45 kB
  (the presets are about 0.7 kB).
- **How we measure:** size-limit doesn't split chunks, so `.size-limit.cjs`
  keeps the runtime external for component entries and measures it as its
  own entry.
- **What got cut first:** moving the ease and exit tables from JS into CSS
  (`--greese-ease-*` variables, `greese-Motion--exit-*` classes) took the
  resolver from 760 to 570 B.

### 5. CSS details

- **Layer:** presets live in `@layer greese.utilities`, behind
  `@media (prefers-reduced-motion: no-preference)`.
- **Fill mode:** `animation-fill-mode: backwards`. The first frame shows
  during a delay; afterwards the element's own styles apply again. With
  `both`, a dialog's enter animation would pin its open state, and its exit
  transition would never show.
- **Stagger** sets `--greese-motion-index` with one `sibling-index()` rule,
  or, where that's unsupported, `:nth-child` rules (up to 24) inside
  `@supports not`: no JavaScript, and it works on the server. (Changed
  2026-10-19: the `:nth-child` rules were tried against every element on
  every page; see ADR 0001's addendum.)
  **Open question 2** is therefore moot: server-rendered stagger works
  before hydration.
- **Defaults are `var()` fallbacks,** not declarations on `.greese-Motion`.
  So variables set on an ancestor or `:root` tune every preset beneath them
  (e2e-tested), and an inline option still wins. **Open question 4**
  (theme-tunable motion) is answered by these inherited variables, with no
  new theme API.
- **Overlay exits** feed `--greese-motion-exit-translate` and
  `--greese-motion-exit-scale` into the existing floating `enter-exit`
  transition. Drawers keep their slide.

### 6. Runtime behaviour

- **`inView`:** the island hides out-of-view elements before the first paint
  (`data-greese-view="pending"`). Elements already in view are left alone, so
  they never flash. An IntersectionObserver plays them at 15 % visibility.
  `once` defaults to `true`.
- **Interactions** are short paused timelines, played and reversed, so
  they're interruptible mid-way. Hover ignores touch pointers, so a tap never
  leaves a lift stuck.
- **Text effects** animate an `aria-hidden` copy while one visually hidden
  copy holds the real text. The original nodes come back when the effect
  ends, and they're skipped under reduced motion.
- **Reduced motion:** no interactions, no text effects, reveals shown at
  once, and timelines jump to their end.

### 7. Scope and enforcement

- **Who has the prop:** every exported component that draws something.
  Excluded: Slot, Slottable, VisuallyHidden, Break, Spacer, Show, Hide,
  ThemeProvider and Toaster.
- **Enforced by:** `src/test/greeseCoverage.ts`, a type-level check run by
  `check-types`, names any component missing the prop.
- **`<Motion>`** gives any element the prop.
- **`useGreese()`** ties greese.js to a component's lifetime (decision 11);
  `useTimeline()` is its one-timeline shortcut.

### 8. Exit animations on unmount: deferred

Generic exit-on-unmount needs a presence mechanism: keeping a removed
element mounted until its exit ends. That's React-tree surgery, against the
grain of a light library. For now, `exit` covers overlays, which already stay
in the DOM; anything else can run a timeline before removing state.

### 9. Pixels interop: `fromPixels` (open question 5)

Implemented in greese.js (ADR 0008 addendum), so designers can author motion
in Pixels Studio and play it through `greese={{ timeline: (tl, el) => tl.add(fromPixels(…)) }}`
or directly.

### 10. Effects: camelCase names, composition, custom definitions

- **Names are camelCase** (`fadeUp`, `scaleOut`), like the rest of the
  props. CSS class and keyframe names stay kebab-case (`greese-Motion--enter-fade-up`)
  because stylelint enforces it; the resolver converts.
- **Every named motion is an effect:** entrances, leaving effects
  (`fadeOut`, `fadeOutUp`, `fadeOutDown`, `scaleOut`, `blurOut`) and
  interactions share one table in the runtime, and any slot (`enter`,
  `inView`, `hover`, `press`, `focus`) takes any effect.
- **Composition is a string:** `+` plays effects together, `,` separates
  groups played in turn, a number is a pause. `'fadeIn+scaleIn,+2,fadeOut'`.
  A string stays serialisable, so Server Components can pass sequences, and
  it reads like the motion it describes. Typed as a template literal: a lone
  name must be a known effect, anything with `+` or `,` is a sequence.
- **Only a lone preset is CSS.** Sequences run in greese.js: CSS can't hold
  a later group's end state with `backwards` fill (decision 5), and chaining
  `animation` lists per element would duplicate the timeline model.
- **`defineGreeseEffect(name, effect)`** registers keyframes, a function of
  `{ el, distance, rtl }`, or keyframes with a default `duration`/`ease`. The
  registry is a `Map` in its own module, outside the lazy runtime, so
  defining effects never loads greese.js. Instance options win over an
  effect's defaults. A built-in's name stays the built-in's (amended by ADR
  0025: themes reassign effects, they don't rewrite them): a definition under
  it is never played. Names type-check through module augmentation of
  `GreeseEffectRegistry`.
- **Reduced motion** turns each effect in a sequence into a cut and drops the
  delay, but keeps pauses, so "show, wait, hide" still shows. With a
  `timeline` option the whole entrance jumps to its end as before.
- **Not for `exit`:** overlay exits stay CSS transitions with built-in names.
- **Cost:** the runtime chunk went from 6.46 to 6.85 kB (budget 7 kB): the
  parser, the leaving effects and the registry lookup. Each component's
  static part grew about 70 B (the preset check and the kebab conversion).
  No budget was raised.

### 10a. One definition of every effect (2026-10-21)

The built-in effects were once written out in the runtime, Motion.scss, the SCSS
kit, the React name types and Theme Studio, kept in step by tests, and had
drifted. They are defined once, in `packages/ui/src/effects/definitions.ts` (one module of `effects.ts`), with no `kind`
field:

- **Base effects** animate one property and take optional parameters (`start`,
  `end` and others, each defaulted). **Combo effects** are made of base effects,
  by name (so a typo fails to compile), each placed as a share of the combo.
- **Calls take arguments** in the sequence syntax: `fadeIn(0.25, 0.8)`,
  `fadeIn({ end: 0.8, duration: 1 })`, `fadeIn(end: 0.8)`. Positional arguments
  fill the effect's parameters, then `duration`, `offset` and `ease`, which
  every effect takes; a call's timing beats the instance's options.
- **CSS is derived, not declared.** `cssPlan()` reads the keyframes: ending at
  the resting state makes a preset (`@keyframes`), ending away from it makes an
  overlay exit (`translate` and `scale`). The build writes the built-ins' plans
  into `dist/_maps.scss`; Motion.scss and the kit's `effect()` write them with
  the same partial, so an effect Theme Studio defines gets the same CSS and
  works in `motion()`. An overlay's `exit` takes any effect: a built-in's is a
  class, one from `defineGreeseEffect()` is set inline by the runtime from the
  same plan. `GreesePreset`, `GreeseExit` and `GreeseInteraction` are
  gone: `exit` and the slots take any effect name.
- The resolver reads a generated names-only module (`dist/effect-classes.js`)
  so keyframes stay out of component bundles. Why TypeScript and not Sass as the
  source: the runtime and Studio need keyframes as data, and effects that end
  away from rest have no CSS preset.

### 11. `useGreese()`: greese.js in components

`useTimeline` had gaps for React use: it ran in `useEffect`
(a from-tween's end state flashed for a frame), it reverted only the one
timeline it returned (animations started in handlers leaked), and selector
strings matched the whole document.

- **Signature:** `useGreese(build?, dependencies | { scope, dependencies, revertOnUpdate })`, the familiar React shape of an effect with dependencies.
- **Timing:** the build runs in a layout effect (an effect on the server,
  where it never runs), so starting values apply before paint and refs are
  set.
- **Tracking without global state:** the build gets a context `g`
  (`timeline`, `animate`, `select`), and the hook returns the same helpers,
  stable across renders, for handlers. Whatever they make is recorded and
  reverted on unmount, newest first, so the oldest originals win. Recording
  through a global "current context" in greese.js was the alternative; doing
  it in the hook keeps greese.js free of React-shaped state. `contextSafe`
  wraps a handler so it receives the context.
- **Scope** is a greese.js feature, not a wrapper: `TimelineOptions.scope`
  makes a timeline resolve selector strings inside an element. `g` passes the
  ref's element when it creates a timeline. (A first version patched each
  timeline's `animate`/`fromTo` methods, which depended on how the others
  route internally.)
- **Updates:** by default the last build is paused, not reverted, so a
  rebuild reads current values and continues smoothly; `revertOnUpdate`
  reverts first. `useTimeline` is now `useGreese` with `revertOnUpdate`.
- **greese.js fix it exposed:** `kill()` only restored properties whose
  original value had been read, and with explicit keyframes it never was.
  Tracks now read the original before their first write.
- **Known trade-off:** animations started in handlers are kept until
  unmount so they can be reverted, so a long-lived component that animates
  on every click holds every one of those timelines.
- **Known limit:** reverting writes the original _computed_ value inline; it
  doesn't remove the inline style it added.

## Consequences

- **Tests:**
  - **Unit:** resolver output, server rendering of presets, class and style
    merging, overlay exits, `<Motion>`, hover and reverse, scroll reveal and
    `once`, the text count with its accessible copy, reduced motion, cleanup
    on unmount, `useTimeline`.
  - **e2e:** `e2e/greese-prop.spec.ts` covers computed animation names,
    stagger delays, ancestor tuning, scroll reveals, mouse vs touch hover,
    press, text effects, overlay enter and exit, and reduced motion, in five
    engines.
  - **Visual:** the suite runs with `prefers-reduced-motion: reduce`, so
    every story snapshots its final state. Existing baselines were unchanged.
- **Docs:** **Guides/Animation** (with GreeseUI), **Guides/greese.js**
  (standalone, every install form), and **Motion/greese prop** stories.

## Addendum (2026-10-19): reveals wait until an element is clear

Scroll reveals played at 15% visibility, so an element animated in while
mostly below the fold, cut off by the bottom edge. Now an `inView` element
reveals once it is wholly in view and clear of a band at the bottom (10% of
the viewport, as a root margin). One taller than half the viewport reveals
once it fills half of it. Near the end of a page, which may not scroll far
enough to clear the band, a second observer reveals an element once it is
wholly visible. The runtime budget rose 7.25 → 7.5 kB for it.
