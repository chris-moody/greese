# ADR 0016: The typography system

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Text styling was a size scale (`xs`–`4xl`), weights and line heights, applied
one prop at a time. Apps think in styles: a heading, a caption, body text,
that look different on a phone and on a desktop. There was no way to define
those once for a theme, or to give a style properties like letter spacing or
text transform.

## Decision

**Variants:** `p1 p2 p3`, `h1`–`h6`, `s1 s2`, `caption` and `button`.

Each has, on every screen, a **size**, **weight**, **tracking** (letter
spacing) and **leading** (line height), and may set `family`, `style`,
`transform`, `features`, `variation`, `stretch`, `wrap`, `spacing` and
`numeric` (the CSS properties of those names). Unset extras inherit.

### Custom properties, set mobile-first

Every value is `--greese-type-<variant>-<prop>`, declared in the token layer:
the smallest screen's values on `:root`, then a media query per breakpoint
that changes any. A value at a breakpoint applies from there up until a larger
one sets another, so only changes are written (the defaults are about 0.8 kB
brotli). The defaults live in `src/typography.ts`, reach the SCSS as
`$typography` (generated into `dist/_maps.scss`), and are written into
`tokens.css`.

### One class per variant

`.greese-Type--<variant>` reads the variant's properties. It's the whole
interface for plain HTML, and what `Text` and `Heading` render when given
`variant`. `Heading` keeps `level` for the element and takes the look from
`variant`; with a variant, `size` and `weight` are ignored, since a variant
owns them (the alternative, letting props override variables, would make a
component's look depend on prop order). `Button` reads the `button` variant's
weight, tracking, leading and extras; its size still comes from `size`,
because height and touch target depend on it.

### Changing it

- **Static themes:** `createTheme({ typography })`. What you set replaces the
  default at that exact point; the rest, other breakpoints included, stays.
  A theme declares every variant, as it declares every token, so it never
  depends on its ancestors. It uses the defaults' breakpoint widths.
- **SCSS kit:** `greese.typography((h1: (base: (size: 2rem), lg: (…))))`, using
  the build's breakpoints. Names that don't exist stop the build. It writes a
  touched variant whole, because a value at one point in the theme layer would
  otherwise beat the defaults' other points in the layer below it.
- **A whole build:** `@use 'pkg:@greese/ui/scss' with ($typography: …)`, and
  the properties are written once, from that build's breakpoints
  (`_typography-vars.scss`; the stylesheet builds from `tokens-base`, the
  tokens without the type system, so nothing is declared twice).
- **Theme Studio:** a Typography section: variant, breakpoint (the build's),
  the four values (the placeholder shows what an empty field inherits), and
  other properties. It writes `typography` in the theme JSON and
  `greese.typography(…)` in the SCSS, and imports both back, from the kit's
  output and `createTheme`'s.

### Limits

- Breakpoints are the build's: a theme can't move them (ADR 0006 §2). Studio
  shows them.
- Defaults are rem literals, so a change to the font-size tokens doesn't move
  them; they follow the user's text size.
- `createTheme` carries the defaults (about 0.6 kB brotli), so budgets rose:
  the CSS 20 → 21 kB, and the library and `createTheme` entries.

## Consequences

- The `Text` and `Heading` default looks are unchanged without a `variant`.
- Every framework package gets the same classes and variables (ADR 0014); a
  new one adds `variant` the same way.
- Typography tokens are not in the Studio's "Add token" areas: a variant is a
  structured value, not a single token (ADR 0015).

## Addendum (2026-10-20): the font-size tokens are gone

Two ways to say a text size (a `font-size` scale and the variants) left
components and apps choosing between them, so the scale was removed: there is no
`--greese-font-size-*`, no `fontSize` token group (in `createTheme`, the kit,
or Theme Studio), and no `size` prop on `Text` or `Heading`.

- **Components** read the variants' sizes: `caption` (0.75rem), `p3`
  (0.875), `p2` (1) and `s2` (1.125) where they used `xs`–`lg`, and `h2`/`h3`
  for the larger ones. These four don't change with the screen, so those
  components look as before.
- **`Text`** takes a `variant`, and inherits its size without one.
  **`Heading`** takes the variant of its level (`h1` for level 1) unless it
  names another, so headings now follow the type system by default (larger
  on wide screens than before, and customisable in a theme).
- **Migrating:** `size="sm"` becomes `variant="p3"` (xs `caption`, md `p2`,
  lg `s2`, xl `s1`, 2xl `h3`, 3xl `h2`, 4xl `h1`); on a `Heading`, the
  heading variants.
- The responsive font-size classes (`greese-Text--md-size-lg`…) went with
  the prop, so the stylesheet is smaller.
