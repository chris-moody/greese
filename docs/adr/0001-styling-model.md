# ADR 0001: Styling model — static CSS plus custom properties

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

SauceUI must support dynamic, per-breakpoint props, in the style of MUI's
`<Stack direction={{ xs: 'column', md: 'row' }} />`. It must do this without
the runtime cost of CSS-in-JS. Emotion-style libraries serialise style
objects, hash them and insert rules on every render. Inserting a rule
invalidates styles across the whole document, which hurts TBT, INP and LCP.

## Decision

All CSS is compiled from SCSS at build time. At runtime, components only:

1. **Toggle classes.** Every finite value (variants, sizes, enum props, scale
   tokens) has a pre-generated class.
2. **Set inline custom properties.** These carry open-ended values such as
   `gap="13px"` or `columns={7}`.

Neither creates a rule, so the browser restyles only the affected element.

### Responsive props: one mechanism for every prop

The `responsive-prop` SCSS mixin and `resolveResponsive()` in TS share one
naming scheme:

| Piece | Name |
|---|---|
| "Uses" class, added whenever the prop is set | `.sauce-Stack--gap` |
| Per-breakpoint variable | `--sauce-stack-gap-md` (lower-cased block, prop, breakpoint) |
| Token class | `.sauce-Stack--md-gap-2` |

For each prop, the mixin emits four things:

- **Registration.** Each breakpoint variable is registered with
  `@property { syntax: '*'; inherits: false }`. A nested Stack never sees its
  parent's values, and changing a value never forces descendants to restyle.
- **A fallback chain on the uses class.** Each breakpoint's media query reads
  `var(--…-md, var(--…-sm, var(--…-xs)))`, so an unset breakpoint inherits the
  nearest smaller one, as in MUI. Because the chain sits on the uses class and
  not the component's base class, **a prop that isn't set costs the element
  nothing** and never overrides its defaults. Phase 2's e2e tests check that a
  Container with only `mt` keeps its gutter.
- **Token classes.** Each one sets the *variable*, never the property. If a
  class set the property directly, the chain at a larger breakpoint would
  override it.
- **Container-query variants (optional).** With `$container-scope`, the same
  chain is also emitted under `@container` for elements inside that scope, at
  higher specificity, so it wins there. GridItem uses this inside a
  `<Grid container>`.

`resolveResponsive()` adds the uses class, then for each `{ bp: value }` adds
a token class or an inline variable. It is a pure function that loops over at
most five breakpoints per prop.

**Classes or inline variables?** The props that define a component (Stack
`direction`/`gap`, Grid `columns`, GridItem `span`) get token classes, so the
common case adds no inline style. Box's fourteen spacing props would need
about 600 classes, so they always go inline as `var(--sauce-space-N)` values.
That stays themeable and keeps the CSS small. Style props live in
`@layer sauce.utilities`, so they beat a component's own styles regardless of
source order.

The plan originally had a second mixin, `responsive-variant()`, which would
have emitted media-query classes for enum props. We dropped it. Enum props use
the same variable chain, with every value treated as a token, so there is one
mechanism to learn, test and debug.

### Benchmark (Phase 2 exit)

`npm run bench -w playground` renders 2,000 responsive Stacks (400 cards × 5)
against an equivalent MUI 9.4 page (`spacing` + `useFlexGap`, `sx` for
alignment, since MUI 9 dropped Stack's system props). It uses production
builds, Chromium at 4× CPU throttle, and reports medians of 5 interleaved
runs. The results on the development machine (2026-10-17):

| Metric | SauceUI | MUI | MUI / SauceUI |
|---|---:|---:|---:|
| Render to first paint | 375 ms | 450 ms | 1.2× |
| Main-thread script (load) | 202 ms | 437 ms | 2.2× |
| Style recalculation (load) | 29.6 ms | 21.1 ms | 0.7× |
| Update: click to paint | 105 ms | 242 ms | 2.3× |
| Update: script per toggle | 57.5 ms | 200 ms | 3.5× |
| Update: style recalc per toggle | 18.0 ms | 13.9 ms | 0.8× |
| Longest interaction (INP basis) | 200 ms | 344 ms | 1.7× |
| `<style>` elements injected | 0 | 1 | |

The thesis holds: scripting, which is what CSS-in-JS costs, is 2–3.5× lower,
and interactions are about 2× faster end to end. Style recalculation is the
honest trade-off. Each element matches a few small rules, where Emotion
collapses identical styles into one class. Registering the variables as
non-inheriting cut update recalc from 29 ms to 18 ms. The gap left is around
5–8 ms across 2,000 elements, against 140+ ms saved in script.

### Breakpoints

Breakpoints are compile-time constants, because media queries cannot read
custom properties. They are defined once, in `@sauce-ui/tokens`, and emitted
both as the SCSS `$breakpoints` map and as TS constants (`useBreakpoint` uses
the TS ones). `src/styles/mixins.test.ts` compiles the mixin and checks that
every class `resolveResponsive` can produce exists in the CSS, so the two
sides can't drift.

### Cascade layers

Every stylesheet SauceUI emits starts with the same statement:

`@layer sauce.reset, sauce.tokens, sauce.theme, sauce.base, sauce.components, sauce.utilities`

That covers the tokens CSS, components, base and runtime themes. Any unlayered
consumer CSS overrides all of them without `!important`. Repeating the
statement in each sheet keeps the order fixed regardless of which sheet loads
first.

### Global styles are opt-in

`styles.css` only styles `.sauce-*` classes and the token variables.
`base.css` contains the reset, `body` colours and the focus ring, and is
imported only when SauceUI owns the page.

## Consequences

- No style work on the main thread during render; the styling path is a
  string concat. The whole library is about 4 kB of JS and 5 kB of CSS
  (brotli). Importing only `Stack` costs 1.2 kB, which shows tree-shaking
  works.
- `@property`, container queries and cascade layers are Baseline 2024. The
  e2e suite runs in Chromium, Firefox and WebKit to prove it.
- Every token value × breakpoint becomes a class. Size budgets
  (`.size-limit.json`) keep this in check. Only props that need it are
  responsive.
- Custom breakpoints require recompiling the SCSS (planned for Phase 6).
- There is no general-purpose `sx` prop. Typed style props on layout
  primitives cover the common cases.
