# ADR 0023: Shape themes and page templates

- **Status:** Accepted; the shape themes' mechanism is replaced by ADR 0024
- **Date:** 2026-10-23

## Context

A theme could change tokens, component styles and motion (ADR 0010), but every
preset only changed colors and radii, so a greese ui site always had the same
rounded rectangles. CSS can draw far more than that:

- `clip-path` polygons, circles and insets;
- masks made of gradients;
- animating a clip between two shapes.

Shapes cost something, though. A clip or a mask also cuts off:

- the focus outline, which is drawn outside the box;
- the hit area a touch target extends past the box;
- the shadow.

There was also no example of a whole page built with greese ui, to start a
project from or to show a theme on.

## Decision

### Shape themes

**A shape theme is a Studio preset plus component SCSS.** `SHAPES` in
`apps/site/src/studio/shapes.ts` holds Bevel, Ticket, Pinked and Folio. Each
one sets colors and radii, and writes into the Button, Card, Alert, Badge and
Dialog SCSS boxes, which apply in `greese.overrides`. Choosing one replaces any
other shape. A color preset chosen later keeps the shapes, and "No shapes"
removes only the shapes' styles.

**The files are generated and shipped.** `npm run themes -w site` writes
`@greese/ui/themes/<id>.scss` (kit source) and `<id>.css` (compiled). They hold
the shape styles only, so they work with any color theme. A test fails while
the files are stale. The homepage and templates load the CSS of the shape the
visitor picked. The Studio's preview compiles it like any other theme.

**Every shape follows four rules.** `server/shapes.test.ts` checks the first
three:

1. **Focus stays visible.** A polygon reaches past the box by a `--…-grow`
   length, with each cut kept on its line, so the outline still shows. Where
   it can't (a tag's point), the shape lifts on `:focus-visible`. A mask always
   drops on `:focus-visible`.
2. **Motion is optional.** Every transition and entrance is inside
   `motion-safe`. A shape is still drawn under reduced motion; it just doesn't
   move.
3. **A transition restates the component's own list.** `transition` replaces
   the whole list, so a shape repeats Button's or Card's transitions and adds
   `clip-path` to them.
4. **Touch targets stay 44px.** A shaped button is at least 44 × 44px on
   coarse pointers, because the clip also clips the hit area. Elevated cards
   get a border instead of their shadow.

**Animation interpolates between shapes of the same kind.** The transitions
and keyframes go between polygons with the same number of points, or between
circles, or between insets, so the browser can interpolate them:

- Bevel's cuts slide from one diagonal to the other;
- Ticket's point stretches;
- Folio's lean straightens;
- entrances wipe a polygon in from a sliver, or grow a circle.

Pinked's hover splash is a `circle()` growing on a layer under the label.

### Page templates

**Six templates are site routes**, at `/templates/<id>`:

- finance;
- admin;
- mail;
- blog;
- saas;
- store.

Each is one file in `apps/site/src/templates`. It uses only greese ui
components, `@greese/icons`, and the few `tpl-*` layout rules in
`templates.scss`. There are no images: cover art is CSS gradients. Templates
wear the visitor's theme, shapes included. `@greese/mcp` serves their source.

## Consequences

- Six icons joined `@greese/icons` for the templates: Archive, Cart, Inbox,
  Send, TrendUp and TrendDown. With the header's Save, Import, Sliders and
  Inspect, the whole set grew from 1.75 kB to 2.03 kB (brotli), so its budget
  rose to 2.25 kB. One tree-shaken icon still costs the same (387 B).
- A shape theme only reshapes the five components it names. Others keep the
  library's shapes.
- Clipped elements lose their shadows, and anything drawn outside them. A
  component that later draws outside its box (a badge on a corner, say) will
  be cut by a shape and will need its own rule.
- The router gained a third route. The build writes `templates/…/index.html`
  for direct visits.
