# ADR 0021: SCSS authoring entry points, and component SCSS in Theme Studio

- **Status:** Accepted
- **Date:** 2026-10-22
- **Amends:** ADR 0010 (the SCSS kit and Theme Studio)

## Context

The SCSS kit lets a theme override components (`component()`, `part()`,
`modifier()`), and it forwards six of the library's mixins (`up`, `down`,
`hover`, `focus-ring`, `touch-target`, `motion-safe`). The component stylesheets
themselves use more: `tones`, `floating` and `controls`, and every mixin in
`_mixins.scss`. None of these partials were reachable from a project, since
`@greese/ui`'s `exports` didn't list them, so styles copied out of a component's
source didn't compile in a theme. Theme Studio's SCSS box was a snippet written
inside `component(Name) { }`, so it couldn't `@use` anything at all.

## Decision

### 1. The partials theme authors need are public entry points

| Entry point                    | Forwards               | Hidden                                              |
| ------------------------------ | ---------------------- | --------------------------------------------------- |
| `pkg:@greese/ui/scss/mixins`   | `src/styles/_mixins`   | `responsive-prop`, `responsive-var`, `space-tokens` |
| `pkg:@greese/ui/scss/tones`    | `src/styles/_tones`    | `classes`                                           |
| `pkg:@greese/ui/scss/floating` | `src/styles/_floating` | nothing                                             |
| `pkg:@greese/ui/scss/controls` | `src/styles/_controls` | nothing                                             |

They join `scss`, `scss/kit`, `scss/config`, `scss/tokens`, `scss/layers` and
`scss/maps`. Each is a one-line file in `src/styles/public/` that `@forward`s the
library's own partial, so:

- **It is the same module** the kit and the components load, configured by the
  same `$breakpoints`: a theme built with `md: 700px` gets `700px` from
  `mixins.up(md)` (tested, and checked in a packed consumer).
- **The namespace is the one the sources use** (`mixins.up`, `tones.$tones`,
  `floating.surface`), so code copied from a component compiles.
- **What is hidden is what writes a block's own class names**, which only makes
  sense in the library's sheets: the responsive-prop machinery and the tone
  modifier classes. Everything that writes declarations is public.

These members are now semver API for `@greese/ui`. Renaming or changing one is a
breaking change; internals stay in the unexported partials.

### 2. A component's SCSS in Theme Studio is imports plus a body

`components.<Name>.scss` stays one string. The Studio splits its leading `@use`
statements from the rest:

- **Imports allowed:** `sass:*` and `pkg:@greese/ui/scss/*`, with no `with (…)`.
  `@forward` and `@import` are refused, as is a `@use` after the body begins.
  A relative path to a library partial, as written in a component's source
  (`../../styles/mixins`, `../../../dist/maps`), is rewritten to its `pkg:` form
  when you edit, so the stored theme is portable; any other relative path is an
  error.
- **Declarations Sass allows only at a file's top level** (a body's top-level
  `@mixin`, `@function`, and the `$variables` those read) are moved there too,
  after the imports, so code with helpers (Slider's `@mixin thumb`, Grid's
  `@function column-tokens()`) works. Other top-level variables stay in the body,
  where a loop that updates one still updates it. Two components declaring one
  name would silently replace each other in the shared file, so that is an error.
- **The body** goes inside `@include greese.component(Name) { … }`, as before:
  `&` is the component's element, anything else is inside it, and it lands in
  `@layer greese.overrides`. Saved themes without imports are unchanged.
- **The output is one file.** The Studio writes every component's imports once,
  merged, at the top of `greese-theme.scss`, after the kit and any `config … with`
  line (the partials load `config`). The same URL under one namespace is merged;
  two components giving one URL different namespaces, or two URLs one namespace,
  is an error naming both, since Sass refuses either.

The alternative, loading each component's SCSS as its own module with
`meta.load-css()` from a virtual file beside the component's source, resolved
relative paths inside the Studio but could not work in a project: neither the
virtual file nor `src/styles/` exists in an installed package.

## Consequences

- Themes, and SCSS written by hand, can use the library's mixins, tones and
  surfaces the way its own components do.
- `verify:packages` compiles a theme using every authoring entry point, with
  custom breakpoints.
- Theme Studio's hosted (browser) importer and the dev server resolve the same
  entry points, and a test checks every exported SCSS entry resolves in both.
- Importing a compiled theme back can't recover SCSS bodies: the theme JSON stays
  the source of truth.
- A Sass error is traced back to the component's box and line: the generated file
  records where each import, declaration and body came from, and the Studio reads
  the innermost frame of Sass's stack that is in the theme file (the line inside
  a mixin call, not the `@include greese.component(…)` around it).
- A component's Styles box starts as its family's own source, made to fit (the
  `@layer` gone, the class as `&`, imports as `pkg:`, other components' rules
  dropped), and is kept in the theme only once edited, then in full. The CSS box
  that kept only differences, and the separate Source view, were removed in
  favour of it.
- Every component's own source, copied into its box this way, compiles inside its
  `component()` (a test, for all 80 that can be copied;
  Motion, built with a partial that stays private, is the exception).
- Measured in Chromium, the browser studio compiles a theme with six SCSS
  components in about 35–60 ms per edit after the first (~0.8 s, which includes
  loading Sass).
