/**
 * Tier selection over `TimelineResolution.getSnapPoints` results — shared by the
 * ruler (which labels the finest tier that still fits `MIN_LABEL_PX`) and the
 * frame grid (which draws lines at the finer `MIN_GRID_PX` threshold). Tiers are
 * cumulative: "the tier at weight w" is every point with `weight >= w`, since
 * coarser subdivisions (bars) are also members of finer grids (beats, 16ths).
 */
import type { TickSnapPoint } from '../types/resolution.types.ts'

/** Minimum pixel spacing between adjacent tick labels before they're thinned out. */
export const MIN_LABEL_PX = 64
/** Minimum pixel spacing between frame-grid lines before a coarser tier is used. */
export const MIN_GRID_PX = 8

/** Smallest gap between adjacent sorted ticks — `Infinity` for fewer than 2 points. */
const minAdjacentGap = (points: TickSnapPoint[]): number => {
  let min = Infinity
  for (let i = 1; i < points.length; i += 1) {
    const gap = points[i]!.tick - points[i - 1]!.tick
    if (gap < min) min = gap
  }
  return min
}

/** Distinct weights, finest (lowest) first. */
const weightsAscending = (points: TickSnapPoint[]): number[] =>
  [...new Set(points.map((p) => p.weight))].sort((a, b) => a - b)

/**
 * The finest snap-point tier whose adjacent spacing is still ≥ `minPx`, so
 * labels stay dense without ever overlapping. When even the coarsest tier is
 * too dense (e.g. animation resolution's single whole-frame tier, zoomed far
 * out), falls back to thinning it by an integer stride.
 */
export const pickLabelTier = (
  points: TickSnapPoint[],
  pixelsPerTick: number,
  minPx: number = MIN_LABEL_PX
): TickSnapPoint[] => {
  for (const weight of weightsAscending(points)) {
    const tier = points.filter((p) => p.weight >= weight)
    if (minAdjacentGap(tier) * pixelsPerTick >= minPx) return tier
  }
  const weights = weightsAscending(points)
  const coarsest = points.filter((p) => p.weight === weights[weights.length - 1])
  if (coarsest.length < 2) return coarsest
  const step = (coarsest[1]!.tick - coarsest[0]!.tick) * pixelsPerTick
  const stride = Math.max(1, Math.ceil(minPx / step))
  return coarsest.filter((_, index) => index % stride === 0)
}
