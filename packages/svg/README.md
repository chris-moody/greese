# `@greese/svg`

Type-safe SVG drawing and animation for the web. One dependency (greese.js,
whose eases it uses), no framework, about 10 kB brotli for everything and
tree-shaken per function.

It covers:

- **Paths and shapes:** a chainable path builder; typed shape specs (circle,
  rect, star, arc…); parsing, normalizing, reversing and transforming path
  data.
- **Conversion:** shapes to paths and back (exactly where possible,
  approximately otherwise), for data and for DOM elements.
- **Morphing** between any two shapes. Points and parts are matched and
  aligned, so shapes don't twist.
- **Strokes:** draw, fill, drain or offset a slice of a stroke given start and
  end percentages, or run evenly spaced dashes along it as a marquee.
- **Motion along a path**, with the element turned to face along it.
- **Definitions:** linear and radial gradients, filter primitives and presets
  (`glow`, `goo`, `grain`, `distort`), clip paths and masks. Each is rendered
  as markup or DOM, or by a framework.

Geometry needs no DOM: lengths, points along a path, bounds and morphs all run
in Node too.

```bash
npm install @greese/svg
```

```ts
import { morph, strokeControl, linearGradient, define, url, tween } from '@greese/svg'

// Morph a star into a circle.
const mixer = morph({ type: 'star', r: 40 }, { type: 'circle', r: 40 })
await tween((t) => pathEl.setAttribute('d', mixer(t)), { duration: 0.6 })

// Draw a stroke on, then run it as a marquee.
const stroke = strokeControl(lineEl, { end: 0 })
await tween((t) => (stroke.end = t * 100))
stroke.set({ end: 6, repeat: 8 })

// Gradients and filters as data, added to an <svg>'s <defs>.
define(svgEl, linearGradient({ id: 'sky', angle: 135, stops: ['#38bdf8', '#6366f1'] }))
shapeEl.setAttribute('fill', url('sky'))
```

**Animating.** Controls (`strokeControl`, `morphControl`, `followControl`,
`gradientControl`) are objects whose properties write to the element. Any
library that tweens object properties drives them, including greese.js:

```ts
animate(strokeControl(el), { end: [0, 100] })
```

The built-in `tween()` is there for pages without one. It respects
`prefers-reduced-motion`.

**For editors**, three more entries, each with its own budget so the main
one doesn't carry them:

- **`@greese/svg/markup`** (3 kB): a parser that records where every node and
  attribute is in the source, a canonical serializer (pretty or minified)
  that records where each node lands, a sanitizer, defs hoisting, id renaming
  with reference rewriting, and id adoption across reparses.
- **`@greese/svg/schema`** (3 kB): every SVG 2 element and filter primitive,
  its category, what it may hold, and its typed attributes.
- **`@greese/svg/edit`** (4 kB): segment conversion (lines, quadratics and
  arcs to cubics and back, shorthands, absolute and relative), corner, smooth
  and symmetric nodes, and freehand fitting (Schneider's method).

```ts
import { parseMarkup, serializeMarkup, sanitizeMarkup } from '@greese/svg/markup'
import { attributeSpec } from '@greese/svg/schema'
import { convertSegment, freehandPath } from '@greese/svg/edit'

const { root, notices } = sanitizeMarkup(parseMarkup(file))
attributeSpec('rect', 'rx') // { name: 'rx', type: 'length' }
convertSegment('M0 0L30 0', 1, 'C') // [['M', 0, 0], ['C', 10, 0, 20, 0, 30, 0]]
```

**React:** `@greese/react/svg` has the components: `Drawing`, `Path`,
`DrawPath`, `MarqueePath`, `Morph`, `LinearGradient`, `RadialGradient`,
`Filter` (with a component per primitive, `FeFlood`, `FeGaussianBlur`…, and
the presets `Glow`, `Goo`, `Grain` and `Distort`), `ClipPath` and `Mask`.

Full guide: **Guides/SVG** in the greese ui docs. Design decisions:
[ADR 0031](../../docs/adr/0031-svg-package.md).

MIT licensed.
