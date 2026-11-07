---
name: greese-conventions
description: The canonical rule set for greese ui code, styles, tests, docs and size. Load it before writing, changing or reviewing anything in packages/react, packages/ui, packages/js, apps/docs or apps/playground. The other greese-* skills and agents build on it.
---

# greese ui conventions

greese ui is a mobile-first, TypeScript-first React 19 component library:

- zero-runtime CSS: SCSS compiled at build time, plus CSS custom properties;
- native elements first;
- few dependencies;
- strict size budgets.

These rules come from the ADRs in `docs/adr/`; ADR 0013 holds the project's
goals, phases and standing decisions. When a rule here and an ADR disagree,
the ADR wins: fix this file in the same change.

**Read the ADR for the area you touch before changing it:**

| ADR                                 | Governs                                                                                            |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| 0001 styling model                  | SCSS + CSS variables, cascade layers, responsive props, class naming                               |
| 0002 color scheme and theming       | tokens, `data-greese-scheme`, `createTheme`, ThemeProvider                                         |
| 0003 native form controls           | native inputs, Field wiring, `onValueChange`                                                       |
| 0004 content and disclosure         | `<details>`, media, text components                                                                |
| 0005 overlays and positioning       | `<dialog>`, Popover API, anchor positioning, focus return                                          |
| 0006 distribution and quality gates | per-component CSS, budgets, visual/e2e/Lighthouse gates                                            |
| 0007 component gaps                 | Combobox, NumberField, DateField, Table, SegmentedControl                                          |
| 0008 greese.js                      | the animation package (`packages/js`)                                                              |
| 0009 the `greese` prop              | motion on every component: CSS presets, lazy runtime, coverage check                               |
| 0010 SCSS kit and Theme Studio      | style manifest, `greese.overrides` layer, kit API, `apps/site/src/studio`                          |
| 0011 component gap review           | ScrollCarousel, Rating, Diff, OtpField…: native bases, what was skipped                            |
| 0012 icons package and docs rules   | `@greese/icons`, prop descriptions, docs page layout                                               |
| 0013 project scope and phases       | goals, non-goals, the phase table, React/browser/licence decisions                                 |
| 0015 extensible tokens              | `$extend` / `createTheme({ extend })`; added tokens in Theme Studio                                |
| 0016 typography system              | type variants, `--greese-type-*`, `greese-Type--*`, `typography()`                                 |
| 0017 motion scopes                  | `greese={{ scope }}`: ordered entrances across depth, lazy chunk                                   |
| 0018 one web app                    | the homepage and Theme Studio: one app, two routes, one header                                     |
| 0014 framework-agnostic packages    | `@greese/ui` owns the CSS; framework packages render its markup                                    |
| 0021 scss authoring                 | `pkg:@greese/ui/scss/{mixins,tones,floating,controls}`; Studio SCSS imports                        |
| 0020 icons package                  | every icon is `@greese/icons`'; the no-inline-svg rule                                             |
| 0019 utility classes                | utility classes from `src/utilities.ts`, naming rules, purging                                     |
| 0022 MCP server                     | `@greese/mcp`: data baked at build time, its tools; its two dependencies                           |
| 0023 shape themes and templates     | the shape themes' four rules; `apps/site/src/templates`                                            |
| 0024 shapes                         | `@greese/ui/shapes`: one geometry, parameters animate, `greese-shape-*`                            |
| 0025 theme layers                   | colors, shapes, motion: one of each, each its own spec fields; mask reveals                        |
| 0026 header, footer and anchors     | Header/Footer; sticky header sets scroll padding; hovers measured at rest                          |
| 0027 client boundaries              | what forces `'use client'`; pure parts in their own files; Field keeps context                     |
| 0028 docs in the web app            | `/docs` renders the stories and MDX; which Storybook APIs they may use                             |
| 0029 page transitions               | React's `ViewTransition` layer, greese types, two modes, config cascade, share                     |
| 0030 site on React Router           | the web app's router: Data mode, `src/router.tsx` as its vocabulary                                |
| 0031 svg package                    | `@greese/svg` (pure geometry, controls, nodes) and `@greese/react/svg`                             |
| 0032 carousel                       | Carousel: stacked slides, CSS effects, `carousel` roles, deep links are the app's                  |
| 0033 app reduced motion             | `data-greese-motion="reduce"` / ThemeProvider `motion`; `prefersReducedMotion(el)`                 |
| 0034 theme layout and resets        | `@greese/ui/theme-files`, the SCSS layout, `tokens()` adding up, `scope()`, resets, Sass utilities |
| 0035 authoring package              | `@greese/authoring`: entries, Redux peers, its own layered CSS, no `greese-Dock*` names            |
| 0036 authoring timeline             | the editor timeline plays and tweens on greese.js; what moves into greese.js                       |
| 0039 filter editor                  | authoring's `NodeGraph`; Shaper's filter editor and its pure model                                 |
| 0040 one source for easing          | curves only in greese.js; `tweenEase` for editor tween names; svg's one dependency                 |

