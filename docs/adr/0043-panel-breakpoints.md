# ADR 0043: Panel breakpoints, and a panel's size while it's resized

- **Status:** Accepted
- **Date:** 2026-11-09
- **Builds on:** ADR 0001 (styling model: responsive props), ADR 0021 (SCSS
  entry points), ADR 0035 (the authoring package)

## Context

A docked or floating panel is as wide as it's dragged, whatever the window.
The breakpoints every responsive prop resolves against are the viewport's,
so a layout inside a panel couldn't answer to the panel. Shaper's Properties
panel needed exactly that: short fields two or three to a row in a wide
panel, one in a narrow one. Designing those layouts also means knowing a
panel's size while you resize it.

Three ways were open:

- **More viewport keys** through `configureBreakpoints()`: they'd measure the
  window, not the panel.
- **Recompiling greese ui** with the panels' keys in `$breakpoints`: apps
  import greese ui's prebuilt CSS, and media queries still measure the
  window.
- **Container keys:** the same responsive classes, again for keys of the
  panel's own, under a container query on the panel. This is the one taken.

## Decision

### 1. Container breakpoint sets in greese ui and greese react

- **`responsive-prop`** takes a breakpoint set and a container name. With
  both, it writes the set's classes under
  `@container <name> (width >= <min>)` instead of `@media`.
- **The layout props are defined once,** in `src/styles/_layout-props.scss`:
  Stack's, Grid's and AutoLayout's. Their stylesheets include them for the
  viewport's breakpoints, and the built CSS is unchanged byte for byte.
- **`pkg:@greese/ui/scss/breakpoints`** is a new entry point. Its
  `container-set($set, $container)` writes those three components' props
  for a set measured against a named container. It refuses a viewport key,
  a dashed key, and keys out of order.
- **`addContainerBreakpoints({ key: px })`** in `@greese/react` registers the
  keys. `resolveResponsive()` then writes their classes after the viewport's.
  `useBreakpoint()` and `useBreakpointValue()` follow the viewport and leave
  them out, and `resetBreakpoints()` keeps them.
- **TypeScript:** the keys go in `BreakpointKeys`, as any added breakpoint
  does, so `Responsive<T>` takes them.
- **AutoLayout's `maxSize`** falls back to `size` at every key either sets.
  It used to walk only the five built-in keys.

### 2. Authoring's panel breakpoints

| Key       | Body at least |
| --------- | ------------- |
| `panelsm` | 240px         |
| `panelmd` | 320px         |
| `panellg` | 480px         |

- **Each panel's body is the `greese-panel` container**
  (`container: greese-panel / inline-size`), so a key measures the body that
  holds the layout.
- **`panelBreakpoints.ts` registers them** wherever the dock renders.
  `_PanelGroup.scss` writes the same values, and a unit test keeps the two
  equal.
- **Authoring's stylesheet loads after greese ui's,** in the same layer.
  Where a panel key and a viewport key both apply, the panel's wins. Inside a
  panel, use the panel keys.
- **Exports:** `panelBreakpoints`, `panelBreakpointAt(width)` and
  `PANEL_CONTAINER`.

### 3. A status bar while a panel is resized

- **When it shows:** a panel shows its body's width × height and the panel
  breakpoint in effect, along its foot. It shows only while a resize gesture
  changes its size: dragging a split's divider, a floating panel's grip, or
  arrow keys on a divider. The gesture marks its element `data-resizing`
  (`markResizing`), and each panel's ResizeObserver shows the bar only under
  that mark. A window resize or a re-docking doesn't flash it.
- **How it leaves:** it renders nothing otherwise. It leaves a moment after
  the gesture ends, sliding in and out on the theme's `--greese-duration-fast`
  and enter/exit easings, which collapse under reduced motion. A timer
  unmounts it where no transition runs.
- **Screen readers:** it's `aria-hidden`. The divider being dragged already
  announces its size.

## Consequences

- **CSS:** authoring's stylesheet grows by about 1.55 kB brotli for the
  three components' classes at three keys, a third each. The budget goes from
  7 to 8.65 kB.
- **JS:** the dock grows by about 0.37 kB (the bar and the registration), and
  greese react's whole library by about 50 B.
- **Coverage:** only Stack, Grid and AutoLayout take container keys. Box's
  and the other components' responsive props stay viewport-only, until a
  panel needs one.
- **Shaper's Properties panel** uses the keys. Its fields are EditableFields
  with the name above, in sections as Pixels' are (Shape, Fill, Stroke, Text,
  Appearance, Attributes):
  - short fields: `{ xs: 12, panelsm: 6, panellg: 4 }`;
  - paints and references: `{ xs: 12, panelmd: 6 }`;
  - path data and lists take the whole row.
- **Another library** with containers of its own does the same:
  `container-set` with its own keys, and `addContainerBreakpoints`.
