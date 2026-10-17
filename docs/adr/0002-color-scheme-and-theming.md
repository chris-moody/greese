# ADR 0002: Colour schemes and theming

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

We need page-wide light/dark switching, per-section scheme overrides, custom
brand themes, and nesting of all of these. All of it has to work with zero
style work per render, and has to survive whatever CSS pipeline the consumer
uses.

## Decisions

### 1. Redeclare variables per scheme; don't use `light-dark()`

Phase 0's e2e tests found that Vite's default Lightning CSS target polyfills
`light-dark()`. The polyfill substitutes the value at the declaring element
(`:root`), which freezes the tokens and breaks nested schemes. We don't
control consumer pipelines, so the tokens CSS redeclares the colour variables
in several places:

- on `:root`;
- under `@media (prefers-color-scheme: dark)`;
- on `[data-sauce-scheme='light' | 'dark' | 'system']`.

`color-scheme` is set alongside, so native controls and scrollbars match.

### 2. The page scheme is one attribute on `<html>`

`useColorScheme().setScheme()` writes `data-sauce-scheme` on `<html>` and
persists the choice to localStorage. That's the "one attribute write" this
phase was meant to deliver. `getSchemeScript()` applies the saved choice in
`<head>` before first paint, and the hook observes the attribute, so the two
can't disagree.

### 3. Themes are static CSS scoped by attribute, injected once

`createTheme()` builds the theme's CSS once, at module scope, in
`@layer sauce.theme`, scoped to `[data-sauce-theme='name']`. `ThemeProvider`
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
:root[data-sauce-scheme='dark'] [data-sauce-theme='brand']:not([data-sauce-scheme]) { … }
```

`sauce.theme` comes after `sauce.tokens` in the layer order, so a theme beats
the default scheme rules on the same element regardless of specificity.

### 5. Themes replace; they don't stack

A theme's CSS declares **every** token: the defaults with its overrides
applied. As a result, `<ThemeProvider theme={rounded}>` inside `brand` renders
`rounded` exactly, whichever scheme rules apply on the element. Without this,
nesting would merge in some cases and replace in others, depending on whether
a scheme attribute happened to be stamped. To extend a theme, create a new
one with more overrides. This costs about 1 kB gzipped of CSS per theme.

## Known limitation

A raw `data-sauce-scheme` attribute set by hand on an element (not through
`ThemeProvider`) is invisible to themes nested inside it, because context
can't see it. Use `<ThemeProvider scheme>` for scheme scopes.

## Verification

`apps/playground/e2e/theming.spec.ts` covers OS light/dark × page scheme
system/light/dark across seven nested probes. It also checks that a saved
scheme is applied before React runs, and that each theme's CSS is injected
once. It runs in Chromium against the production build.
