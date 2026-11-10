# ADR 0041: Path booleans that keep curves, and Shaper's Cutout tool

- **Status:** Accepted
- **Date:** 2026-11-09
- **Builds on:** ADR 0031 (`@greese/svg`)

## Context

Shaper and the icon editor needed a Cutout tool: choose shapes, draw a
cutter (a rectangle, ellipse, circle, regular polygon, star, polygon, path
or freehand outline), and get each shape back as one `<path>` without the
cutter's area. ADR 0031 had left path booleans as "not done", and nothing
in greese or Glop could subtract one outline from another.

There were three ways to do it:

- **A library** (Clipper, polygon-clipping, polybool). Each is a runtime
  dependency, and each works on polygons, so curves come back as many short
  lines.
- **Flatten, then clip polygons.** No dependency, and robust, but a circle
  cut from a circle comes back as dozens of points. That bloats icons, which
  are budgeted by the byte, and is awkward to edit by hand.
- **Subtract the curves themselves.** Split both outlines where their
  cubics cross, keep the right pieces, and join them back up. More code,
  but the result is as small as the drawing.

Most icons are strokes, not fills, so "cut" had to mean something for a
shape with no fill. Pixels was also considered, but its path step holds one
contour, so a cut could leave nowhere for a hole to go.

## Decision

- **`@greese/svg/boolean`**, an entry of its own with its own budget
  (4.8 kB, measured 4.69 kB; most of it is the path parser the main entry
  also has). It exports `subtractPath(subject, cutter, options)`, which
  returns `{ d, changed }`.
- **Curves are kept.** Both paths become cubics (`toCubics`) and every pair
  of segments is intersected:
  - two lines exactly;
  - a curve against a line by the roots of a cubic in the line's frame;
  - two curves by subdividing their control boxes.

  Each segment is split at its crossings. The subject's pieces outside the
  cutter are kept, and so are the cutter's pieces inside the subject,
  reversed. The pieces are joined end to start, and runs cut from one
  segment are joined back into that segment's span. A straight piece is
  written as `L`, a curved one as `C`.

- **Shared edges are decided by direction, not position.** Where two
  segments lie along each other, they give only the two ends of the stretch
  they share. A subject piece that lies on the cutter's edge stays only if
  it runs against the cutter there. A cutter piece on the subject's edge
  never stays, so an edge is never drawn twice.
- **Holes wind against their outlines.** Before the cut, the cutter is
  turned to the subject's way round, so its reversed pieces make holes that
  `nonzero` leaves empty. Under `fillRule: 'evenodd'`, the subject's own
  loops are first turned by how deeply they're nested.
- **Open subpaths** are filled as if closed by default, as SVG fills them.
  With `openPaths: 'trim'` they're lines instead: what lies inside the
  cutter is cut out, leaving gaps.
- **Tolerances scale with the drawing:**

  | Tolerance      | Size                       |
  | -------------- | -------------------------- |
  | Intersection   | 10⁻⁷ of the drawing's size |
  | Joining pieces | 10⁻⁵                       |
  | "On an edge"   | 10⁻⁴                       |

  So a 16-unit icon and a 2000-unit poster behave alike.

- **Shaper's Cutout tool** (`x`) is the first user: choose shapes, draw a
  cutter, and each comes back as one `<path>`, with curves kept. The tool is
  recorded in Shaper's own ADR 0041, in [Shaper's repository](https://github.com/chris-moody/shaper/tree/main/docs/adr).
- **The icon editor** gets the tool with Shaper, and `ScissorsIcon` is new
  in `@greese/icons`.
- **Pixels doesn't get it**, by the user's choice. Its single-contour path
  steps would need sub-paths first.

## Consequences

- Cuts are as small as the drawing: a crescent of two circles is a few
  arcs. Tests check areas against exact values for 300 seeded grid
  rectangles, with shared edges and corners. They also check
  `area(A − B) − area(B − A) = area(A) − area(B)` for seeded circles,
  rectangles and regular polygons.
- A subject that crosses itself is taken as drawn: its own crossings aren't
  split. That's right for the outlines an editor makes, but not for every
  imported path.
- Two curves that touch along a tangent can split into tiny pieces. The
  joining tolerance closes them up, but they can leave an extra node.
- Union and intersection aren't done. They reuse the same splitting and
  joining with other keep rules, so they can be added to the same entry,
  within its budget or by raising it deliberately.
- `@greese/icons`' "every icon" budget rose from 7.6 to 7.7 kB for
  `ScissorsIcon`.
