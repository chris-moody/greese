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
| Per-breakpoint variable | `--sauce-stack-gap-md` (lower-cased block, prop, breakpoint) |
| Token class | `.sauce-Stack--md-gap-2` |

For each prop, the mixin emits three things:

- **A reset.** On `.sauce-Stack`, every breakpoint variable is reset to
  `initial`, so a nested Stack never inherits its parent's values.
- **A fallback chain.** Each breakpoint's media query reads
  `var(--…-md, var(--…-sm, var(--…-xs)))`, so an unset breakpoint inherits the
  nearest smaller one, as in MUI.
- **Token classes.** Each one sets the *variable*, never the property. If a
  class set the property directly, the chain at a larger breakpoint would
  override it.

`resolveResponsive()` turns each `{ bp: value }` into a class when the value
is a token, or into an inline variable otherwise. It is a pure function that
loops over at most five breakpoints per prop.

The plan originally had a second mixin, `responsive-variant()`, which would
have emitted media-query classes for enum props. We dropped it. Enum props use
the same variable chain, with every value treated as a token, so there is one
mechanism to learn, test and debug.

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

- No style work on the main thread during render. The whole library is about
  3 kB of JS (brotli), and the styling path is a string concat. Importing
  `VisuallyHidden` alone costs 136 B, which shows that tree-shaking works.
- Every token value × breakpoint becomes a class. Size budgets
  (`.size-limit.json`) keep this in check. Only props that need it are
  responsive.
- Custom breakpoints require recompiling the SCSS (planned for Phase 6).
- There is no general-purpose `sx` prop. Typed style props on layout
  primitives cover the common cases.
