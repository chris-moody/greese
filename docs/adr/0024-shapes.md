# ADR 0024: Shapes: one geometry per element, animated by its parameters

- **Status:** Accepted
- **Date:** 2026-10-23
- **Amends:** ADR 0023 (its shape themes are rebuilt on this; its four rules stand)

## Context

The first shape themes (ADR 0023) were hand-written `clip-path` and `mask`
rules in each component's SCSS box. In use, two failures showed up, both
measured by freezing animations mid-flight.

**Borders came apart from shapes.** A bordered shape had two geometries:

- the element's own clip;
- the clip of a pseudo-element "plate" inset by the border width, or a fold
  sized separately.

They only matched at rest. The cards' entrance animated `clip-path` with
`animation-fill-mode: both`, which keeps holding the property after the
animation ends. A property held by an animation doesn't transition. So on
hover only the plate morphed, while the outer clip stayed where it was. Any
timing difference between the two geometries showed as a seam.

**Elements looked revealed by their clip.** The entrances animated the clip
itself, so the shape wiped across static content, and the moving edge had no
border. A clip also cuts anything painted outside the box: shadows, focus
outlines, and the blur and glow effects.

### SVG clip paths and layered SVG borders

We considered SVG `<clipPath clipPathUnits="objectBoundingBox">`, referenced
with `clip-path: url(#id)`, with a layered inline SVG border overlay:

| | For | Against |
| --- | --- | --- |
| `url(#id)` clip | Bézier paths, standard tools, one definition shared by every element | **Stretches with the element:** units are fractions of the box, so a 12px chamfer can't stay 12px on a 40px and a 400px wide button. **Needs markup:** the SVG must be in the same document (Chromium and WebKit ignore external files for HTML elements), so plain CSS (ADR 0014), Shadow DOM and server rendering all need it injected. **Can't animate per element:** CSS can't transition between `url()` clips, and animating the shared `<path>` animates every element. It paints as a mask, off the compositor's fast path |
| Inline SVG border overlay | An exact stroke along the shape; `vector-effect: non-scaling-stroke` keeps its width; it shares the element's transform | **An extra SVG per instance:** DOM, style and layout cost that grows with lists and tables, and a markup change in every framework package. **The same stretching.** A centred stroke loses half its width to the clip |

The overlay's lesson stands, and we keep it: everything that draws a shape
must live on one element, so a transform carries all of it together. The
mechanism doesn't fit a component library whose elements change size and
whose CSS must work without its markup.

## Decision

**A shape is points in the element's box**, in `@greese/ui/shapes`. Each
coordinate is `pct%` of the box, plus `px`, plus `k` times a named parameter,
so features keep their pixel size at any aspect ratio. A point can be
rounded; the arc is flattened into points at build time. Presets cover:

- bevel, notch and tag;
- hexagon and slant;
- dog-ear, ticket and zigzag;
- the plain rectangle;
- a free-form shield.

Anything else can be drawn in the Studio's editor.

**It compiles to one geometry, applied twice on the same element:**

- `--greese-shape-clip`: a `polygon()` the element clips itself with
  (`padding-box`, where its border layer starts).
- `--greese-shape-ring-clip`: the outline and its inner edge in one
  `evenodd` polygon. The element's own `::after` (`::before` where a
  component already uses `::after`) fills it with `--greese-shape-ring`. The
  inner edge is offset by exact miters, computed where the shape's edges keep
  their directions: a 1px border is 1px along a 45° cut too.

Both are custom properties computed on the element. The border layer
therefore inherits a ring already resolved with the element's parameters,
mid-transition included. The geometry can't come apart, because there is only
one.

**Parameters animate; `clip-path` never does.** Each parameter is a registered
`<length>` (`@property --greese-shape-<name>`, `inherits: false`, so nested
shapes don't leak into each other). States change parameters:

- hover and pressed;
- `@starting-style` for the entrance, so cards cut their corners in;
- focus.

No keyframes and no `clip-path` transitions remain to fight one another.
Entrances are the `greese` prop's transforms and opacity, which move the
clipped element whole.

**The four rules of ADR 0023 are built into the compiler:**

- **Focus:** a shape that is its box with every parameter at 0 opens to it,
  and the usual focus ring draws round it. The clip opens past the box only
  after the shape has opened, so no background shows past the cuts. Any other
  shape draws a 3px ring in the focus color inside itself.
- **Motion:** parameter transitions are inside
  `prefers-reduced-motion: no-preference`.
- **Touch:** shaped interactive components are at least 44px on coarse
  pointers.
- **Forced colors:** shapes switch off, and the system's borders and outlines
  show.

Each element's own transitions are restated alongside the parameters, from a
small per-component table, `SHAPE_TARGETS`. A clip also removes a shadow, so
an elevated card's shape gets a stronger edge instead.

**Shapes are tokens of the theme.** `ThemeSpec.shapes` names them, and
`components.<Name>.shape` assigns one to a component. Every shape is also a
`greese-shape-<name>` class for any element, with its parameters as custom
properties to tweak per instance. Theme Studio's Shapes tab edits all of it:

- points on a canvas drawn by the same compiler;
- parameters per state, previewed as they will animate;
- the border, focus, mirroring for right-to-left text, and assignment.

**Cost:**

- **No runtime.** The compiler runs in the Studio and in build scripts only:
  it's a subpath, `@greese/ui/shapes`, kept out of the main entry.
- **Size.** Each shape's geometry is written once, whatever takes it. Each
  shape theme is 1.6–2.4 kB with brotli.
- **Speed.** A shape transitioning its parameters recalculates its style each
  frame on the main thread; a `clip-path` transition alone could be
  composited. That cost buys borders that stay attached. Only hovered,
  pressed or entering elements pay it, and the `greese` prop's entrances stay
  on the compositor.

## Consequences

- The shape themes (Bevel, Ticket, Pinked, Folio) are presets of shapes and
  assignments. Their files are generated from them, and nothing is
  hand-written SCSS. Masks are gone, since a mask can't carry a border: the
  zigzags and notches are points.
- Effects that paint outside the box (blur, glow, shadows) are still clipped
  to the shape. That is inherent to clipping.
- `corner-shape`, still Chromium-only, would draw borders, shadows and
  outlines along bevel, notch and scoop corners natively. It is a candidate
  enhancement for corner-only shapes once other engines ship it. Shapes with
  edge features (tags, notches, zigzags, free forms) will still need clips.
- A component not in `SHAPE_TARGETS` takes the defaults (`::after`, the border
  token). Adding one means checking which pseudo-element is free and which
  transitions it has.
