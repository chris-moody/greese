---
name: greese-new-component
description: Step-by-step procedure for adding a new component to @greese/react, from API design to story, tests, budgets and changeset. Use when the user asks to create, add, build or port a component (including from MUI or another codebase).
---

# Adding a greese ui component

Load `greese-conventions` first. Work through these steps in order; each one
has a check.

## 1. Decide whether it should exist

- Search `packages/react/src/components/index.ts`. Is it already covered, or
  composable from existing components? If so, add a story recipe instead of
  a component. ExportActionSelect became an ActionSelect recipe, for example.
- Is it general purpose? App-specific components (tied to a data model, a
  backend or one screen) don't belong here. Record skipped candidates and
  the reasons, as in ADR 0007's addendum or ADR 0011.
- Which native element or platform API does the job? Start from it: native
  `<select>` over a custom listbox, `<dialog>` over a portal, the Popover API
  over z-index stacks.
- Is it a new dependency? Almost certainly not; see `greese-lightweight`.

## 2. Design the API

- Props mirror the native element's (`ComponentPropsWithRef<'el'>`), plus
  only what's needed. Name things as the platform does.
- Value components take `value` / `defaultValue` / `onValueChange` (via
  `useControllableState`) and keep the native `onChange`.
- Layout-ish props are `Responsive<T>` where a per-breakpoint value is
  plausible.
- Required accessible names are required props (`label`, `actionLabel`).
- Write the TSDoc first, with `@default`s and a usage example. It becomes the
  docs.

## 3. Implement

1. Create `src/components/<Name>/<Name>.tsx`. Mirror a similar existing
   component: Chip for small interactive pieces, Input for field controls,
   Grid for responsive layout, Dialog for overlays.
2. Create `packages/ui/src/components/<Name>/<Name>.scss` (in `@greese/ui`,
   so every framework shares it) per the `greese-styles` skill, or none if it
   only composes others.
   - Every `greese-<Name>*` class you render must exist in a stylesheet; the
     CSS build fails otherwise.
   - A class block with no styles of its own needs at least a
     sensible rule, or drop the class.
3. Export it from `src/components/index.ts`, in alphabetical order.
4. Add `@use '../components/<Name>/<Name>';` to
   `packages/ui/src/styles/index.scss`,
   after the components it builds on. The build fails if a stylesheet is
   missing.
5. Pure helpers (formatters, maths, parsers) go in the component file,
   exported, so tests and consumers can use them.
6. Give it the `greese` prop: `extends …, GreeseProps`, destructure `greese`,
   and `return withGreese(<root …/>, greese)`. For a trigger plus a floating
   surface (Popover, Tooltip), wrap the surface. Box-based components inherit
   it. `check-types` fails if you forget.

**Check:** `npm run build -w @greese/react` writes
`dist/css/<Name>.css` with the right `@import`s (the dependency graph is
automatic), and `npx tsc --noEmit -p packages/react` is clean.

## 4. Unit tests

Follow `greese-testing` for steps 4, 5 and 7; in short:

Add a `describe('<Name>')` block to the matching area file in
`packages/react/src/components/` (`layout`, `forms`, `content`, `overlays`,
`gaps`, `ported`), or a new `<area>.test.tsx`. Cover:

- the role and accessible name, and `await expectNoAxeViolations(container)`;
- the controlled and uncontrolled paths, and that `onValueChange` fires with
  the right value;
- keyboard behaviour;
- responsive props resolving to the right classes and variables;
- edge cases of any exported helper.

**Check:** `npx vitest run` in `packages/react`, all passing. Keep the
coverage gate green.

## 5. Real-browser tests (when jsdom can't tell)

Layout maths, pointer and touch, focus movement, the top layer, scroll and
`getComputedStyle` all need a real browser.

- Add the fixture to a playground page (`apps/playground/src/pages/`). Add a
  new page in `src/main.tsx` and `lighthouserc.cjs` if needed.
- Add assertions to `apps/playground/e2e/<area>.spec.ts`.
- Remember these traps:
  - mobile projects use `page.touchscreen`;
  - rounded corners aren't hit-testable;
  - component CSS transitions need `expect.poll`;
  - never return a thenable (a greese.js timeline) from `page.evaluate`.

**Check:** `npx playwright test e2e/<area>.spec.ts` in `apps/playground`
passes on all five projects.

## 6. Story

Create `apps/docs/stories/<Category>/<Name>.stories.tsx`:

- `title: '<Category>/<Name>'` (the categories are Layout, Forms, Content,
  Overlays, Navigation, Motion and Utilities);
- `component: <Name>`, `subcomponents` for its parts, and a story file of
  its own for each part (`<Category>/<Part>`, rendered inside the parent
  with a decorator);
- `args` for a working Playground story first, then stories for the main
  variants and one realistic recipe;
- use the fixtures in `stories/_shared/fixtures.tsx` (icons, `Tile`, `art()`);
- keep it deterministic.

**Check:** `npm run lint -w docs` (it includes story coverage) and
`npx tsc --noEmit` in `apps/docs`.

## 7. Visual baselines

```bash
npm run build -w docs
cd apps/playground && npx playwright test -c playwright.visual.config.ts --update-snapshots -g "<category>-<name>"
```

Open a light and a dark, and a phone and a desktop, screenshot and look at
them. Things to catch: stretched badges, invisible dark-mode elements,
wrapping, overflow.

## 8. Budgets, docs, changeset

- **Size:** add a `.size-limit.cjs` entry (with `modifyRolldownConfig: external`) for interactive components; see
  `greese-lightweight`.
- **Docs:**
  - add it to `packages/react/README.md` in the right section;
  - if it introduces component-level CSS variables, add them to the table in
    `stories/guides/Theming.mdx`;
  - if it involved a real decision, write an ADR (`greese-adr` guidance is in
    `greese-update-component`).
- **Changeset:** `.changeset/<slug>.md` with `'@greese/react': minor`.

## 9. Verify and commit

Run the `greese-verify` gates, then commit with the `commit` skill. Suggested
commits:

1. `feat(react)`: the component, tests, budget, changeset and README;
2. `feat(docs)`: the story;
3. `test(playground)`: the e2e test;
4. `test(playground)`: the baselines.
