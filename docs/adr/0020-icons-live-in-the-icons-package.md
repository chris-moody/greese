# ADR 0020: Every icon lives in `@greese/icons`

- **Status:** Accepted
- **Date:** 2026-10-22
- **Amends:** ADR 0004 §5 and ADR 0012 §1

## Context

GreeseUI drew its own few icons inline: `utils/glyphs.tsx` (close, menu,
chevron, plus, minus, sort, star, check), an `<svg>` in `Checkbox` and in
`Collapsible`, and the site's own `Svg` wrapper with thirteen more. Fixtures in
the playground added two. The same shapes existed twice (a close ×, a menu, a
check, a plus were both a "glyph" and an icon in `@greese/icons`), each
hand-written with its own stroke settings, and nothing said where a new icon
goes. ADR 0012 kept `@greese/icons` apart on purpose: the library never imported
it, so the library stayed icon-agnostic.

## Decision

**One place for icons: `packages/icons/src/icons.tsx`.** An icon is an
`createIcon(name, d, options?)` export there, and everything that draws one
imports it from `@greese/icons`: the components, the site, the docs, the
playground.

**The rule.** Do not inline an `<svg>` icon and do not write a one-off `<Svg>`
component. Add the icon to the icons package. It is enforced: the shared ESLint
config (`@greese/eslint-config/react-internal`) rejects an `<svg>` element in
any `.tsx` file except tests and `createIcon.tsx`. The rule is about **icons**.
A graphic that is not one (a gradient definition, chart marks, the studio's
leader lines, an encoded image, an empty svg in a test) stays, with an
`eslint-disable-next-line no-restricted-syntax` comment that says why.

**`@greese/react` depends on `@greese/icons`** (a regular dependency, not a
peer), for the glyphs its components draw. Components still take any icon from
you: `icon`, `startIcon`, `Icon`, a custom `icon` for `Rating`, `SpeedDial` and
the rest are `ReactNode`s, and the defaults are the package's. This reverses
ADR 0012's "the library never imports it" and ADR 0004 §5's built-in glyphs; the
icon-agnostic part (you can always bring your own) stays.

**`createIcon` grew two options** so the whole set fits one function:

- `viewBox` (default 16) and `strokeWidth` (default 1.75) for icons drawn on
  another grid, such as the site's 24-unit icons at 1.8;
- `filled: true` for solid shapes (`StarFilledIcon`).

Rectangles and circles are written as arc paths. An icon whose paths are styled
apart is styled by position (`path:first-child`): `SortIcon` is an up arrow then
a down arrow, `CheckDashIcon` a check then a dash. The stylesheet picks the
active one, so the icons package knows nothing about `greese-*` classes.

New icons: `ChevronLeft` (the inline-start chevron `Pagination`, `ScrollCarousel` and
`Combobox` use), `Minus`, `Sort`, `CheckDash`, `StarFilled` and the site's
`Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`,
`Replay` and `Server`. The close, menu, check, plus, chevron-down, sun and moon
glyphs are the icons that already existed.

## Consequences

- **Size.** `createIcon` is shared and a little heavier than a bare `<svg>`: about
  0.13 kB once, and each component that draws an icon grows by the difference.
  The affected budgets rose by 0.05–0.2 kB each, and the icons package's own,
  1.5 → 1.75 kB for the whole set.
- **Look.** Icons now carry `focusable="false"` and an inline
  `display: inline-block; vertical-align: -0.125em`, which the old glyphs did not;
  the stylesheets size them as before. The plus is the icons package's, slightly
  larger than the old glyph's, so the NumberField and SpeedDial visual baselines
  change.
- **Stylesheets.** `Checkbox` and `Table` select the icon's paths by position, and
  `greese-Checkbox-check`, `-dash` and `greese-SortGlyph-*` are gone from the
  style manifest.
- **`verify:packages`** now checks the dependency the other way: `@greese/react`
  declares `@greese/icons`.
- **One more dependency edge** for a consumer of `@greese/react`, which installs
  `@greese/icons` with it; a bundler keeps only the icons the components use.
