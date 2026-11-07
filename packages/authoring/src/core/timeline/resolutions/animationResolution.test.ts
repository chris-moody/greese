import { describe, expect, it } from 'vitest'
import { TimeDomain, TimeMode } from '../../types/resolution.types.ts'
import {
  createAnimationResolution,
  DEFAULT_TICKS_PER_FRAME,
} from './animationResolution.ts'

describe('createAnimationResolution', () => {
  it('defaults to 1000 ticks/frame and reports the Frames domain', () => {
    const resolution = createAnimationResolution({ getFps: () => 24 })
    expect(resolution.domain).toBe(TimeDomain.Frames)
    expect(resolution.ticksPerUnit).toBe(DEFAULT_TICKS_PER_FRAME)
  })

  it('converts ticks <-> seconds via the live fps', () => {
    let fps = 24
    const resolution = createAnimationResolution({ getFps: () => fps })
    expect(resolution.tickToSeconds(24_000)).toBeCloseTo(1)
    expect(resolution.secondsToTick(1)).toBe(24_000)
    fps = 30
    expect(resolution.tickToSeconds(30_000)).toBeCloseTo(1)
  })

  it('unitToTicks / ticksToUnit round-trip frame indices', () => {
    const resolution = createAnimationResolution({ getFps: () => 24 })
    expect(resolution.unitToTicks(5)).toBe(5000)
    expect(resolution.ticksToUnit(5000)).toBe(5)
  })

  it('format(Frames) renders whole-frame index, with a sub-frame remainder', () => {
    const resolution = createAnimationResolution({ getFps: () => 24 })
    expect(resolution.format(5000)).toBe('5')
    expect(resolution.format(5000, TimeMode.Frames)).toBe('5')
    expect(resolution.format(5250, TimeMode.Frames)).toBe('5+250')
  })

  it('format(Time) delegates to formatClockTime', () => {
    const resolution = createAnimationResolution({ getFps: () => 24 })
    expect(resolution.format(24_000, TimeMode.Time)).toBe('00:01.000')
  })

  it('getSnapPoints returns one point per frame boundary in range', () => {
    const resolution = createAnimationResolution({ getFps: () => 24 })
    const points = resolution.getSnapPoints({ startTick: 1500, endTick: 4000 }, 0.02)
    expect(points.map((p) => p.tick)).toEqual([2000, 3000, 4000])
    expect(points.every((p) => p.weight === 1)).toBe(true)
  })

  it('frameLabelOffset shifts the displayed frame index without affecting tick math', () => {
    const resolution = createAnimationResolution({
      getFps: () => 24,
      frameLabelOffset: 1,
    })
    expect(resolution.format(0)).toBe('1')
    expect(resolution.format(1000)).toBe('2')
    expect(resolution.format(1250)).toBe('2+250')
    expect(resolution.tickToSeconds(24_000)).toBeCloseTo(1)
  })

  it('getTicksPerFrame overrides the default resolution', () => {
    const resolution = createAnimationResolution({
      getFps: () => 24,
      getTicksPerFrame: () => 100,
    })
    expect(resolution.ticksPerUnit).toBe(100)
    expect(resolution.unitToTicks(3)).toBe(300)
  })

  it('with 0 or 1 rate points, reduces exactly to the flat getFps math', () => {
    const flat = createAnimationResolution({ getFps: () => 24 })
    const oneMovingPoint = createAnimationResolution({
      getFps: () => 24,
      getRatePoints: () => [{ id: 'a', tick: 0, value: 60 }],
    })
    expect(oneMovingPoint.tickToSeconds(24_000)).toBeCloseTo(flat.tickToSeconds(24_000))
  })

  it('with 2+ rate points, tick<->seconds follows the piecewise-constant curve', () => {
    const resolution = createAnimationResolution({
      getFps: () => 24,
      getRatePoints: () => [
        { id: 'a', tick: 0, value: 24 },
        { id: 'b', tick: 24_000, value: 12 },
      ],
    })
    // First 24000 ticks (24 frames) at 24fps = 24000 ticks/sec -> 1s.
    expect(resolution.tickToSeconds(24_000)).toBeCloseTo(1)
    // Next 12000 ticks at 12fps (12000 ticks/sec) -> 1s more.
    expect(resolution.tickToSeconds(36_000)).toBeCloseTo(2)
    expect(resolution.secondsToTick(2)).toBe(36_000)
  })
})
