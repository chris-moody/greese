# ADR 0034: A theme kept in your source: the SCSS layout, resets and Sass parity

- **Status:** Accepted
- **Date:** 2026-11-03
- **Amends:** ADR 0010 (the kit and Theme Studio), ADR 0019 (utilities), ADR 0021
  (SCSS entry points), ADR 0025 (theme layers)

## Context

Theme Studio saved one generated `greese-theme.scss` that you weren't meant to
edit by hand. Nothing documented how to keep a theme in a codebase and change
one component of it at a time. Writing that layout by hand turned up rough edges
in the kit:

- **A second `tokens()` call undid the first.** Inside `theme()`, each call
  wrote a complete theme, filling every token it didn't set with its default.
- **The theme name couldn't be turned off with `null`.** Sass reads `null` in
  `@use … with` as "not configured", so a shared `$name: brand !default` kept
  `brand`.
- **Nothing took a theme back from part of a page.** Overrides in a named
  theme add up in nested themes (ADR 0010), and neither CSS nor the kit could
  strip a component of a theme's shapes, colors or motion.
- **The utilities were TypeScript only.** In Sass they couldn't follow the
  build's breakpoints without passing them twice.
- **The component sources shipped but weren't exported,** so a Sass build
  couldn't choose its components.

## Decisions

### 1. The documented layout, in `@greese/ui`

`@greese/ui/theme-files` holds a theme as data (`ThemeSpec`, the JSON Studio
saves) and the SCSS it becomes. It used to live in `apps/site/src/studio`. It is
pure and has no dependencies, so any tool can write the same files.

`specToLayout()` writes the documented layout, a folder of Sass modules:

```
main.scss              the entry: only @use lines
_settings.scss         breakpoints, $library, $utilities, $theme
_library.scss          greese ui's stylesheet, built here when $library
_resets.scss           theme layers taken back from components, first
tokens/_index.scss     a tokens() call per group, every group, then typography()
tokens/_<group>.scss   $tokens and $extend for one group, defaults commented
tokens/_typography.scss  $changes, defaults commented
motion/_index.scss     effects, motion roles, page transitions
components/_<name>.scss  one component: its own @use lines, helpers, overrides
shapes/_index.scss     the shapes' sizes ($shapes), then their geometry
utilities/_index.scss  greese ui's utility classes when $utilities, and yours
```

Each module writes its CSS when it is first loaded, and the cascade layers
decide precedence. `@use` must come before any rule, so `main.scss` holds only
`@use` lines. That rule of Sass's stays and is documented, not worked around.

A component's own imports and helpers stay in its file. A layout has none of
the single file's merged-import conflicts. Each component file also compiles
on its own.

Tests compile the layout and `specToScss()`'s single file for a named theme,
the page theme and custom breakpoints, and check that both give the same CSS.

**Every setting has a place.** A change to the theme is an edit in one file:

- **Breakpoints.** `_settings.scss` always configures them, defaults
  included. `$library` (on whenever they differ from the library's, by
  comparing with `scss/maps`) makes `_library.scss` build greese ui's
  stylesheet with them through `meta.load-css()`, and `$utilities` (`$library`
  by default) makes `utilities/_index.scss` build the utility classes. A
  breakpoint changed later moves every media query, the utilities' included,
  with nothing else to edit. Every file `@use`s `settings` first, since Sass
  configures a module only before anything else loads it.
- **Defaults.** Every token group has its file, and it and the type system's
  list each default the theme leaves alone, commented: a change is an
  uncomment. The motion file lists the options that have a base value. In the
  kit, a `tokens()`, `typography()`, `motion-defaults()` or
  `page-transitions()` call that sets nothing writes nothing (and an empty
  `tokens()` doesn't declare a named theme), so the untouched files cost no
  CSS.
- **Shapes.** Each shape's sizes (border width, parameters at rest, hovered,
  pressed) are a `$shapes` map at the top of its file, and the generated rules
  read them (`shapesCss()` takes a size writer). The outlines stay
  generated.

**Taking a file over.** Every generated file starts with `LAYOUT_MARK`. A tool
that rewrites the layout leaves alone any file that no longer starts with it,
and keeps it when the theme stops needing it. `specToLayout(spec, source,
{ components })` names component files of your own for `main.scss` to keep
loading; Theme Studio passes every component file without the mark.

### 2. Studio writes the layout by default

`GREESE_THEME_OUTPUT` chooses what saving writes: `layout`, `scss` (the single
file, as before) and `css`. The default is `layout,css`.

- The layout goes in a folder named after the theme file.
- The Output tab shows the layout a file at a time. The hosted studio downloads
  it as a .zip, written by a small store-only writer of the studio's own
  rather than a dependency.
- Studio still compiles the single file internally, and its errors still point
  at the box and line.

### 2a. The breakpoints, once, for CSS and JavaScript

The Sass build declares the breakpoint custom properties once, from the
breakpoints it's built with (`_breakpoint-vars.scss`, in `core`), plus their
keys in order: `--greese-breakpoint-keys: xs sm md lg xl`. The defaults' copy
left `tokens-base` (`tokens.css` keeps its own). `configureBreakpoints()` with
no argument reads them, so the JavaScript can't disagree with the
stylesheet; values passed still work as before.

### 3. `tokens()` calls add up

The kit records each theme's merged overrides and extensions (`''` stands for
the page). A repeat call writes only what changed since the call before, under
the same selectors, so the result equals one merged call.

- An explicit value from an earlier call outlives a value a later call derives
  (`primary-content` from `primary`).
- At the page level, calls were already deltas; they now merge the same way.

Merging silently has no downside: the CSS it writes is equivalent and smaller.
An error would only have pushed every tool into merging by hand.

### 4. `scope($name)`

