# ADR 0014: Framework-agnostic packages under `@greese`

- **Status:** Accepted (the table's `@greese/icons` row: `@greese/react` now depends on it, [ADR 0020](0020-icons-live-in-the-icons-package.md); `@greese/authoring` is React-only and owns its CSS, [ADR 0035](0035-authoring-package.md))
- **Date:** 2026-10-20
- **Supersedes:** the package names and the "React-first" scope in ADR 0013.
  Nothing had been published, so nothing breaks.

## Context

greese ui began as a React library, and its stylesheets lived inside the React
package. But the styling is already framework-free: compiled CSS, `greese-*`
classes, `--greese-*` variables, and state expressed in `aria-*` and
`data-*` attributes. A plain HTML page, or a Svelte, Vue or Angular app,
could use all of it if the CSS weren't bundled with React. More framework
packages are planned, so the CSS needs a home that none of them owns.

## Decision

One npm scope, `@greese`, and four packages from this repository, published
together by the same Changesets release:

| Package         | Holds                                                                                                                           | Depends on                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `@greese/ui`    | Tokens, the whole stylesheet, per-component CSS, `base.css`, the Sass kit, the style manifest, `createTheme`, the scheme script | nothing                                |
| `@greese/js`    | greese.js, the animation library                                                                                                | nothing                                |
| `@greese/react` | React components that render `@greese/ui`'s markup, and the `greese` prop's runtime                                             | `@greese/ui`, `@greese/js`; react peer |
| `@greese/icons` | Optional line icons                                                                                                             | react peer (for now)                   |

Later: `@greese/svelte`, `@greese/vue`, `@greese/angular`, each with the same
two dependencies as `@greese/react`.

### The CSS is `@greese/ui`'s

- **Entry points:** `styles.css` (everything), `base.css`, `css/<Name>.css`
  (one component's own CSS, importing `css/core.css`), `tokens.css`,
  `palette.css`; the Sass `scss` (full stylesheet, configurable), `scss/kit`,
  `scss/tokens`, `scss/layers` and `scss/maps`; `style-manifest.json`.
- **No framework knowledge.** What a component _needs_ besides its own CSS
  (a Dialog renders a Button) is a fact about how a framework renders it, so
  each framework package works it out from its own components and writes its
  own per-component stylesheets. `@greese/react`'s are one-line `@import`s
  of `@greese/ui`'s. They also let an app that installs only
  `@greese/react` write `import '@greese/react/styles.css'`, resolved from
  the package that depends on `@greese/ui` (so strict package managers work).
- **The manifest is split the same way.** `@greese/ui`'s
  `style-manifest.json` lists each style block's parts, modifiers, responsive
  props, attributes and variables, read from the compiled CSS.
  `@greese/react`'s `component-styles.json` says which blocks each React
  component renders. The docs and Theme Studio read both.
- **Dependencies point one way.** `@greese/ui` never imports a framework, and
  a check (`verify:packages`) fails if it gains a dependency.

### The markup is a public contract

Because several packages and plain HTML share the CSS, the classes, parts,
modifiers and state attributes a component renders are its public API, and
changing one is a breaking change for every framework package. (ADR 0001
called part classes internal; that holds only until a second package
depends on them.) The style manifest is the machine-readable form, and the
docs' Styling sections generate from it.

### Plain HTML

`@greese/ui` is enough for a static page: a `<link>` to `styles.css`, the
documented classes, and the scheme script for the color scheme. Native
elements need nothing more (`<dialog>`, `<details>`, form controls,
`popover`). Widgets that need keyboard logic (Tabs, Combobox, Menu,
ScrollCarousel…) need behaviour on top of the CSS: 42 of the React components run
JavaScript today.

### Next: shared behaviour

That behaviour is currently written inside the React components. To avoid
rewriting it per framework, it should become framework-free modules in
`@greese/js`, plain functions that attach to an element and that each
framework wraps. That's a separate piece of work, with its own ADR; this one
only keeps the path open by putting the CSS and the contract in the right
place.

## Consequences

- Package and import names changed everywhere: `@greese/react`,
  `@greese/ui` (was `@greese-ui/tokens`), `@greese/js` (was
  `@greese-ui/greese`), `@greese/icons`. Directories follow:
  `packages/ui`, `packages/js`.
- The built `greese.css` is byte-identical to the previous
  `greese-ui.css`, and every per-component dependency is the same, so no
  visual baseline changes.
- `@greese/react` no longer ships SCSS or the Sass kit; use
  `pkg:@greese/ui/scss/kit`. Its CSS paths (`styles.css`, `base.css`,
  `css/*`) still work.
- CSS size budgets belong to `@greese/ui` (`.size-limit.cjs`); JavaScript
  budgets stay with `@greese/react` and `@greese/js`.
- Component SCSS is edited in `packages/ui`, and the commit scopes are `ui`,
  `react`, `js` and `icons`.
- The `greese` npm scope (an organisation) must exist before the first
  release.
