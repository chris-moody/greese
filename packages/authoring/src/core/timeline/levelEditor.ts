import { uid } from '../uid.ts'
import type { TimelineTick } from './ticks.ts'
import type { LevelPoint } from './levelEditor.types.ts'

/** Pixel-space scale for mapping points onto the overlay's SVG coordinates. */
export interface LevelEditorScale {
  pixelsPerTick: number
  min: number
  max: number
  /** Pixel height of the graph area — value is scaled to `[0, height]`, inverted (0 at bottom). */
  height: number
  /**
   * Vertical inset (px) reserved at both the top and bottom of the graph, so
   * points at the value extremes don't touch the chart edges. Defaults to 0.
   */
  paddingY?: number
}

/** The graph's usable height after reserving `paddingY` off both edges. */
export const usableHeight = (scale: LevelEditorScale): number =>
  Math.max(0, scale.height - (scale.paddingY ?? 0) * 2)

/** x pixel position of a point at the current zoom. */
export const pointX = (point: LevelPoint, scale: LevelEditorScale): number =>
  point.tick * scale.pixelsPerTick

/** y pixel position of a point's value, linearly scaled from `[min, max]`, inverted (0 at bottom), inset by `paddingY`. */
export const pointY = (point: LevelPoint, scale: LevelEditorScale): number => {
  const range = scale.max - scale.min
  const t = range === 0 ? 0 : (point.value - scale.min) / range
  const paddingY = scale.paddingY ?? 0
  return paddingY + (1 - t) * usableHeight(scale)
}

/**
 * Sample the curve at `tick` — linear interpolation between the bracketing
 * points; holds the nearest value before the first / after the last point
 * (mirrors the "hold" semantics `HoldBlock` already renders for keyframes).
 */
export const sampleLevelCurve = (points: LevelPoint[], tick: TimelineTick): number => {
  if (points.length === 0) return 0
  const sorted = [...points].sort((a, b) => a.tick - b.tick)
  const first = sorted[0]!
  const last = sorted[sorted.length - 1]!
  if (tick <= first.tick) return first.value
  if (tick >= last.tick) return last.value
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]!
    const b = sorted[i + 1]!
    if (tick >= a.tick && tick <= b.tick) {
      if (b.tick === a.tick) return a.value
      const t = (tick - a.tick) / (b.tick - a.tick)
      return a.value + (b.value - a.value) * t
    }
  }
  return last.value
}

/** Collapse a point set to a single point at `value` (a flat curve everywhere). */
export const flattenPoints = (points: LevelPoint[], value: number): LevelPoint[] => {
  const anchor = points[0]
  return [{ id: anchor?.id ?? uid(), tick: anchor?.tick ?? 0, value }]
}

export interface LevelEditorRect {
  left: number
  top: number
  width: number
  height: number
}

/** Point ids whose pixel position falls inside `rect` (overlay-local coordinates). */
export const pointsInRect = (
  points: LevelPoint[],
  rect: LevelEditorRect,
  scale: LevelEditorScale
): string[] => {
  const x1 = rect.left + rect.width
  const y1 = rect.top + rect.height
  return points
    .filter((p) => {
      const x = pointX(p, scale)
      const y = pointY(p, scale)
      return x >= rect.left && x <= x1 && y >= rect.top && y <= y1
    })
    .map((p) => p.id)
}

/** The nearest point to (x, y) within `maxDistance` px, or `null` if none is close enough. */
export const nearestPoint = (
  points: LevelPoint[],
  x: number,
  y: number,
  scale: LevelEditorScale,
  maxDistance = 10
): string | null => {
  let best: string | null = null
  let bestDistance = maxDistance
  points.forEach((p) => {
    const dx = pointX(p, scale) - x
    const dy = pointY(p, scale) - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance <= bestDistance) {
      bestDistance = distance
      best = p.id
    }
  })
  return best
}
