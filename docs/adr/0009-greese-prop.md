# ADR 0009: The `greese` prop

- **Status:** Accepted
- **Date:** 2026-10-18
- **Implements:** [GREESE_PROP_PLAN.md](../plans/GREESE_PROP_PLAN.md), phases 1–6

## Context

Components needed simple, configurable motion through one prop, without:
- costing anything per render;
- breaking Server Components;
- flashing on first paint;
- ignoring reduced motion.

About half the components are server-component safe (Box, Stack, Text,
Button, Card…), so the prop can't simply add a client hook everywhere.

## Decisions

### 1. One prop, three tiers

`greese` is one prop: a preset name, or an options object (`enter`, `inView`,
`once`, `exit`, `hover`, `press`, `focus`, `text`, `duration`, `delay`,
`ease`, `distance`, `stagger`, `timeline`).

| Tier | Covers | How |
|---|---|---|
| CSS | Entrance presets, stagger, overlay exits, CSS-expressible eases | `resolveGreese()`, a pure function run during render, returns classes and custom properties; `Motion.scss` does the rest |
| Runtime | Scroll reveals, hover/press/focus, text effects, keyframe entrances, non-CSS eases | `GreeseIsland` (a client component, rendered only when needed) wraps the root via Slot and hands it to `greeseRuntime.ts` |
| Timeline | `timeline: (tl, el) => …` | The runtime fills and plays a greese.js timeline |

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

For JavaScript entrances on the first screen, `import '@greese-ui/react/greese'`
puts the runtime in the main bundle: its promise is already resolved, so it
attaches in a microtask, before the first paint.

**Open question 3** in the plan is answered this way: lazy by default, with
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
- **Stagger** uses `:nth-child` rules (up to 24) to set
  `--greese-motion-index`: no JavaScript, and it works on the server.
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
- **`useTimeline()`** ties a greese.js timeline to a component's lifetime.

### 8. Exit animations on unmount: deferred

Generic exit-on-unmount needs a presence mechanism: keeping a removed
element mounted until its exit ends. That's React-tree surgery, against the
grain of a light library. For now, `exit` covers overlays, which already stay
in the DOM; anything else can run a timeline before removing state.

### 9. Pixels interop: `fromPixels` (open question 5)

Implemented in greese.js (ADR 0008 addendum), so designers can author motion
in Pixels Studio and play it through `greese={{ timeline: (tl, el) => tl.add(fromPixels(…)) }}`
or directly.

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
