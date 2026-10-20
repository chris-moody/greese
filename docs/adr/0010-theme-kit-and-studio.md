# ADR 0010: The SCSS kit, the style manifest and Theme Studio

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Tokens (ADR 0002) theme what every component reads. Past that, restyling a
component meant hand-written CSS against `greese-*` classes:

- nothing listed a component's classes, parts, modifiers or variables except
  its source;
- a typo, or a part renamed in a release, failed silently;
- overrides sat in unlayered CSS, so they also beat style props and the
  `greese` prop on individual instances;
- giving every instance of a component a motion default meant a `greese` prop
  on each one.

We wanted a theme to cover tokens, component styles and motion, compiled at
build time (no runtime, per ADR 0001), and a visual tool to build one.

## Decisions

### 1. A style manifest, generated from the compiled CSS

`scripts/styleManifest.ts` reads each component's compiled stylesheet and
records every block's parts, modifiers (and modifiers of parts), responsive
props, state attributes and custom properties (tokens and per-breakpoint
variables excluded). `build:css` writes it two ways:

- `dist/style-manifest.json`, exported as `@greese-ui/react/style-manifest.json`,
  for the docs and Theme Studio;
- `src/styles/_manifest.scss`, committed, a Sass map for the kit's name
  checks. A unit test fails if it's stale.

It comes from the CSS rather than annotations, so it can't drift from what
ships.

It also records, per exported component, the blocks it renders and the
components it renders (`components`, manifest version 2). The data comes
from the TSX: each file is split into top-level declarations, and a
component owns the classes in its body and in the unexported helpers it
uses. Comments and string literals are left out, since TSDoc examples and
error messages mention other components. Following what it renders gives
`builtOn`: an AccordionItem is a Collapsible, so Collapsible's parts style it
too.

### 2. A new layer: `greese.overrides`

The layer order becomes:

```
greese.reset, greese.tokens, greese.theme, greese.base,
greese.components, greese.overrides, greese.utilities
```

Component overrides must beat component styles whatever their specificity,
yet lose to style props and the `greese` prop (`greese.utilities`), so that one
instance can still differ from the theme. No existing layer sits there.
`LAYER_ORDER` in `@greese-ui/tokens` stays the single source; every sheet
repeats it, so adding a name is safe. A sheet built before this change that
loads first leaves `greese.overrides` last, above utilities. Only kit output
uses the layer, so that needs an old sheet and a new kit in the same page.

### 3. The SCSS kit: `pkg:@greese-ui/react/scss/kit`

A Sass module that emits nothing until called:

- **`component(Name) { part(); modifier(); vars(); motion() }`** writes the
  `greese-` prefix and separators. Overrides go in `greese.overrides`.
- **`tokens()`** is the build-time `createTheme`. At the top level it is a
  delta on the default selectors. Inside **`theme(name)`** it declares a
  complete theme with `createTheme`'s exact selectors: a test compares the
  two.
- **`class()`, `token()`, `variable()`** return checked names for your own
  rules.
- The library mixins are forwarded: `up`, `down`, `hover`, `focus-ring`,
  `touch-target`, `motion-safe`.

Other rules:

- **Strict by default.** Unknown components, parts, modifiers, variables,
  tokens, presets and options are build errors listing the valid names.
  `$strict: false` turns this off. This changes the old guidance "avoid
  targeting parts": parts still aren't a stable API, but through the kit a
  removed part breaks the build loudly.
- **Layer order.** The first mixin that writes CSS emits `LAYER_ORDER`, via a
  new `$layer-order` in `@greese-ui/tokens/scss/maps`. Theme Studio found the
  bug this prevents: a theme sheet loaded before the library made
  `greese.theme` the first, weakest layer.
- **Durations.** Duration tokens set through `vars()` or `motion()` sit behind
  `prefers-reduced-motion: no-preference`. A rescoped duration would
  otherwise escape the reduced-motion collapse that `tokens.css` applies at
  `:root`.
- **Colour pairs in `vars()`** compile to `light-dark()`. It resolves against
  the inherited `color-scheme`, which the scheme attributes already set, so
  nesting works natively. Polyfills break it (ADR 0002 §1); the guide says
  so. Tokens keep the redeclaration approach.

### 4. Theme-wide motion is CSS only

`motion()` gives every instance of a component:

- an entrance preset (or your own `@keyframes`);
- an overlay exit (the `--greese-motion-exit-*` variables, setting only what
  the preset changes, as the exit classes do);
- entrance tuning;
- the component's transition durations and easings, by rescoping the tokens.

Precedence:

- An instance's `greese` entrance replaces the default, because utilities beat
  overrides.
- An instance's `duration`, `delay` and `ease` tune the default, because it
  reads the same variables first.
- `motion-defaults()` sets those variables for the whole page or theme.

Scroll reveals, interactions and text effects need the JavaScript runtime.
Making them theme-wide would need a provider and context in every component,
which breaks Server Components and adds work to every render (ADR 0009 §2).
They stay per instance.

### 5. `ThemeProvider` takes a theme name

A theme compiled with the kit is already in the app's CSS. Its scope still
needs ThemeProvider's attribute stamping (ADR 0002 §4). So `theme` now also
takes a string: the provider stamps the attributes and injects no `<style>`.

### 6. Theme Studio: `apps/theme-studio`

