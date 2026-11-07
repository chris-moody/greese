# ADR 0035: `@greese/authoring`, the editor UI package

- **Status:** Accepted
- **Date:** 2026-11-06
- **Amends:** ADR 0014 (a sixth published package, and the first that is
  React-only by design)

## Context

Glop has three authoring studios: Pixels (graphics), Amp (sound) and Rigatron
(rigs). They share one editor framework, `@beta/ui/features/authoring`, about
22,000 lines. It covers:

- docking, with layout specs and a layout cache;
- the stage host, with rulers, guides and the grid;
- layers and the library;
- the timeline, with frames, keyframes, tweens and markers;
- per-studio Redux stores.

The studio shells around it still duplicate generic pieces: nav trails,
navbars, toolbars, tool hotkeys and cursors, and stage bars, two or three
copies of each.

Glop's framework already renders `@greese/react` controls and no longer uses
MUI. Shaper, greese's SVG editor (ADR 0038), needs the same furniture. Both
want one home for it, outside an app.

## Decision

**A new package, `@greese/authoring`**, in `packages/authoring`:

- it depends on `@greese/react`, `@greese/ui` and `@greese/icons`;
- it is versioned from its first commit, starting at `0.1.0`;
- it is not `private`, and it is published only when the owner asks.

### Entry points

| Entry                          | Holds                                                                                                                                                    | Imports React? |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `@greese/authoring/core`       | Types and pure helpers: the layout tree and its `LayoutSpec`, drop-zone geometry, `beginPointerDrag`, ids                                                | No             |
| `@greese/authoring/state`      | Redux slices, `createAuthoringStore`, selectors                                                                                                          | No             |
| `@greese/authoring`            | Components and hooks: `createAuthoringEnvironment`, `PanelDock`, the layout hooks. It re-exports `core` and `state`, so an app can import from one place | Yes            |
| `@greese/authoring/styles.css` | Every authoring stylesheet, compiled                                                                                                                     | –              |

The split keeps each layer honest:

- **`core`** runs in Node with no DOM, apart from `beginPointerDrag`, which
  only touches the DOM when it's called.
- **`state`** runs without React, so a Glop engine or a test can drive a store
  directly.

### Redux is a peer dependency

- `@reduxjs/toolkit` and `react-redux` are **peer dependencies**, as `react`
  and `react-dom` are. An app that hosts several editors (Glop hosts three,
  and Rigatron nests Pixels) needs exactly one copy of each, or the stores'
  contexts stop matching.
- This is the new runtime dependency the house rules require an ADR for. RTK
  earns it: Glop's framework is built on slices and `configureStore` (per
  studio, Glop ADR 0003), and rewriting that on a hand-rolled store would be
  the redesign the extraction is meant to avoid.
- Glop's other two small dependencies go:
  - `nanoid` → `uid()` in `core`, built on `crypto.getRandomValues`, which
    also works in insecure contexts (a phone testing over LAN);
  - `fuzzysort` → a small subsequence scorer, when search is extracted.
- `immer` arrives with RTK, so it is not a separate dependency.

### Styles live in the package

- The styles are authoring's own SCSS in `src/styles`, compiled to
  `dist/styles.css` with `@greese/ui`'s Sass kit
  (`pkg:@greese/ui/scss/mixins`).
- **This is an exception to ADR 0014.** There, `@greese/ui` owns every class.
  Authoring is React-bound through its state layer, and no second framework
  renders it, so a framework-agnostic copy of its CSS would have no user.
- **The conventions still hold:**
  - every rule sits in `@layer greese.components`;
  - classes are `greese-<Name>`, `greese-<Name>-<part>` and
    `greese-<Name>--<modifier>`;
  - values come from tokens;
  - properties are logical.

  If a second framework ever renders these components, the CSS can move into
  `@greese/ui` with no class changes.

- **The import order matters.** An app imports `@greese/react`'s styles (or
  `@greese/ui`'s) first, then `@greese/authoring/styles.css`. Both are layered,
  so this order only matters when the two style the same element.
- **Names must not collide** with `@greese/ui`'s. `@greese/ui` already has
  `Dock`, so authoring's docking is `greese-PanelDock`,
  `greese-PanelGroup` and `greese-SplitPane`.
- **Tunable values** are variables with token fallbacks, for example
  `--greese-panel-tab-font-family` (falling back to `--greese-font-mono`).

### Component rules

- **The `@greese/react` rules apply** to every exported component:
  - `ComponentPropsWithRef` props, spread onto the root;
  - `className` merged with `cx`;
  - `style` merged last;
  - TSDoc on every prop, and an example in the component's own TSDoc.
- **`'use client'`** goes on every component and hook module. Every one of them
  reads the store or a context, so none can render on the server.
- **The `greese` prop isn't required yet.** Dock chrome has no entrance worth
  animating, and `withGreese` would pull the motion runtime into every editor.
  A component that wants entrances later takes the prop then, and this ADR
  gets an addendum.
- **Tests:**
  - unit tests run on Vitest with axe;
  - Glop's Jest tests are ported as they move.
- **Docs:** every exported component needs a story page. Wiring
  `packages/authoring` into Storybook and the web app's `/docs` is the first
  step of Phase 2 (the plan's phase numbering). Until then, the spike's one
  component has no page, and that gap is known.
- **Size:** `.size-limit.cjs` budgets the entries. Editor UI is bigger than a
  button, but every budget is still raised only deliberately.

### Moved as-is, unless greese conventions require a change

- Behaviour stays the same; renames follow greese naming.
- **The first behaviour change**, in Phase 2, is keying the `panels` slice by
  workspace (Glop ADR 0007's forced hydrate on mount). That change carries its
  own note in Glop.
- Code with no consumer in Glop is left behind rather than ported:
  - `panelDock.helpers.ts`, the area/order model the split tree replaced;
  - the standalone `Panel`;
  - `DockSide`;
  - the layout-override types.

## Consequences

- **Two consumers.** Glop consumes the package by symlink
  (`scripts/link-greese.mjs`), as it does the others, and Shaper uses it in
  this repo.
- **Commit scopes.** `authoring` and `shaper` join commitlint's scope list.
- **Six published packages.** `verify:packages` packs and installs
  `@greese/authoring` as a consumer would.
- **Glop's styles get a new source.** They come from layered global classes
  instead of CSS Modules. Glop's `styles.css` imports
  `@greese/authoring/styles.css` after `@greese/react`'s.
- **`@greese/ui` already has an `EditableField`** (the property-panel field
  switchboard GLOP_PORT left out). Phase 2's fields step builds on it rather
  than porting Glop's.
