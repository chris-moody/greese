# ADR 0001: Styling model — static CSS plus custom properties

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

GreeseUI must support dynamic, per-breakpoint props, in the style of MUI's
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

| Piece                                        | Name                                                          |
| -------------------------------------------- | ------------------------------------------------------------- |
| "Uses" class, added whenever the prop is set | `.greese-Stack--gap`                                          |
| Per-breakpoint variable                      | `--greese-stack-gap-md` (lower-cased block, prop, breakpoint) |
| Token class                                  | `.greese-Stack--md-gap-2`                                     |

For each prop, the mixin emits four things:

- **Registration.** Each breakpoint variable is registered with
  `@property { syntax: '*'; inherits: false }`. A nested Stack never sees its
  parent's values, and changing a value never forces descendants to restyle.
- **A fallback chain on the uses class.** Each breakpoint's media query reads
  `var(--…-md, var(--…-sm, var(--…-xs)))`, so an unset breakpoint inherits the
  nearest smaller one, as in MUI. Because the chain sits on the uses class and
  not the component's base class, **a prop that isn't set costs the element
  nothing** and never overrides its defaults. [Phase 2](0013-project-scope-and-phases.md#phases)'s e2e tests check that a
  Container with only `mt` keeps its gutter.
- **Token classes.** Each one sets the _variable_, never the property. If a
  class set the property directly, the chain at a larger breakpoint would
  override it.
- **Container-query variants (optional).** With `$container-scope`, the same
  chain is also emitted under `@container` for elements inside that scope, at
  higher specificity, so it wins there. GridItem used this inside a
  `<Grid container>`; since 2026-10-19 a cell's `size` does, inside
  `<Grid container containerQueries>` (ADR 0011 addendum).

`resolveResponsive()` adds the uses class, then for each `{ bp: value }` adds
a token class or an inline variable. It is a pure function that loops over at
most five breakpoints per prop.

**Classes or inline variables?** The props that define a component (Stack
`direction`/`gap`, Grid `columns`, GridItem `span`; since 2026-10-19 Grid's
`size`, see ADR 0011) get token classes, so the
common case adds no inline style. Box's fourteen spacing props would need
about 600 classes, so they always go inline as `var(--greese-space-N)` values.
That stays themeable and keeps the CSS small. Style props live in
`@layer greese.utilities`, so they beat a component's own styles regardless of
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

| Metric                          | GreeseUI |     MUI | MUI / GreeseUI |
| ------------------------------- | -------: | ------: | -------------: |
| Render to first paint           |   375 ms |  450 ms |           1.2× |
| Main-thread script (load)       |   202 ms |  437 ms |           2.2× |
| Style recalculation (load)      |  29.6 ms | 21.1 ms |           0.7× |
| Update: click to paint          |   105 ms |  242 ms |           2.3× |
| Update: script per toggle       |  57.5 ms |  200 ms |           3.5× |
| Update: style recalc per toggle |  18.0 ms | 13.9 ms |           0.8× |
| Longest interaction (INP basis) |   200 ms |  344 ms |           1.7× |
| `<style>` elements injected     |        0 |       1 |                |

The thesis holds: scripting, which is what CSS-in-JS costs, is 2–3.5× lower,
and interactions are about 2× faster end to end. Style recalculation is the
honest trade-off. Each element matches a few small rules, where Emotion
collapses identical styles into one class. Registering the variables as
non-inheriting cut update recalc from 29 ms to 18 ms. The gap left is around
5–8 ms across 2,000 elements, against 140+ ms saved in script.

### Breakpoints

Breakpoints are compile-time constants, because media queries cannot read
custom properties. They are defined once, in `@greese/ui`, and emitted
both as the SCSS `$breakpoints` map and as TS constants (`useBreakpoint` uses
the TS ones). `packages/react/src/utils/responsiveMixin.test.ts` compiles the mixin and checks that
every class `resolveResponsive` can produce exists in the CSS, so the two
sides can't drift.

### Cascade layers

Every stylesheet GreeseUI emits starts with the same statement:

`@layer greese.reset, greese.tokens, greese.theme, greese.base, greese.components, greese.overrides, greese.utilities`

(`greese.overrides` was added on 2026-10-19 for the SCSS kit's component
overrides; see [ADR 0010](0010-theme-kit-and-studio.md).)

That covers the tokens CSS, components, base and runtime themes. Any unlayered
consumer CSS overrides all of them without `!important`. Repeating the
statement in each sheet keeps the order fixed regardless of which sheet loads
first.

### Global styles are opt-in

`styles.css` only styles `.greese-*` classes and the token variables.
`base.css` contains the reset, `body` colours and the focus ring, and is
imported only when GreeseUI owns the page.

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

## Addendum (2026-10-19): direct classes, no chain

Style recalculation was the one area where MUI stayed ahead. We measured it
in isolation: the benchmark's exact HTML as a static page, each candidate
stylesheet swapped in, forced style recalculation timed at 4× CPU
throttling, medians of 7–11 runs. MUI's page measured about 24 ms on initial
style and 29 ms for the toggle.

| GreeseUI variant                                   | Initial style |  Toggle |
| -------------------------------------------------- | ------------: | ------: |
| Fallback chain, `@property`, uses classes (before) |       30.1 ms | 20.2 ms |
| Direct classes, uses classes kept                  |       26.6 ms | 16.9 ms |
| Direct classes, no uses classes                    |       26.1 ms | 14.5 ms |
| …and no `@property` registrations                  |       25.0 ms | 16.1 ms |

(Stack.css alone, with its imports inlined.) Matching itself was cheap; the
cost was computing values through `var()` chains and registered properties.
So the mechanism changed:

- **Each breakpoint's class sets the property directly,** inside its media
  query. Breakpoints are emitted smallest first, so source order is the
  mobile-first fallback. Token classes keep their names
  (`.greese-Stack--md-gap-2`).
- **Open-ended values** set the breakpoint variable inline, as before, and
  add a value class (`.greese-Stack--md-gap`) that reads it.
- **No uses class.** An unset prop still adds nothing. A component that needs
  "this prop is set" adds its own class (Spacer's `--fixed`).
- **No `@property`.** Only the element that sets a variable reads it, so
  inheritance can't leak, and registration measurably cost time.
  Changing an open-ended inline value now restyles descendants too; that's
  rare, and the common path (classes) is faster.
- **Behaviour change, for the better:** below a prop's smallest set
  breakpoint, the component's own styles apply. The chain set the property
  to an invalid `var()` there, which reset it (Box's `m={{ md: 4 }}` reset
  margin below `md`).

The same measurement found two more costs, both fixed:

- **Motion presets** had 18 rules with `> *` children and 25 `:nth-child`
  stagger rules. A rule whose rightmost part has no class, id or tag is tried
  against every element. Presets now set `--greese-motion-name` and share
  four rules; stagger uses `sibling-index()`, with the `:nth-child` rules
  inside `@supports not (order: sibling-index())`, where browsers that pass
  never even match them. Removing these was worth about 2 ms initial and
  1.4 ms per toggle on the full stylesheet.
- **Cascade layers** cost about 5% (1.2 ms). They stay: they're what lets an
  app's CSS win without `!important`.

The full benchmark (`npm run bench -w playground`, 9 rotating runs, now with
a per-component-CSS column):

| Metric                          |  Before | After, `styles.css` | After, `css/Stack.css` |     MUI |
| ------------------------------- | ------: | ------------------: | ---------------------: | ------: |
| Style recalculation (load)      | 37.4 ms |             34.8 ms |                29.5 ms | 25.3 ms |
| Update: style recalc per toggle | 22.2 ms |             18.1 ms |                17.5 ms | 15.9 ms |

GreeseUI leads MUI on 7 of 10 metrics, ties layout, and does 1.8× less
main-thread work on load. The remaining style gap is structural: Emotion
collapses each distinct style into one class at runtime, so an element
matches one short rule; precompiled classes mean an element matches
several. Closing it would take build-time extraction of class combinations
(a compiler plugin) or runtime generation, which is the JavaScript cost this
design exists to avoid. `greese-ui.css` also shrank, 16.55 → 15.34 kB.
