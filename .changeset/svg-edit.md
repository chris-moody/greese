---
'@greese/svg': minor
---

Add `@greese/svg/edit`: `convertSegment` turns a segment into another command, keeping its shape where it can (lines, quadratics and arcs to cubics, cubics to quadratics and arcs by fitting, shorthands to and from their full forms, lines to and from `H` and `V`); `setRelative` and `setSegmentRelative` write a path, or one segment, relative or absolute; `nodeType` and `setNodeType` read and make corner, smooth and symmetric nodes; and `freehandPath` turns a pointer's points into a few cubics (`smoothPoints`, then `fitCubics`, Schneider's method).
