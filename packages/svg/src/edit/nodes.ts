import { absolutize, type AbsoluteSegment, type PathData, type Point } from '../path.ts'
import { convertSegment, segmentContexts, segmentEnd } from './segments.ts'

/**
 * How a node's two handles relate: `corner` independent, `smooth` in one
 * line (the curve has no kink), `symmetric` in one line and of equal length.
 */
export type NodeType = 'corner' | 'smooth' | 'symmetric'

/** A node's handles: the control coming in and the one going out, where they're cubics. */
export interface NodeHandles {
  /** The node: segment `index`'s end point. */
  point: Point
  /** The incoming cubic's second control. */
  in?: Point
  /** The outgoing cubic's first control. */
  out?: Point
}

/**
 * The node at the end of segment `index`, and its handles. A handle exists
 * where the segment in (or out) is a `C`; others have none yet.
 */
export const nodeHandles = (input: PathData, index: number): NodeHandles | undefined => {
  const segments = absolutize(input)
  const contexts = segmentContexts(segments)
  const segment = segments[index]
  if (!segment) return undefined
  const point = segmentEnd(segment, contexts[index]!)
  const next = segments[index + 1]
  return {
    point,
    ...(segment[0] === 'C' && { in: [segment[3], segment[4]] as Point }),
    ...(next?.[0] === 'C' && { out: [next[1], next[2]] as Point }),
  }
}

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]]
const length = (v: Point) => Math.hypot(v[0], v[1])

/**
 * What a node is: `smooth` when its handles line up (within `angle`
 * radians), `symmetric` when they're also equally long (within `epsilon`),
 * else `corner`. A node with fewer than two handles is a corner.
 */
export const nodeType = (
  input: PathData,
  index: number,
  { angle = 1e-3, epsilon = 1e-3 } = {}
): NodeType => {
  const handles = nodeHandles(input, index)
  if (!handles?.in || !handles.out) return 'corner'
  const into = sub(handles.point, handles.in)
  const out = sub(handles.out, handles.point)
  const a = length(into)
  const b = length(out)
  if (a < epsilon || b < epsilon) return 'corner'
  const cross = (into[0] * out[1] - into[1] * out[0]) / (a * b)
  const dot = (into[0] * out[0] + into[1] * out[1]) / (a * b)
  if (Math.abs(cross) > Math.sin(angle) || dot < 0) return 'corner'
  return Math.abs(a - b) < epsilon ? 'symmetric' : 'smooth'
}

/** A changed path, and where the node now is (an arc made cubics shifts it). */
export interface NodeEdit {
  segments: AbsoluteSegment[]
  index: number
}

/**
 * Makes the node at the end of segment `index` a corner, smooth or
 * symmetric. The segments either side become cubics first, keeping their
 * shape, so the node has handles; then a smooth node's handles turn to the
 * line between their directions, keeping their lengths, and a symmetric
 * node's also take their average length. A corner keeps its handles where
 * they are. `undefined` for a node without a segment on both sides.
 *
 * ```ts
 * setNodeType('M0 0L10 0L10 10', 1, 'smooth').segments
 * ```
 */
export const setNodeType = (
  input: PathData,
  index: number,
  type: NodeType
): NodeEdit | undefined => {
  let segments = absolutize(input)
  const before = segments[index]
  const after = segments[index + 1]
  if (!before || !after || before[0] === 'M' || after[0] === 'M' || after[0] === 'Z')
    return undefined
  if (type === 'corner') return { segments, index }

  // Cubics on both sides. An arc may become several, which moves the node.
  if (before[0] !== 'C') {
    const count = segments.length
    segments = convertSegment(segments, index, 'C')!
    index += segments.length - count
  }
  if (segments[index + 1]![0] !== 'C')
    segments = convertSegment(segments, index + 1, 'C')!
  const handles = nodeHandles(segments, index)!
  const point = handles.point
  const into = sub(point, handles.in!)
  const out = sub(handles.out!, point)
  let a = length(into)
  let b = length(out)
  // The direction halfway between the two, or across a cusp.
  const unit = (v: Point, l: number): Point => (l ? [v[0] / l, v[1] / l] : [0, 0])
  const ui = unit(into, a)
  const uo = unit(out, b)
  let d: Point = [ui[0] + uo[0], ui[1] + uo[1]]
  if (length(d) < 1e-9) d = [-ui[1], ui[0]]
  d = unit(d, length(d))
  if (type === 'symmetric') a = b = (a + b) / 2
  const incoming = segments[index] as [
    'C',
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  const outgoing = segments[index + 1] as [
    'C',
    number,
    number,
    number,
    number,
    number,
    number,
  ]
  segments[index] = [
    'C',
    incoming[1],
    incoming[2],
    point[0] - d[0] * a,
    point[1] - d[1] * a,
    incoming[5],
    incoming[6],
  ]
  segments[index + 1] = [
    'C',
    point[0] + d[0] * b,
    point[1] + d[1] * b,
    outgoing[3],
    outgoing[4],
    outgoing[5],
    outgoing[6],
  ]
  return { segments, index }
}