## Workspace

| Path                 | What                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`        | `@greese/ui`, framework-free: tokens in `src/tokens.ts`, `createTheme`, the scheme script, every component's SCSS (`src/components/<Name>/<Name>.scss`), the Sass kit, the style manifest                       |
| `packages/react`     | `@greese/react`: components in `src/components/<Name>/<Name>.tsx`; styled by `@greese/ui`                                                                                                                       |
| `packages/js`        | `@greese/js` (greese.js): animation; no dependencies, no React                                                                                                                                                  |
| `packages/icons`     | `@greese/icons`: every icon (`createIcon`); `@greese/react` depends on it (ADR 0020)                                                                                                                            |
| `packages/svg`       | `@greese/svg`: SVG paths, shapes, morphs, stroke slices and definitions; no dependencies but greese.js (its eases, ADR 0040). Its React components are `packages/react/src/svg` (`@greese/react/svg`, ADR 0031) |
| `packages/mcp`       | `@greese/mcp`: the MCP server for coding assistants (ADR 0022)                                                                                                                                                  |
| `packages/authoring` | `@greese/authoring`: editor UI (docking, layout specs, a Redux store per editor), React-only with its own CSS; Redux is a peer (ADR 0035)                                                                       |
| `apps/docs`          | The docs' source: `stories/<Category>/<Name>.stories.tsx`, guides in `stories/guides/*.mdx`. Storybook runs them for authoring and visual tests; the web app renders them at `/docs`                            |
| `apps/playground`    | Vite app driven by Playwright: e2e, visual, Lighthouse, MUI benchmark                                                                                                                                           |
| `apps/site`          | The web app: the homepage at `/`, the docs at `/docs` and Theme Studio at `/studio` (`npm run studio`: edits a theme JSON, generates kit SCSS + CSS)                                                            |

Use npm, never yarn. Node ≥ 24.

## Component code (TSX)

- **One folder per component:** `<Name>/<Name>.tsx`. Export it from
  `src/components/index.ts`, alphabetically. Its styles are `@greese/ui`'s:
  `packages/ui/src/components/<Name>/<Name>.scss`, registered in
  `packages/ui/src/styles/index.scss` (the build fails if you don't). The
  classes, parts, modifiers and `data-*`/`aria-*` attributes the component
  renders are a public contract that every framework package and plain HTML
  share (ADR 0014): change them like an API.
- **The `greese` prop:** every component that draws something extends
  `GreeseProps`, destructures `greese`, and returns
  `withGreese(<root …/>, greese)` from `utils/greese.ts`. Box-based
  components get it through Box. The check in `src/test/greeseCoverage.ts`
  fails `check-types` for any exported component without it; extend its
  `Excluded` list only for components with no box of their own. Never
  import the runtime or greese.js statically from a component (ADR 0009).
- **`'use client'`** goes at the top only if the component uses state,
  effects, refs or context, or hands an element a function of its own
  (`useId` and `useMemo` work on the server). It covers the whole file, so
  a pure part goes in a file of its own, and a handler that only forwards a
  callback attaches only when given one (ADR 0027). Layout and text
  components stay server-component safe.
- **Props:**
  - `interface <Name>Props extends ComponentPropsWithRef<'el'>`, using `Omit`
    for anything you redefine;
  - every own prop has TSDoc that says what it does (a bare `@default` is
    not a description), with `@default` where there is one. Storybook builds
    the props table from it, and `npm run lint -w docs` fails on any prop
    without one (`scripts/check-prop-docs.mjs`);
  - the return type is `JSX.Element`;
  - the component's TSDoc includes a short ` ```tsx ` example.
- **Pass-through:**
  - spread the rest of the props onto the root;
  - merge `className` with `cx('greese-<Name>', modifiers…, className)`;
  - merge `style` last, so users win;
  - `ref` passes through (React 19 ref-as-prop). Use `composeRefs` when you
    need your own ref too.
- **`asChild`** is supported where a different element is plausible, via
  `Slot` (`const Root = asChild ? Slot : 'div'`).
- **State:**
  - controlled and uncontrolled via `useControllableState` (`value`,
    `defaultValue`, `onValueChange`);
  - keep the native `onChange` working alongside `onValueChange`.
- **Forms:** every control calls `useFieldControl()`, so a surrounding
  `Field` wires its label, description, error and required state.
- **Responsive props:**
  - type them as `Responsive<T>`;
  - resolve them with `resolveResponsive()` and a module-level
    `ResponsiveConfig`;
  - give tokens classes, and pass arbitrary values as inline custom
    properties;
  - never compute media queries in JS.
- **No `useEffect`-driven styling:** a style that depends on state is a
  class, a `data-*` attribute or an inline custom property.
- **Native first:** `<dialog>`, the Popover API, `<details>`, native
  inputs, CSS anchor positioning. Add JavaScript only for what the platform
  lacks, and say why in a comment.
- **Accessibility:**
  - correct roles and names;
  - icon-only controls have a required `label`;
  - keyboard support per the WAI-ARIA APG;
  - focus is visible and returned after overlays close;
  - reduced motion is respected: `prefers-reduced-motion` and the app's
    `data-greese-motion="reduce"` (JavaScript asks `prefersReducedMotion(el)`);
  - touch targets are at least 44px on coarse pointers;
  - control text is never below 16px on touch, so iOS doesn't zoom.
- **Icons live in `@greese/icons`** (`packages/icons/src/icons.tsx`).
  Components accept your icon as a `ReactNode` and default to the package's.
  **Never inline an `<svg>` icon or write a one-off `<Svg>` component:** add the
  icon to that file (ADR 0020). ESLint rejects an `<svg>` in any `.tsx`; a
  graphic that is not an icon (gradient defs, chart marks) disables the rule
  with the reason.
- **Comments:**
  - explain _why_, not what;
  - match the density of the surrounding code;
  - no Unicode escapes pasted as raw characters: write `' '`, never a
    literal non-breaking space (ESLint rejects irregular whitespace).

## Styles (SCSS)

See the `greese-styles` skill for detail. In short:

- all rules go inside `@layer greese.components`, or `greese.utilities` for
  overrides that must beat component `display`;
- classes are `greese-<Name>`, `greese-<Name>-<part>` and
  `greese-<Name>--<modifier>`;
- values come from tokens (`var(--greese-…)`), with no raw colors;
- use logical properties;
- per-instance variables are named `--greese-<name>-<thing>`;
- stylelint enforces most of this;
- a theme rule written as plain CSS (not through the kit's `component()`)
  carries its layer's reset guard: `greese.themed()` or `greese.reset-guard()`
  (ADR 0034);
- after changing a stylesheet, `npm run build -w @greese/ui` refreshes
  `src/styles/_manifest.scss` (the SCSS kit's name list); commit it. CI fails
  while it's stale.

## Tests

The testing guide is `docs/testing/README.md`; the `greese-testing` skill is
the procedure for writing them. In short:

| Kind                                  | Where                                                                       | Required when                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Unit (Vitest + Testing Library + axe) | `packages/react/src/components/<area>.test.tsx`, or a new `<area>.test.tsx` | Always: behaviour, ARIA, `expectNoAxeViolations`                                                                             |
| e2e (Playwright)                      | `apps/playground/src/pages/<Page>.tsx` fixture + `e2e/<area>.spec.ts`       | Layout, real focus, top layer, pointer/touch, anything jsdom can't do. Runs on Chromium, Firefox, WebKit, Pixel 7 and iPhone |
| Visual                                | Automatic for every story (light/dark × phone/desktop)                      | Re-record baselines when a story changes                                                                                     |
| Pure helpers                          | Same unit files                                                             | Export them and test them directly (e.g. `paginationRange`, `applyMask`)                                                     |

## Docs

- **Every exported component needs a page of its own**, compound parts
  (AccordionItem, Tab, TableRow…) included: a story file whose meta
  `component` is it. `npm run lint -w docs` fails otherwise; being in a
  parent's `subcomponents` doesn't count. A story file is
  `stories/<Category>/<Name>.stories.tsx` with:
  - `title: '<Category>/<Name>'` (a part sits beside its parent:
    `Content/AccordionItem`);
  - `component`, plus `subcomponents` on a parent for its props tabs;
  - for a part, a `decorators` entry that renders it inside its parent;
  - `args`, and a `Playground` story first.
- **The web app renders the docs too** (`/docs`, ADR 0028), so a story file
  and an MDX page must work there: stories may use args, argTypes
  (`control`, `options`), decorators, `render` and `parameters.layout`, with
  a `/** comment */` above each story as its description; MDX may use
  `Meta`, `Canvas`, `Controls`, `Source` and `Subheading`. Any other
  Storybook API needs adding to `apps/site/src/docs` first.
- **Try it can name only what's in its scope.** The live editor's scope and
  "Show code"'s component names both come from
  `apps/site/src/docs/liveScope.ts`. A new package with docs pages goes in
  `LIBRARY` there. A component a story file defines for itself goes in its
  `parameters.tryIt.scope`. A component made at runtime, such as a provider
  returned by a factory, needs a `displayName`, because a production build
  minifies function names. `src/docs/liveScope.test.tsx` compiles and renders
  every page's Try it code and fails on a missing name or an error, which
  `ReferenceError: Highlighted is not defined` (2026-11-07) and the svg
  names (2026-10-31) both would have hit.
- **Styling sections are generated.** Every docs page ends with one, built
  from the style manifest: the classes a component renders, its items, the
  components it's built on, and override examples. A part with no classes of
  its own needs an entry in `UNSTYLED` in `stories/_shared/ComponentStyles.tsx`
  saying what to target instead.
- Stories must render deterministically: no autoplaying animation, no
  randomness, no dates. Visual tests snapshot them.
- **Interactive stories keep real state.** A callback does something a
  reader can see (`setValue`, a toast), never `() => {}`; state lives in a
  `render: function Name(args) { … }` with its hooks. "Show code" then
  prints that render's whole source as a module that runs, and
  `apps/site/src/docs/storySource.test.ts` type-checks it.
- **Every animation a story or docs demo shows can be replayed.**
  - An animation that plays once (an entrance on mount, a draw-on, a morph
    in) sits in `Replay` from `stories/_shared/Replay.tsx`. `Replay` adds a
    button that remounts its children. Wrap the story's render, or use a
    decorator for a whole file.
  - A component that only animates on a change needs a way to play on mount
    (`DrawPath`'s and `Morph`'s `from`), so remounting replays it.
  - Timelines use `stories/motion/Player.tsx` instead.
  - Exempt: endless loops, and motion the visitor drives (sliders, buttons,
    navigation). A file-wide decorator skips them with
    `parameters: { replay: false }`.
  - The web app's "Try it" editor has `Replay` in scope, so snippets keep it.
- Update `packages/react/README.md` (the component lists), and the guides,
  when behaviour or setup changes.
- Record decisions that constrain future work in a new ADR, and add a row to
  ADR 0013's phase table when a body of work lands.

## Size

See the `greese-lightweight` skill. Every new interactive component gets a
`.size-limit.cjs` entry. Budgets are only raised deliberately, with the
reason in the commit and, if large, in an ADR.

## Shipping

- **Changesets:** any `feat`, `fix` or `perf` to a published package
  (`@greese/react`, `@greese/ui`, `@greese/js`) needs a
  changeset in `.changeset/`.
- **Commits:** one-line Conventional Commits via the `commit` skill, with no
  attribution trailers.
- **Gates:** run the `greese-verify` skill's gates before calling work done.
