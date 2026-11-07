/**
 * `@greese/svg/edit`: what a path editor does to path data. Segment
 * conversion (lines, quadratics and arcs to cubics and back, shorthands,
 * absolute and relative), node types, and freehand fitting. Pure and
 * Node-safe, and an entry of its own so `@greese/svg`'s budget doesn't carry
 * an editor's tools.
 */
export {
  convertSegment,
  cubicToArc,
  cubicToQuads,
  segmentContexts,
  segmentEnd,
  segmentToCubics,
  setRelative,
  setSegmentRelative,
  splitCubic,
  type ConvertSegmentOptions,
  type SegmentContext,
  type SegmentTarget,
} from './segments.ts'
export {
  nodeHandles,
  nodeType,
  setNodeType,
  type NodeEdit,
  type NodeHandles,
  type NodeType,
} from './nodes.ts'
export {
  fitCubics,
  freehandPath,
  smoothPoints,
  type FreehandOptions,
} from './freehand.ts'
