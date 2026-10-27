# ADR 0019: Utility classes

- **Status:** Accepted
- **Date:** 2026-10-21

## Context

greese ui styles through components and, for layout, typed style props on `Box`.
Those props go inline (`var(--greese-space-N)`) because a class for every
spacing prop at every breakpoint would be about 600 classes (ADR 0001). That
leaves a gap against utility-first frameworks (Tailwind, Bootstrap utilities):
plain HTML, or a framework package, has no one-class way to say `padding-top`,
`text-align: center` or `justify-content: space-between`. The old spacing
classes (`t b l r x y s e` suffixes) were removed with nothing replacing them.

## Decision

**A utility set in `@greese/ui`, defined once, and written only as far as a
project uses it.**

### One definition

`packages/ui/src/utilities.ts` is the table: for each class stem, the property
it sets and its values, drawn from the tokens (the spacing scale, every color
role, radius, shadow, z-index, font weight, line height, font family) or from
the property's own keywords. `dist/utilities.css`, the purged output, the Vite
plugin and the docs all come from it, as the effects do (ADR 0009 §10a).

### Names: the property and the value, never another framework's words

`<property>-<value>`: `display-flex`, `text-center`,
`justify-content-between`, `flex-dir-col`, `overflow-hidden`.

- **No prefix.** A class is a property and a value, which is what the
  frameworks it will sit beside use too, and nothing here tries to avoid them:
  the names are the CSS's own. Component classes are all `greese-*`, so they
  can't collide. A project that wants a namespace sets `prefix` (`g` gives
  `g-p-4`).
- **Token-valued groups use the token's name**: `bg-primary`,
  `color-fg-muted`, `radius-md`, `shadow-lg`, `z-modal`,
  `font-weight-bold`.
- **Abbreviations are few, and listed**: `m` margin, `p` padding, `w` width,
  `h` height, `min-w`/`max-w`/`min-h`/`max-h`, `z` z-index, `bg`
  background-color, `pos` position, `vis` visibility, `flex-dir` flex-direction,
  `text` for text-align (`text-center`), `upper`/`lower` for
  uppercase/lowercase, and `col`/`cols` wherever the word is column(s)
  (`flex-dir-col`, `grid-template-cols-3`, `grid-col-span-2`,
  `grid-auto-flow-col`).
- **Spacing takes a side**: `t b l r` (physical), `x y` (the inline and block
  axes) and `s e` (inline start and end, which follow the writing direction):
  `pt-3`, `mx-auto`, `ms-2`, `gap-x-4`. Sizing is logical
  (`inline-size`, `block-size`).
- **Type size and radius have no class of their own**: type size is a variant
  (`greese-Type--h2`), radius a token (`radius-md`).
- **Variants go first**: a breakpoint key (`md-display-flex`,
  mobile first, from the build's breakpoints) or `hover` (`hover-opacity-75`,
  only where hover exists). Only groups where it makes sense opt in: spacing,
  width and height, display, position, overflow, flex and grid, `text-align`,
  `order`; color, opacity, shadow and text-decoration take `hover`.

### Coverage

Nine groups: **spacing** (margin, padding, gap), **sizing** (size, min/max,
aspect ratio, object-fit), **layout** (display, position, inset, z-index,
overflow, visibility, box-sizing, float), **flex**
(direction, wrap, flex, grow, shrink, order, justify and align properties),
**grid** (templates, spans, auto-flow), **typography** (alignment, transform,
decoration, wrap, overflow, white-space, word-break, weight, style, family,
line height, `truncate`, `line-clamp-N`), **border** (width on every
side, style, radius, shadow), **color** (color, background, border-color) and
**effects** (opacity, cursor, pointer-events, user-select, transition). About
2,300 classes in the full set, 7 kB brotli.

### Layer

`@layer greese.utilities`, where style props and the `greese` prop already
are, so a utility beats a component's own style without `!important`. Between
utilities, order decides: plain, then `hover`, then each breakpoint smallest
first; the border colors come after the sides.

### Purging: written from what the source uses

The full set is opt-in (`@greese/ui/utilities.css`). To ship only what's
used, **`purgeUtilities({ content })`** scans text for whole-word class names
and writes just those, in the same order. Three ways to run it, one
implementation:

- the `greese-utilities` command (`--content "src/**/*.tsx" --out
utilities.css`);
- a **Vite plugin**, `greeseUtilities({ content })` from `@greese/ui/vite`,
  serving `virtual:greese-utilities.css` and refreshing when a scanned file
  changes;
- the API (`@greese/ui/utilities`, `@greese/ui/utilities-files`).

A class counts when its name appears anywhere in the content; one built from
pieces (`` `p-${n}` ``) does not, and goes in `safelist` (names or
patterns). There is no CSS parser, no PostCSS and no new dependency: the CSS
is generated from the table, so there is nothing to parse. It is a build step
a project adds, not magic at install time; bundlers other than Vite use the
command.

### Options (the Bootstrap-style API)

`generateUtilities` and the purge take `groups` (only these), `prefix`, and
`breakpoints` (the build's, when a project adds keys), so a project writes the
set it wants. A project's own classes or values are added in its own CSS in
`greese.utilities`; the table is the library's.

## Consequences

- Plain HTML gets a complete low-level vocabulary beside the components, and
  frameworks can use it through `className`.
- Utilities and style props overlap on purpose: props are typed and inline for
  components in React; utilities are classes for markup and for anything not
  rendered by a greese ui component.
- `greese.css` does not include them. The full set is 7 kB brotli; the purged
  one is whatever a page uses.
- Dynamically built class names must be safelisted. The tool cannot see them.
- Negative margins, arbitrary values (`p-[13px]`), `dark:` and group/peer
  variants are not in this set; token values keep themes working, and dark mode
  is the color tokens' job (ADR 0002).
