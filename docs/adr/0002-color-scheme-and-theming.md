# ADR 0002: Color schemes and theming

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

We need page-wide light/dark switching, per-section scheme overrides, custom
brand themes, and nesting of all of these. All of it has to work with zero
style work per render, and has to survive whatever CSS pipeline the consumer
uses.

## Decisions

### 1. Redeclare variables per scheme; don't use `light-dark()`

[Phase 0](0013-project-scope-and-phases.md#phases)'s e2e tests found that Vite's default Lightning CSS target polyfills
`light-dark()`. The polyfill substitutes the value at the declaring element
(`:root`), which freezes the tokens and breaks nested schemes. We don't
control consumer pipelines, so the tokens CSS redeclares the color variables
in several places:

- on `:root`;
- under `@media (prefers-color-scheme: dark)`;
- on `[data-greese-scheme='light' | 'dark' | 'system']`.

`color-scheme` is set alongside, so native controls and scrollbars match.

### 2. The page scheme is one attribute on `<html>`

`useColorScheme().setScheme()` writes `data-greese-scheme` on `<html>` and
persists the choice to localStorage. That's the "one attribute write" this
phase was meant to deliver. `getSchemeScript()` applies the saved choice in
`<head>` before first paint, and the hook observes the attribute, so the two
can't disagree.

### 3. Themes are static CSS scoped by attribute, injected once

`createTheme()` builds the theme's CSS once, at module scope, in
`@layer greese.theme`, scoped to `[data-greese-theme='name']`. `ThemeProvider`
renders it through React 19's `<style href precedence>`, which hoists it into
`<head>`, de-duplicates it by `href` and works with SSR. The provider's
wrapper (`display: contents`) only carries attributes. Changing theme or
scheme means changing an attribute, and no CSS is generated.

### 4. Every scheme boundary stamps both attributes

Theme rules resolve only through compound selectors on a single element. For
example, `[theme='brand'][scheme='dark']` uses the brand theme's dark values.
`ThemeProvider` passes the nearest theme and forced scheme down through
context, so a scheme-only provider inside a theme still stamps the theme
name. A theme nested inside a forced scheme likewise stamps that scheme.

Separate rules cover a scheme forced on `<html>` above a theme that sets no
scheme itself:

```css
:root[data-greese-scheme='dark'] [data-greese-theme='brand']:not([data-greese-scheme]) { … }
```

`greese.theme` comes after `greese.tokens` in the layer order, so a theme beats
the default scheme rules on the same element regardless of specificity.

### 5. Themes replace; they don't stack

A theme's CSS declares **every** token: the defaults with its overrides
applied. As a result, `<ThemeProvider theme={rounded}>` inside `brand` renders
`rounded` exactly, whichever scheme rules apply on the element. Without this,
nesting would merge in some cases and replace in others, depending on whether
a scheme attribute happened to be stamped. To extend a theme, create a new
one with more overrides. This costs about 1 kB gzipped of CSS per theme.

## Known limitation

A raw `data-greese-scheme` attribute set by hand on an element (not through
`ThemeProvider`) is invisible to themes nested inside it, because context
can't see it. Use `<ThemeProvider scheme>` for scheme scopes.

## Verification

`apps/playground/e2e/theming.spec.ts` covers OS light/dark × page scheme
system/light/dark across seven nested probes. It also checks that a saved
scheme is applied before React runs, and that each theme's CSS is injected
once. It runs in Chromium against the production build.

## Addendum (2026-10-19): build-time themes

The SCSS kit's `theme(name)` + `tokens()` compiles the same complete theme
as `createTheme`, with the same selectors (a test compares them), into the
app's own CSS. `ThemeProvider`'s `theme` prop now also takes a theme **name**,
so such a theme still gets decision 4's attribute stamping without a
`<style>` element. Page-level `tokens()` overrides go in `greese.theme` on
the default selectors. See [ADR 0010](0010-theme-kit-and-studio.md).

## Addendum (2026-10-19): brand roles and the palette

- **`primary`, `secondary`, `tertiary`** join the color roles, each with
  `…Strong` and `on…`, as MUI users expect. Components keep reading
  `accent`; its default is `var(--greese-color-primary)` (likewise
  `accentStrong`, `onAccent`, and `focusRing`), declared on the same element,
  so a theme that sets only `primary` rebrands every component, and one that
  sets `accent` too can separate the two. No component CSS changed.
- **The palette** (`palette.ts`): 22 hues × 11 shades. The default roles are palette
  colors (the greys stay GreeseUI's own), read from the palette in `tokens.ts`
  and `contrast.ts` (`steel[999]`), so a change to a palette value reaches
  every role. They were once written out as hex to keep the hues out of
  bundles; that duplicated every value, and it was replaced (2026-10-21).
  The cost is the nine hues the defaults use travelling with `createTheme`
  (about 0.35 kB brotli); `color` is a pure-annotated initializer, so a
  bundle that never reads `color` keeps none of it. It's exposed:
  - in TypeScript, one export per hue (a plain object), so bundles keep only the
    hues they import;
  - in the SCSS kit, as `palette(hue, shade)`, and as any value written
    `hue-shade` (`lavender-600`), resolved at build time. No CSS value has
    that shape, so the shorthand can't capture a real one. `createTheme`
    doesn't resolve it: that would put the whole palette in every bundle that
    calls it; TypeScript has `palette.lavender[600]` instead;
  - in CSS, as `palette.css`, opt-in. 242 properties are about 2 kB
    compressed, more than a tenth of the library's CSS budget, for colors
    most pages never reference, so `tokens.css` doesn't include them.
- **Brand tones.** Every component with a `tone` prop also takes `primary`,
  `secondary` and `tertiary` (the shared `BrandTone` type), through the
  shared tone map (`styles/_tones.scss`). Chip gained a `tone` prop: a plain
  chip is tinted in it, a selectable one shows it when selected, and with
  none it looks as before. The plain-chip tint is a `:has()` selector rather
  than a class from JavaScript, which kept the whole-library JS within its
  budget. ToggleButton now presses to its tone; the default `neutral` still
  presses to accent. About 0.3 kB of CSS (brotli) in all; no budget raised.

## Addendum (2026-10-19): primary leads, content colors are derived

This supersedes the "accent follows primary" part of the addendum above.

- **Four brand colors, in order:** `primary`, `secondary`, `tertiary`,
  `accent`. Components read `primary` for interactive emphasis (solid
  buttons, links, focus, selection; 29 places in component CSS), and the
  default `tone` is `primary` wherever there is one. `accent` is a color of
  its own (pink by default), a tone like the others. The focus ring follows
  `primary`.
- **`on<Color>` became `<color>Content`** (`--greese-color-primary-content`)
  for the four brand colors and `negative`. Unreleased, so
  renamed outright; Theme Studio's importer and tests followed.
- **WCAG-safe by construction.** Every default content color meets 4.5:1
  against its color in both schemes (a test). When a theme sets a brand
  color but not its content color, `createTheme` derives one per scheme:
  the more readable of white and near-black, or pure black where neither
  reaches 4.5:1 (when white fails, black always passes). It also derives
  `…Strong` as `color-mix(in oklab, <color> 80%, #000)` in light and
  `70%, #fff` in dark, computed by the browser. Explicit values win. Colors
  it can't measure (`var()`, `oklch()`) keep the default content color.
  The SCSS kit's `tokens()` does the same in Sass, and a test checks it
  emits exactly what `createTheme` does, palette names included.
- **Why JavaScript, not CSS:** relative color syntax could pick black or
  white in CSS with no script, and would handle any color format, but it
  thresholds on perceptual lightness rather than WCAG luminance, so near the
  crossover it can pick the ink that fails AA. Exact WCAG cost about 0.4 kB
  in `createTheme`; its budget rose 2.25 → 2.75 kB, and the whole-library
  budgets by 0.5 kB each. Only apps that call `createTheme` pay it.
- **Exported:** `contentColor`, `contrastRatio`, `luminance`, `AA`,
  `CONTENT_LIGHT`, `CONTENT_DARK` and `deriveColors`, so docs and tools show
  the same numbers.
