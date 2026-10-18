---
name: greese-styles
description: How to write and change GreeseUI SCSS - cascade layers, tokens, responsive-prop mixin, logical properties, states, touch, motion, RTL, theming variables and stylelint rules. Use for any edit to *.scss in packages/react or packages/tokens, new tokens, theming changes, or visual bugs.
---

# Styling GreeseUI

Load `greese-conventions` first. ADR 0001 (the styling model) and ADR 0002
(theming) are the source of truth.

## Structure

```scss
@use '../../styles/mixins';      // breakpoints, responsive-prop, hover, component-root
@use '../../styles/controls';    // form controls only: frame(), sizes, no-zoom-font

@layer greese.components {
  .greese-Name {
    --greese-name-size: 2.5rem;   // per-instance knobs users may override (document them)

    @include mixins.component-root;
    …
  }

  .greese-Name-part { … }         // internal part: may change in a minor release
  .greese-Name--variant { … }     // public modifier
}
```

- **Layers:** the order is `greese.reset, greese.tokens, greese.theme,
greese.base, greese.components, greese.utilities`. Never write unlayered
  library CSS, and never use `!important`. Users' unlayered CSS must always
  win. Use `greese.utilities` only for things that must beat a component's own
  `display` (Show/Hide).
- **Global bundle:** register every new stylesheet in
  `src/styles/index.scss`, after the components it builds on. The build
  enforces this.
- **Class names:** a component only renders `greese-*` classes that some
  stylesheet defines. `scripts/cssGraph.ts` maps them to `dist/css/<Name>.css`
  dependencies, and the build fails on unknown classes.

## Values

| Use                                                                              | Not                                                                                |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `var(--greese-color-fg)`, `-surface`, `-accent`, `-border`, `-focus-ring`…       | Hex, `rgb()`, named colours (stylelint `color-no-hex`, `function-disallowed-list`) |
| `color-mix(in oklab, var(--greese-color-accent) 14%, transparent)` for tints     | New colour tokens for every tint                                                   |
| `var(--greese-space-N)`, `var(--greese-radius-md)`, `var(--greese-font-size-sm)` | Magic numbers, except for genuinely component-specific sizes                       |
| `var(--greese-duration-fast)` + `var(--greese-easing-standard)`                  | Literal durations: the tokens collapse under reduced motion                        |
| `inline-size`, `margin-inline-start`, `inset-inline-end`, `:dir(rtl)`            | `width` (for writing-mode-sensitive sizes), `left`, `margin-left`                  |

If a component genuinely needs literal colours (ColorPicker's spectrum and
checkerboard), disable the rule _for that file_ with a comment saying why.

Custom properties must match `--greese-kebab-case`. A private helper variable
is still `--greese-<name>-<thing>`; `--_x` is rejected.

## Responsive props

Never write per-prop media queries by hand. Use the mixin, which emits:

- the "uses" class;
- a mobile-first `var()` fallback chain per breakpoint;
- `@property` registrations with `inherits: false`, so nested instances
  never see a parent's values;
- one class per token value.

```scss
@include mixins.responsive-prop('greese-Grid', 'gap', gap, mixins.space-tokens());
@include mixins.responsive-prop(
  'greese-Thing',
  'size',
  --greese-thing-s
); // into a variable
```

Pair it with a `ResponsiveConfig` in the TSX (same `block` and `prop`).
Variables a parent passes down to children (AutoLayout's columns and gap) are
plain inheriting custom properties. Variables that must _not_ leak into
nested instances get `@property { syntax: '*'; inherits: false; }`.

## States, input and motion

- **State:** style from attributes, not extra classes. Use `:disabled`,
  `[aria-invalid='true']`, `[aria-pressed='true']`, `[data-disabled]`,
  `[data-orientation]`, `:has()`.
- **Hover:** `@include mixins.hover { … }`, so taps never leave a sticky
  hover.
- **Focus:** `:focus-visible { outline: 2px solid var(--greese-color-focus-ring); outline-offset: 2px; }`.
- **Touch:**
  - `@media (pointer: coarse)` raises hit areas to at least 44px;
  - form controls use `controls.no-zoom-font`, so text is never under 16px
    and iOS doesn't zoom;
  - drag surfaces set `touch-action: none`.
- **Motion:**
  - transitions use the duration tokens;
  - decorative animation goes inside
    `@media (prefers-reduced-motion: no-preference)`;
  - enter and exit use `@starting-style` and
    `transition-behavior: allow-discrete`.
- **Overlays:** see ADR 0005 for the top layer, anchor positioning and
  `position-try-fallbacks`.

## Theming hooks

- **Component knobs:** expose them as `--greese-<name>-<thing>` set on the
  root, so users can override them per instance. Add new ones to the table in
  `apps/docs/stories/guides/Theming.mdx`.
- **New tokens:** add them to `packages/tokens/src/tokens.ts` (both schemes
  for colours). The CSS, the Sass maps and `createTheme` keys all follow.
  Update the token reference table in the Theming guide.
- **Contrast:** check dark mode. A colour that relies on a black overlay
  (`rgb(0 0 0 / x)`) vanishes on dark surfaces; use
  `var(--greese-color-border-strong)` or a `color-mix` with a token instead.

## Checks

```bash
cd packages/react
npx stylelint "src/**/*.scss" --fix && npm run lint
npm run build            # catches unbundled stylesheets and unknown classes
npm run size             # CSS budgets: greese-ui.css ≤ 18 kB brotli
```

Then re-record and look at the visual baselines for affected stories, in
light and dark. Prettier formats SCSS; if it reflows a long `calc()` into a
stylelint error (`scss/operator-no-newline-after`), split the expression into
named intermediate variables.
