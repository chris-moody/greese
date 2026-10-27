# ADR 0006: Distribution and quality gates for 1.0

- **Status:** Accepted
- **Date:** 2026-10-17

## Decisions

### 1. Per-component stylesheets with automatic dependencies

As well as `styles.css` (everything, about 13 kB brotli), the package ships
`css/<Component>.css`. Each one starts with `@import`s:

- `core.css`, which holds the layer order and tokens;
- the stylesheets of the components it builds on, e.g. `Dialog.css` imports
  `IconButton.css`, which imports `Button.css`.

Bundlers inline these and de-duplicate shared imports: `verify-packages`
checks that Vite bundles Dialog + Button with Button's rules exactly once and
nothing unrelated.

The dependencies aren't maintained by hand. `scripts/cssGraph.ts` reads each
component's TSX for the `greese-*` classes it renders and the components it
imports, maps each class to the stylesheet that defines it, and drops
components with no styles of their own (Slot). **The build fails** if a
component references a class block that no stylesheet defines. To make the
graph acyclic, the styles Checkbox, Radio and Switch share moved into
ChoiceGroup, and Text's size scale moved to a `_type` partial.

Mixins now read Sass values from `@greese/ui/scss/maps`, which emits no
CSS, so compiling one component never drags the token stylesheet in with it.

### 2. Custom breakpoints: fixed at build time, values and added keys

Breakpoint values are compile-time constants (media queries can't read
variables). The published SCSS entry forwards a `$breakpoints !default`:

```scss
@use 'pkg:@greese/ui/scss' with (
  $breakpoints: (
    xs: 0px,
    sm: 480px,
    md: 768px,
    lg: 1024px,
    xl: 1440px,
  )
);
```

`configureBreakpoints()` gives the hooks and Sidebar the same values in JS.
**Keys can be added (2026-10-20).** `xs`–`xl` must stay, because component
SCSS uses them, but a build may add keys (`tablet: 700px`), smallest first
and one word each. The SCSS mixins already loop over the map, so every key
gets its responsive classes. Three things follow, and stay in sync by
convention and test:

- **A custom property per key**, `--greese-breakpoint-<key>`, in the token
  layer (the defaults in `tokens.css`; a build with its own breakpoints
  redeclares them all). They're for reading in CSS and JavaScript; media
  queries can't use them. They're not themable, because the media queries
  they describe can't change after the build.
- **JavaScript**: `configureBreakpoints({ tablet: 700 })` registers the key
  (ordered by value) for `useBreakpoint`, `resolveResponsive` and Sidebar.
- **TypeScript**: a key is added to the `BreakpointKeys` interface of
  `@greese/ui` by module augmentation, which `Responsive<T>` follows.

Editing breakpoints stays a build-time act: once the CSS is built, it's a done
deal. Theme Studio does that build (2026-10-20): editing a breakpoint or adding a
key makes it compile the whole stylesheet with the new `$breakpoints` (once per
set of them; the theme part is compiled alone on each edit, against the
`@greese/ui/scss/config` entry, which loads the settings and emits no CSS), and
the preview uses the result. In the browser that means shipping every
component's SCSS as a lazy chunk.

### 3. Quality gates

| Gate                     | What it proves                                                                                                                                   | Where                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Unit (Vitest + axe)      | Behaviour, ARIA, coverage gate on `resolveResponsive`                                                                                            | CI                       |
| E2E (Playwright)         | Real layout, keyboard, top layer: Chromium, Pixel 7, Firefox, WebKit, iPhone 15                                                                  | CI                       |
| **Visual regression**    | Every story × light/dark × phone/desktop (1,192 screenshots as of 2026-10-26)                                                                    | CI (Linux image) + local |
| **Lighthouse**           | Performance ≥ 0.95, accessibility ≥ 0.95, best practices ≥ 0.95, LCP < 2 s, TBT < 100 ms, CLS < 0.05 on every playground page, mobile throttled  | CI                       |
| **Package verification** | The tarballs as a consumer installs them: Node ESM + SSR, types (bundler and nodenext), SCSS recompilation, per-component imports, Vite bundling | CI                       |
| Size budgets             | Whole library and tree-shaken components                                                                                                         | CI                       |

How each layer is written and run is in the testing guide,
[`docs/testing/README.md`](../testing/README.md).

**Visual baselines are per platform**, because font rendering differs. Local
macOS baselines are committed. Linux baselines are recorded by the Visual
workflow inside `mcr.microsoft.com/playwright`, so they're deterministic; it
needs one manual run with `update` and the artifact committed. Until then the
workflow posts a notice instead of failing. The local Docker installation
couldn't run, so the Linux baselines couldn't be recorded here.

INP can't be measured by Lighthouse (it needs real interactions). Total
Blocking Time is its lab proxy, and interaction latency is benchmarked
against MUI (`npm run bench`).

### 4. Docs site

Storybook with `@storybook/addon-docs`:

- **Guides** (MDX, with GitHub-flavoured tables): introduction, getting
  started, theming, responsive props, accessibility, and an MUI migration
  table.
- **Component pages:** one stories file per component, each with an autodocs
  page and a props table generated from the TSDoc already on every prop.
  Compound parts (TabList, MenuItem…) are listed as `subcomponents`.
  `scripts/check-story-coverage.mjs`, part of the docs `lint` task, fails if
  an exported component appears in no story meta. (Since 2026-10-19, parts
  need a page of their own too: see ADR 0010.)
- **Color scheme:** the toolbar's scheme is applied from the globals channel,
  so it reaches docs pages too, and the docs container uses a Storybook theme
  built from greese ui's tokens for the resolved scheme. Storybook's default
  docs theme is static light, which left dark-mode text on a white page.

The site is hosted on GitHub Pages at `/storybook/`, beside the homepage and
Theme Studio (`.github/workflows/pages.yml`; ADR 0013).
