import { describe, expect, it } from 'vitest'
import { TimeDomain, TimeMode } from '../../types/resolution.types.ts'
import {
  createMusicalResolution,
  DEFAULT_TICKS_PER_QUARTER,
} from './musicalResolution.ts'

describe('createMusicalResolution', () => {
  it('defaults to 960 TPQ and reports the Musical domain', () => {
    const resolution = createMusicalResolution({ getBpm: () => 120 })
    expect(resolution.domain).toBe(TimeDomain.Musical)
    expect(resolution.ticksPerUnit).toBe(DEFAULT_TICKS_PER_QUARTER)
  })

  it('converts ticks <-> seconds via the live bpm', () => {
    let bpm = 120
    const resolution = createMusicalResolution({ getBpm: () => bpm })
    expect(resolution.tickToSeconds(960)).toBeCloseTo(0.5)
    expect(resolution.secondsToTick(0.5)).toBe(960)
    bpm = 60
    expect(resolution.tickToSeconds(960)).toBeCloseTo(1)
  })

  it('format(Beats) renders 1-based bar:beat:tick at the default 4/4 signature', () => {
    const resolution = createMusicalResolution({ getBpm: () => 120 })
    expect(resolution.format(0)).toBe('1:1:0')
    expect(resolution.format(960, TimeMode.Beats)).toBe('1:2:0')
    expect(resolution.format(960 * 4)).toBe('2:1:0')
    expect(resolution.format(1020)).toBe('1:2:60')
  })

  it('format(Beats) honors a custom getSignature', () => {
    const resolution = createMusicalResolution({
      getBpm: () => 120,
      getSignature: () => [{ tick: 0, numerator: 3, denominator: 4 }],
    })
    expect(resolution.format(960 * 3)).toBe('2:1:0')
  })

  it('format(Beats) picks up bar renumbering across a signature change', () => {
    const resolution = createMusicalResolution({
      getBpm: () => 120,
      getSignature: () => [
        { tick: 0, numerator: 4, denominator: 4 },
        { tick: 7680, numerator: 3, denominator: 4 }, // bar 3 starts here
      ],
    })
    expect(resolution.format(7680)).toBe('3:1:0')
  })

  it("getSnapPoints includes a bar tier (weight 5) at each signature's bar boundaries", () => {
    const resolution = createMusicalResolution({ getBpm: () => 120 })
    const points = resolution.getSnapPoints({ startTick: 0, endTick: 3840 }, 0.05)
    expect(points.find((p) => p.tick === 0)?.weight).toBe(5)
    expect(points.find((p) => p.tick === 3840)?.weight).toBe(5)
  })

  it('format(Time) delegates to formatClockTime', () => {
    const resolution = createMusicalResolution({ getBpm: () => 120 })
    expect(resolution.format(960, TimeMode.Time)).toBe('00:00.500')
  })

  it('getSnapPoints includes beat/8th/triplet/16th/32nd subdivisions, deduped and sorted', () => {
    const resolution = createMusicalResolution({ getBpm: () => 120 })
    const points = resolution.getSnapPoints({ startTick: 0, endTick: 960 }, 0.05)
    const ticks = points.map((p) => p.tick)
    expect(ticks).toEqual([...ticks].sort((a, b) => a - b))
    expect(new Set(ticks).size).toBe(ticks.length)
    expect(ticks).toEqual(
      expect.arrayContaining([0, 120, 240, 320, 480, 640, 720, 840, 960])
    )
    // tick 0 is also a bar boundary under the default signature, so it's weight 5, not 4.
    expect(points.find((p) => p.tick === 0)?.weight).toBe(5)
    expect(points.find((p) => p.tick === 320)?.weight).toBe(2.5)
  })
})

describe('createMusicalResolution rate curve', () => {
  it('with 0 or 1 rate points, reduces exactly to the flat getBpm math', () => {
    const flat = createMusicalResolution({ getBpm: () => 120 })
    const onePoint = createMusicalResolution({
      getBpm: () => 120,
      getRatePoints: () => [{ id: 'a', tick: 0, value: 200 }],
    })
    expect(onePoint.tickToSeconds(960)).toBeCloseTo(flat.tickToSeconds(960))
  })

  it('with 2+ rate points, tick<->seconds follows the piecewise-constant tempo curve', () => {
    const resolution = createMusicalResolution({
      getBpm: () => 120,
      getRatePoints: () => [
        { id: 'a', tick: 0, value: 120 },
        { id: 'b', tick: 1920, value: 60 },
      ],
    })
    // First 2 beats (1920 ticks) at 120bpm = 1s.
    expect(resolution.tickToSeconds(1920)).toBeCloseTo(1)
    // Next 1 beat (960 ticks) at 60bpm = 1s more.
    expect(resolution.tickToSeconds(2880)).toBeCloseTo(2)
    expect(resolution.secondsToTick(2)).toBe(2880)
  })
})
