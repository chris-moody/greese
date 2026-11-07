/**
 * Tick math — integer-safe arithmetic and pixel conversions for
 * {@link import('../types/resolution.types').TimelineTick}. Every later phase
 * uses these instead of ad hoc `Math.round`/`Math.floor` on raw numbers.
 */

/** An integer tick position/duration on the timeline. Always a safe integer. */
export type TimelineTick = number

/** True when `tick` is a safe integer (the only valid `TimelineTick` value). */
export const isSafeTick = (tick: number): boolean => Number.isSafeInteger(tick)

// Warns in every build: an unsafe tick is a bug wherever it happens, and a
// `process.env` check would crash bundles with no `process` global.
const assertSafeTick = (tick: number, context: string): void => {
  if (!isSafeTick(tick)) {
    console.warn(`[ticks.helpers] ${context} produced an unsafe tick value: ${tick}`)
  }
}

/** Round `tick` to the nearest integer and clamp it into `[min, max]`. */
export const clampTick = (
  tick: number,
  min: TimelineTick,
  max: TimelineTick
): TimelineTick => {
  const rounded = Math.round(tick)
  const clamped = Math.max(min, Math.min(max, rounded))
  assertSafeTick(clamped, 'clampTick')
  return clamped
}

/** Add two ticks, warning (dev only) if the result overflows `Number.isSafeInteger`. */
export const addTicks = (a: TimelineTick, b: TimelineTick): TimelineTick => {
  const sum = a + b
  assertSafeTick(sum, 'addTicks')
  return sum
}

/** Convert a tick position to a pixel offset at the given zoom level. */
export const ticksToPixels = (ticks: TimelineTick, pixelsPerTick: number): number =>
  ticks * pixelsPerTick

/** Convert a pixel offset back to the nearest tick at the given zoom level. */
export const pixelsToTicks = (px: number, pixelsPerTick: number): TimelineTick => {
  if (pixelsPerTick <= 0) return 0
  const tick = Math.round(px / pixelsPerTick)
  assertSafeTick(tick, 'pixelsToTicks')
  return tick
}