A Vite app, run with `npm run studio`, with three parts:

- **A dev-server plugin.** It reads and writes one theme file
  (`GREESE_THEME`, resolved from where npm ran), compiles it through the
  real kit, and tells the page when the file changes on disk.
- **An editor** built with GreeseUI itself. It has tabs for tokens,
  components, motion and the generated code.
- **A preview** in an iframe, so the theme never restyles the editor. Its
  Inspect mode reports a clicked element's classes and live variable values.

Choices:

- **JSON is the source of truth.** The studio writes `greese-theme.json`, and
  generates `greese-theme.scss` (kit calls) and `greese-theme.css` from it.
  Round-tripping arbitrary SCSS would need a Sass parser and would lose hand
  edits anyway, so the generated files say they are generated. Hand-written
  overrides go in a file of the user's own.
- **Values are checked before they reach Sass.** Values that could close a
  declaration or rule (`;`, `{`, `}`, `</`) are refused. The kit then checks
  the names.
- **Dev only.** The plugin applies to `serve` only and answers same-origin
  requests only, because it writes files. A production build is read-only.
- **Not published yet.** It runs from this repository. Shipping it as a
  package (`npx`) is deferred with the rest of publishing.

## Consequences

- **Cost to users who don't use the kit:** about 18 bytes of layer name per
  stylesheet. The kit and the manifest add nothing to the JavaScript or CSS
  bundles. The manifest is a separate file that only tools import.
- **Docs:** every component's docs page ends with a Styling section
  generated from the manifest. It shows the component's own blocks with
  every row ("None" where empty), its items and what they're built on (on
  a parent), the blocks it's built on, and CSS and kit examples written for
  its real classes. Parts with no classes (TableHead, Slottable) say what to
  target instead. The new **Guides/Styling components** covers classes,
  layers, CSS overrides, the kit, theme-wide motion, Theme Studio, and a
  full reference.
- **Every part has its own page** (AccordionItem, Tab, TableRow, MenuItem…:
  22 new story files). Each renders the part inside its parent with a
  decorator, so its own props drive the controls. The coverage lint now
  requires each exported component to be some meta's `component`; a parent's
  `subcomponents` entry no longer counts.
- **Tests:**
  - **The kit** (`src/styles/kit.test.ts`): names and errors, selectors and
    layers, `vars()`, motion, tokens, parity with `createTheme`, and manifest
    freshness.
  - **The manifest parser** (`scripts/styleManifest.test.ts`).
  - **The studio's generator and compile path**
    (`apps/theme-studio/server/studio.test.ts`).
- **Known limits:**
  - Component overrides in a named theme are descendant selectors, so they
    add up with a nested theme's overrides. Tokens still replace.
  - The manifest lists every variable a block reads, including internal
    ones such as `--greese-button-bg`. Docs separate nothing, so the guide
    recommends tone and size variables first.

## Addendum (2026-10-19): importing existing themes

The studio imports themes made elsewhere:

- studio JSON;
- `createTheme()` options, its CSS, or a module exporting either;
- the kit's SCSS;
- hand-written CSS.

**Everything is read as CSS** (`src/importer.ts`). One reader covers every
source, because they all share the same CSS shapes: the tokens' scheme
selectors, `.greese-*` component rules and the kit's motion output.

- **SCSS** is compiled with the kit's importer first.
- **Modules** are imported and their `createTheme()` CSS taken.
- **Tokens:** the scheme of a declaration comes from its selector (`:not()`
  ignored) or a `prefers-color-scheme: dark` query. Values equal to the
  defaults are dropped, so a complete theme imports as its overrides.

Choices:

- **Nothing is dropped silently.** Rules the spec can't hold (other media
  queries, `:hover`, foreign selectors, page CSS, custom keyframes) come
  back with their CSS and a reason, to copy into the user's own stylesheet.
  Making the spec hold arbitrary CSS would turn the studio into a CSS editor
  and break its "every name is checked" guarantee.
- **Import changes the editor, not files.** Replace or merge, then save to
  `GREESE_THEME` as usual. Pointing the studio at a hand-written SCSS file
  and overwriting it with generated output would lose whatever didn't fit.
- **Paths stay inside the project.** Module imports run code in the dev
  server. Paths resolve from where npm ran, symlinks included, and anything
  outside is refused.
- **Tested by round trip:** a rich spec is generated, compiled and imported
  back, and must be equal, both as a page theme and as a named theme.
  `createTheme()` output and the Theming guide's hand-written CSS are tested
  too.
- **`keyframes`** joined the spec's motion options, so custom keyframes from
  the kit survive a round trip.

## Addendum (2026-10-19): a component preview from the docs' stories

The studio's preview shows the selected component above the gallery,
through every story on its docs page. The stories aren't copied:

- **Source:** `src/preview/stories.ts` finds the docs' story file by
  component name (`import.meta.glob`, lazily, so only the shown file loads)
  and composes it with Storybook's portable-stories API (`composeStories`
  from `@storybook/react`).
- **Order:** source order, read from the file's text, because a module
  namespace lists exports alphabetically.
- **Failures:** each story sits in an error boundary, so one failure shows
  a message rather than blanking the preview.
- **Maintenance:** a story added or changed in the docs appears in the
  studio as written.

The preview follows the Components tab and Inspect picks. The theme CSS is
injected into the same frame, so every edit shows on the stories at once.
