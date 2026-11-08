import type { Point, Rect } from './renderObject.types.ts'

/**
 * Drawing, moving and resizing a box on a stage, such as a text box: what a
 * press on it starts, and where the box is as the pointer moves. Pure, in the
 * box's own units, so Pixels' Pixi stage and Shaper's SVG stage share the
 * same behaviour.
 */

/** A box's eight handles, clockwise from its top left. */
export type BoxHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** The handles in the order `boxHandlePoints` places them. */
export const BOX_HANDLES: readonly BoxHandle[] = [
  'nw',
  'n',
  'ne',
  'e',
  'se',
  's',
  'sw',
  'w',
]

/** The resize cursor over each handle. */
export const BOX_HANDLE_CURSORS: Readonly<Record<BoxHandle, string>> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
}

/** Where each handle sits, in `BOX_HANDLES`' order. */
export const boxHandlePoints = (box: Rect): Point[] => {
  const { x, y, width: w, height: h } = box
  return [
    { x, y },
    { x: x + w / 2, y },
    { x: x + w, y },
    { x: x + w, y: y + h / 2 },
    { x: x + w, y: y + h },
    { x: x + w / 2, y: y + h },
    { x, y: y + h },
    { x, y: y + h / 2 },
  ]
}

/** The box two points span, whichever way the drag went: its top left and its size. */
export const boxFromCorners = (a: Point, b: Point, min = 0): Rect => {
  const width = Math.max(min, Math.abs(b.x - a.x))
  const height = Math.max(min, Math.abs(b.y - a.y))
  // Grown to the minimum, the box keeps to the side the drag went.
  return {
    x: b.x < a.x ? a.x - width : a.x,
    y: b.y < a.y ? a.y - height : a.y,
    width,
    height,
  }
}

/** The smallest box around others, or `null` for none. */
export const boundsOfBoxes = (boxes: readonly Rect[]): Rect | null => {
  if (boxes.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const b of boxes) {
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** What a press on a box lands on. */
export type BoxPress =
  | { kind: 'handle'; handle: BoxHandle }
  /** The outline, away from the handles: moves the box. */
  | { kind: 'edge' }
  | { kind: 'inside' }
  | { kind: 'outside' }

/**
 * What a press at `point` lands on: a handle, then the outline (within
 * `tolerance` either side of it), then the inside. `tolerance` is in the
 * box's units: a stage passes its hit radius in screen pixels over its zoom.
 */
export const boxPressAt = (box: Rect, point: Point, tolerance: number): BoxPress => {
  const handles = boxHandlePoints(box)
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i]!
    if (Math.abs(point.x - h.x) <= tolerance && Math.abs(point.y - h.y) <= tolerance)
      return { kind: 'handle', handle: BOX_HANDLES[i]! }
  }
  const { x, y, width, height } = box
  const withinX = point.x >= x - tolerance && point.x <= x + width + tolerance
  const withinY = point.y >= y - tolerance && point.y <= y + height + tolerance
  if (!withinX || !withinY) return { kind: 'outside' }
  const nearEdge =
    Math.abs(point.x - x) <= tolerance ||
    Math.abs(point.x - (x + width)) <= tolerance ||
    Math.abs(point.y - y) <= tolerance ||
    Math.abs(point.y - (y + height)) <= tolerance
  return nearEdge ? { kind: 'edge' } : { kind: 'inside' }
}

export interface BoxResizeOptions {
  /** The smallest width and height. An edge dragged past it stops there. @default 1 */
  min?: number
  /** Keeps the start's proportions, from a corner: Shift, as on most stages. */
  keepAspect?: boolean
  /** Resizes about the centre, the opposite edges moving the other way: Alt. */
  fromCenter?: boolean
}

/**
 * The box with a handle dragged by `delta`. The edges the handle doesn't
 * touch stay where they were, so dragging the left edge never moves the
 * right one.
 */
export const resizeBox = (
  start: Rect,
  handle: BoxHandle,
  delta: Point,
  { min = 1, keepAspect = false, fromCenter = false }: BoxResizeOptions = {}
): Rect => {
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.startsWith('n')
  const south = handle.startsWith('s')
  // How much each axis grows: a west or north handle grows it moving back.
  const scale = fromCenter ? 2 : 1
  let width = start.width + (east ? delta.x : west ? -delta.x : 0) * scale
  let height = start.height + (south ? delta.y : north ? -delta.y : 0) * scale
  if (keepAspect && (west || east) && (north || south) && start.width && start.height) {
    const factor = Math.max(width / start.width, height / start.height)
    width = start.width * factor
    height = start.height * factor
  }
  width = Math.max(min, width)
  height = Math.max(min, height)
  const right = start.x + start.width
  const bottom = start.y + start.height
  const x = fromCenter
    ? start.x + (start.width - width) / 2
    : west
      ? right - width
      : start.x
  const y = fromCenter
    ? start.y + (start.height - height) / 2
    : north
      ? bottom - height
      : start.y
  // An edge handle leaves the other axis as it was.
  return {
    x: west || east || keepAspect ? x : start.x,
    y: north || south || keepAspect ? y : start.y,
    width: west || east || keepAspect ? width : start.width,
    height: north || south || keepAspect ? height : start.height,
  }
}

/** The box moved by `delta`. */
export const moveBox = (start: Rect, delta: Point): Rect => ({
  ...start,
  x: start.x + delta.x,
  y: start.y + delta.y,
})

/**
 * A box inside a group, kept in the same place relative to the group's
 * bounds when they change from `from` to `to`: how a selection of boxes
 * resizes together.
 */
export const fitBoxTo = (box: Rect, from: Rect, to: Rect, min = 1): Rect => {
  const sx = from.width ? to.width / from.width : 1
  const sy = from.height ? to.height / from.height : 1
  return {
    x: to.x + (box.x - from.x) * sx,
    y: to.y + (box.y - from.y) * sy,
    width: Math.max(min, box.width * sx),
    height: Math.max(min, box.height * sy),
  }
}

/** A press-and-drag on a box: drawing a new one, moving it, or resizing it from a handle. */
export type BoxDrag =
  | { kind: 'create'; origin: Point }
  | { kind: 'move'; origin: Point; start: Rect }
  | { kind: 'resize'; origin: Point; start: Rect; handle: BoxHandle }

/**
 * What a press starts on a selected box, as a text tool reads it: a handle
 * resizes, the outline moves, the inside edits (`null`: the caller places
 * the caret), and anywhere else draws a new box. With no box, a press
 * always draws one.
 */
export const beginBoxDrag = (
  box: Rect | null,
  point: Point,
  tolerance: number
): BoxDrag | null => {
  const press = box ? boxPressAt(box, point, tolerance) : ({ kind: 'outside' } as const)
  switch (press.kind) {
    case 'handle':
      return { kind: 'resize', origin: point, start: box!, handle: press.handle }
    case 'edge':
      return { kind: 'move', origin: point, start: box! }
    case 'inside':
      return null
    case 'outside':
      return { kind: 'create', origin: point }
  }
}

/** Where a drag has the box with the pointer at `point`. */
export const dragBox = (
  drag: BoxDrag,
  point: Point,
  options: BoxResizeOptions = {}
): Rect => {
  const delta = { x: point.x - drag.origin.x, y: point.y - drag.origin.y }
  switch (drag.kind) {
    case 'create':
      return boxFromCorners(drag.origin, point, options.min ?? 0)
    case 'move':
      return moveBox(drag.start, delta)
    case 'resize':
      return resizeBox(drag.start, drag.handle, delta, options)
  }
}
