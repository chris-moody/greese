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

Mixins now read Sass values from `@greese-ui/tokens/scss/maps`, which emits no
CSS, so compiling one component never drags the token stylesheet in with it.

### 2. Custom breakpoints: values yes, keys no

Breakpoint values are compile-time constants (media queries can't read
variables). The published SCSS entry forwards a `$breakpoints !default`:

```scss
@use 'pkg:@greese-ui/react/scss' with (
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
**The keys stay `xs`–`xl`**, and the SCSS fails the build if they change. Keys
are baked into every generated class name, every `Responsive<T>` type and
`resolveResponsive`. Custom keys would need TypeScript module augmentation _and_
a matching runtime list _and_ a recompile, all of which would have to stay in
sync, and changing values covers almost every real need.

### 3. Quality gates

| Gate                     | What it proves                                                                                                                                   | Where                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Unit (Vitest + axe)      | Behaviour, ARIA, coverage gate on `resolveResponsive`                                                                                            | CI                       |
| E2E (Playwright)         | Real layout, keyboard, top layer: Chromium, Pixel 7, Firefox, WebKit, iPhone 15                                                                  | CI                       |
| **Visual regression**    | Every story × light/dark × phone/desktop (572 screenshots)                                                                                       | CI (Linux image) + local |
| **Lighthouse**           | Performance ≥ 0.95, accessibility ≥ 0.95, best practices ≥ 0.95, LCP < 2 s, TBT < 100 ms, CLS < 0.05 on every playground page, mobile throttled  | CI                       |
| **Package verification** | The tarballs as a consumer installs them: Node ESM + SSR, types (bundler and nodenext), SCSS recompilation, per-component imports, Vite bundling | CI                       |
| Size budgets             | Whole library and tree-shaken components                                                                                                         | CI                       |

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
- **Colour scheme:** the toolbar's scheme is applied from the globals channel,
  so it reaches docs pages too, and the docs container uses a Storybook theme
  built from GreeseUI's tokens for the resolved scheme. Storybook's default
  docs theme is static light, which left dark-mode text on a white page.

The site is hosted on GitHub Pages at `/storybook/`, beside the homepage and
Theme Studio (`.github/workflows/pages.yml`; ADR 0013). `firebase.json`
remains for Firebase Hosting from `apps/docs/storybook-static`.
