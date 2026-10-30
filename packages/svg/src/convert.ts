import type { FlattenOptions } from './measure.ts'
import { node, toElement } from './node.ts'
import {
  elementToPath,
  formatPoints,
  pathToPolygons,
  pathToShape,
  type ShapeSpec,
} from './shapes.ts'

const GEOMETRY = new Set([
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'width',
  'height',
  'x1',
  'y1',
  'x2',
  'y2',
  'points',
  'd',
])

/** A spec as its native element's node: `<circle>`, `<rect>`, `<polygon>`… */
export const shapeElement = (spec: ShapeSpec) => {
  switch (spec.type) {
    case 'circle':
      return node('circle', { cx: spec.cx ?? 0, cy: spec.cy ?? 0, r: spec.r })
    case 'ellipse':
      return node('ellipse', {
        cx: spec.cx ?? 0,
        cy: spec.cy ?? 0,
        rx: spec.rx,
        ry: spec.ry,
      })
    case 'rect':
      return node('rect', {
        x: spec.x ?? 0,
        y: spec.y ?? 0,
        width: spec.width,
        height: spec.height,
        rx: spec.rx,
        ry: spec.ry,
      })
    case 'line':
      return node('line', { x1: spec.x1, y1: spec.y1, x2: spec.x2, y2: spec.y2 })
    case 'polyline':
    case 'polygon':
      return node(spec.type, { points: formatPoints(spec.points) })
    case 'path':
      return node('path', { d: spec.d })
    default: {
      // Regular polygons and stars have no element of their own.
      const [polygon] = pathToPolygons(spec)
      return node('polygon', { points: formatPoints(polygon?.points ?? []) })
    }
  }
}

const replace = (el: Element, spec: ShapeSpec): SVGElement => {
  const next = toElement(shapeElement(spec), el.ownerDocument)
  for (const { name, value } of el.attributes)
    if (!GEOMETRY.has(name)) next.setAttribute(name, value)
  next.append(...el.childNodes)
  el.replaceWith(next)
  return next
}

/**
 * Swaps a shape element in the DOM for another kind, keeping its other
 * attributes (class, fill, stroke…) and children:
 *
 * - `'path'`: any shape becomes a `<path>`, so it can be morphed or drawn;
 * - `'shape'`: a `<path>` becomes the simple element it draws exactly
 *   (`<circle>`, `<rect>`, `<polygon>`…), or, with `approximate`, a
 *   `<polygon>`/`<polyline>` of its flattened curves. A path that is
 *   neither, or has several subpaths, is left as it is.
 *
 * Returns the element now in the DOM.
 */
export const convertElement = (
  el: Element,
  to: 'path' | 'shape',
  options: FlattenOptions & { approximate?: boolean } = {}
): Element => {
  if (to === 'path') {
    return el.localName === 'path'
      ? el
      : replace(el, { type: 'path', d: elementToPath(el) })
  }
  if (el.localName !== 'path') return el
  const d = el.getAttribute('d') ?? ''
  const exact = pathToShape(d)
  if (exact) return replace(el, exact)
  if (!options.approximate) return el
  const polygons = pathToPolygons(d, options)
  return polygons.length === 1 ? replace(el, polygons[0]!) : el
}