`scope()` is `theme($name)` when there is a name, and the page when the name is
`null`, `false` or `''`. In the layout, `_settings.scss` holds `$theme` and is
edited directly, not configured with `with`, so `null` works.

### 5. Taking theme layers back

The three layers (ADR 0025: color, shape, motion) can be taken back at run time
and at build time.

**Run time: classes.** `.greese-reset-color`, `.greese-reset-shape`,
`.greese-reset-motion`, and `.greese-reset` for all three, work on any element
and its subtree.

- Every theme rule the kit writes carries a zero-specificity guard,
  `:where(:not(.greese-reset-<layer>, .greese-reset-<layer> *, .greese-reset, .greese-reset *))`,
  from `reset-guard()`:
  - `component()` rules are `shape` by default, or `$layer: color | motion`;
  - `motion()` inside a component is always `motion`;
  - shapes' plain CSS gets its selectors from `themed()`.
- `css/resets.css`, which is opt-in, gives the classes the layers' default
  tokens:
  - colors as `light-dark()`, so they follow the scheme;
  - the radius scale and roles;
  - every motion role variable set to `initial`, so each falls back to the base
    theme's.

  The file is about 1 kB brotli, most of it motion variables, so it isn't in
  `styles.css` or `core.css`. The kit's `reset-classes()` writes the same
  classes.

**Build time: `reset($layers...)`.**

- In any rule it declares those defaults.
- Inside `component(Name)` it also leaves the component out of those layers'
  theme rules compiled after it in the same build: rules from `component()`,
  `motion()` and `themed()`.
  - A reset layer's rule is kept with a selector that matches nothing
    (`:not(*)`), so a `motion()` inside still writes its own rule.
  - A reset that comes after the rules it would remove warns, naming them.

**Rejected:**

- `all: revert-layer !important` in `greese.overrides`. It reverts the theme in
  Chromium, Firefox and WebKit alike, but drops `greese.utilities` too (style
  props, the `greese` prop).
- Sass `@extend` into the guard's `:not()`. Dart Sass fails with an internal
  error.
- `@scope (…) to (…)`. It changes the overrides' specificity and needs Firefox
  146, which is newer than the Baseline 2024 floor (ADR 0013).

**Limits:**

- A theme's retuned built-in `@keyframes` are global and can't be taken back.
- A theme nested inside a reset region doesn't re-apply its guarded rules.
- A prebuilt `.css` theme is outside the build, so only the classes reach it.

### 6. Utilities in Sass

`pkg:@greese/ui/scss/utilities` writes the same classes as `utilities.css`,
`greese-utilities` and the Vite plugin. The build writes `src/utilities.ts`'s
table to `dist/_utilities-table.scss` as Sass data, so the table stays the one
definition.

```scss
@include utilities.classes($groups: null, $only: null, $prefix: '');
```

It takes the configured `$breakpoints`. Sass can't scan your source, so purging
is an explicit `$only` list; scanning stays with the CLI and the plugin. A test
keeps the Sass output equal to `generateUtilities()` for the defaults, custom
breakpoints, groups, a prefix and a purge list.

### 7. Entry points for a Sass build that picks its components

- **`pkg:@greese/ui/scss/core`:** the layer order, tokens and type system.
- **`pkg:@greese/ui/scss/components/<Name>`:** one component's own stylesheet.
  Sass's package importer replaces only one `*` in an export target, so the
  build writes a one-line forwarding module per component to
  `dist/scss/components/`.

Both write CSS, so they are not authoring entries (ADR 0021): Studio's
component SCSS can't `@use` them. `utilities`, which writes nothing until
called, is an authoring entry. All three are semver API from here on.

### Sass and TypeScript, side by side

| What        | TypeScript                       | Sass                                       |
| ----------- | -------------------------------- | ------------------------------------------ |
| Tokens      | `createTheme()`                  | `tokens()`, the maps (same values, tested) |
| Breakpoints | `configureBreakpoints()`         | `$breakpoints` (`scss/config`)             |
| Typography  | `typography()` options           | `typography()`, `$typography`              |
| Effects     | `defineGreeseEffect`, `cssPlan`  | `effect()`, `keyframes()`, `$effects`      |
| Utilities   | `generateUtilities`, plugin, CLI | `scss/utilities` (new)                     |
| Shapes      | `@greese/ui/shapes`              | none: generated CSS, through `themed()`    |
| Theme files | `@greese/ui/theme-files`         | its output                                 |

Shapes stay generated. Their geometry (point paths, parameters, rings) is a
JavaScript program, and a Sass port would be a second implementation to keep in
step. The CSS they write is ordinary SCSS in the layout.

## Consequences

- **Size:**
  - Shape themes grow by about 4% with the guards (Bevel 3,425 → 3,562 B
    brotli).
  - `--greese-breakpoint-keys` adds a declaration to `tokens.css` and the
    stylesheet; a build with its own breakpoints loses its stale copy of the
    defaults.
  - Color and motion themes are unchanged.
  - `styles.css`, `core.css` and the JavaScript budgets are unchanged.
  - `resets.css` is opt-in, at about 1 kB.
- **Compile time:**
  - The kit builds its unknown-component and unknown-layer messages only on
    failure.
  - A shape theme's 242 `themed()` calls cost about 13% of its compile.
- **Studio's importer** removes the guards when it reads CSS back.
- **The hosted studio:**
  - It resolves the new entry points.
  - The utility table and the component sources come with its lazy chunk.
- **`@greese/react`** re-exports `css/resets.css`.
- **Tests:** the kit (merging, `scope()`, guards, resets, warnings), the layout
  (equivalence, files, isolation, a build-time reset), the Sass utilities, the
  entry points (a project build with chosen components and its own
  breakpoints), Studio's writer (taken-over files kept, stale ones removed) and
  the zip.
