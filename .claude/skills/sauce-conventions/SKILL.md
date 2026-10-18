---
name: sauce-conventions
description: The canonical rule set for SauceUI code, styles, tests, docs and size. Load it before writing, changing or reviewing anything in packages/react, packages/tokens, packages/sauce, apps/docs or apps/playground. The other sauce-* skills and agents build on it.
---

# SauceUI conventions

SauceUI is a mobile-first, TypeScript-first React 19 component library:

- zero-runtime CSS: SCSS compiled at build time, plus CSS custom properties;
- native elements first;
- few dependencies;
- strict size budgets.

These rules come from the ADRs in `docs/adr/` and the plan in
`docs/plans/DEVELOPMENT_PLAN.md`. When a rule here and an ADR disagree, the
ADR wins: fix this file in the same change.

**Read the ADR for the area you touch before changing it:**

| ADR                                 | Governs                                                              |
| ----------------------------------- | -------------------------------------------------------------------- |
| 0001 styling model                  | SCSS + CSS variables, cascade layers, responsive props, class naming |
| 0002 colour scheme and theming      | tokens, `data-sauce-scheme`, `createTheme`, ThemeProvider            |
| 0003 native form controls           | native inputs, Field wiring, `onValueChange`                         |
| 0004 content and disclosure         | `<details>`, media, text components                                  |
| 0005 overlays and positioning       | `<dialog>`, Popover API, anchor positioning, focus return            |
| 0006 distribution and quality gates | per-component CSS, budgets, visual/e2e/Lighthouse gates              |
| 0007 component gaps                 | Combobox, NumberField, DateField, Table, SegmentedControl            |
| 0008 sauce.js                       | the animation package (`packages/sauce`)                             |

## Workspace

| Path              | What                                                                                         |
| ----------------- | -------------------------------------------------------------------------------------------- |
| `packages/tokens` | `@sauce-ui/tokens`: tokens in `src/tokens.ts`, `createTheme`, scheme script                  |
| `packages/react`  | `@sauce-ui/react`: components in `src/components/<Name>/<Name>.tsx` + `<Name>.scss`          |
| `packages/sauce`  | `@sauce-ui/sauce` (sauce.js): animation; no dependencies, no React                           |
| `apps/docs`       | Storybook: `stories/<Category>/<Name>.stories.tsx`, guides in `stories/guides/*.mdx`         |
| `apps/playground` | Vite app driven by Playwright: e2e, visual, Lighthouse, MUI benchmark                        |

Use npm, never yarn. Node ≥ 24.

## Component code (TSX)

- **One folder per component:** `<Name>/<Name>.tsx` (+ `<Name>.scss` if it
  has styles). Export it from `src/components/index.ts`, alphabetically.
  Register its stylesheet in `src/styles/index.scss`; the build fails if you
  don't.
- **`'use client'`** goes at the top only if the component uses hooks, state
  or event handlers. Layout and text components stay server-component safe.
- **Props:**
  - `interface <Name>Props extends ComponentPropsWithRef<'el'>`, using `Omit`
    for anything you redefine;
  - every own prop has TSDoc, with `@default` where there is one. Storybook
    builds the props table from it;
  - the return type is `JSX.Element`;
  - the component's TSDoc includes a short ` ```tsx ` example.
- **Pass-through:**
  - spread the rest of the props onto the root;
  - merge `className` with `cx('sauce-<Name>', modifiers…, className)`;
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
  - `prefers-reduced-motion` is respected;
  - touch targets are at least 44px on coarse pointers;
  - control text is never below 16px on touch, so iOS doesn't zoom.
- **SauceUI ships no icons.** Accept a `ReactNode`; internal glyphs live in
  `utils/glyphs.tsx`.
- **Comments:**
  - explain _why_, not what;
  - match the density of the surrounding code;
  - no Unicode escapes pasted as raw characters: write `' '`, never a
    literal non-breaking space (ESLint rejects irregular whitespace).

## Styles (SCSS)

See the `sauce-styles` skill for detail. In short:

- all rules go inside `@layer sauce.components`, or `sauce.utilities` for
  overrides that must beat component `display`;
- classes are `sauce-<Name>`, `sauce-<Name>-<part>` and
  `sauce-<Name>--<modifier>`;
- values come from tokens (`var(--sauce-…)`), with no raw colours;
- use logical properties;
- per-instance variables are named `--sauce-<name>-<thing>`;
- stylelint enforces most of this.

## Tests

| Kind                                  | Where                                                                       | Required when                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Unit (Vitest + Testing Library + axe) | `packages/react/src/components/<area>.test.tsx`, or a new `<area>.test.tsx` | Always: behaviour, ARIA, `expectNoAxeViolations`                                                                             |
| e2e (Playwright)                      | `apps/playground/src/pages/<Page>.tsx` fixture + `e2e/<area>.spec.ts`       | Layout, real focus, top layer, pointer/touch, anything jsdom can't do. Runs on Chromium, Firefox, WebKit, Pixel 7 and iPhone |
| Visual                                | Automatic for every story (light/dark × phone/desktop)                      | Re-record baselines when a story changes                                                                                     |
| Pure helpers                          | Same unit files                                                             | Export them and test them directly (e.g. `paginationRange`, `applyMask`)                                                     |

## Docs

- **Every exported component needs a story.** `npm run lint -w docs` fails
  otherwise. A story file is `stories/<Category>/<Name>.stories.tsx` with:
  - `title: '<Category>/<Name>'`;
  - `component`, plus `subcomponents` for compound parts;
  - `args`, and a `Playground` story first.
- Stories must render deterministically: no autoplaying animation, no
  randomness, no dates. Visual tests snapshot them.
- Update `packages/react/README.md` (the component lists), and the guides,
  when behaviour or setup changes.
- Record decisions that constrain future work in a new ADR, and update the
  plan's status table.

## Size

See the `sauce-lightweight` skill. Every new interactive component gets a
`.size-limit.json` entry. Budgets are only raised deliberately, with the
reason in the commit and, if large, in an ADR.

## Shipping

- **Changesets:** any `feat`, `fix` or `perf` to a published package
  (`@sauce-ui/react`, `@sauce-ui/tokens`, `@sauce-ui/sauce`) needs a
  changeset in `.changeset/`.
- **Commits:** one-line Conventional Commits via the `commit` skill, with no
  attribution trailers.
- **Gates:** run the `sauce-verify` skill's gates before calling work done.
