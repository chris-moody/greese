import { describe, expect, it } from 'vitest'
import {
  cumulativeSecondsTable,
  secondsForTick,
  tickForSeconds,
} from './rateCurve.helpers.ts'

describe('cumulativeSecondsTable', () => {
  it('returns an empty table for no segments', () => {
    expect(cumulativeSecondsTable([])).toEqual([])
  })

  it("accumulates seconds using each segment's starting rate (step, not a ramp)", () => {
    // 24 ticks/sec for the first 240 ticks (10s), then 12 ticks/sec.
    const table = cumulativeSecondsTable([
      { tick: 0, ticksPerSecond: 24 },
      { tick: 240, ticksPerSecond: 12 },
    ])
    expect(table).toEqual([
      { tick: 0, seconds: 0, ticksPerSecond: 24 },
      { tick: 240, seconds: 10, ticksPerSecond: 12 },
    ])
  })

  it('sorts unsorted input by tick', () => {
    const table = cumulativeSecondsTable([
      { tick: 240, ticksPerSecond: 12 },
      { tick: 0, ticksPerSecond: 24 },
    ])
    expect(table.map((e) => e.tick)).toEqual([0, 240])
  })
})

describe('secondsForTick / tickForSeconds', () => {
  const table = cumulativeSecondsTable([
    { tick: 0, ticksPerSecond: 24 },
    { tick: 240, ticksPerSecond: 12 },
  ])

  it('returns 0 for an empty table', () => {
    expect(secondsForTick([], 100)).toBe(0)
    expect(tickForSeconds([], 1)).toBe(0)
  })

  it('interpolates within a segment using its starting rate', () => {
    expect(secondsForTick(table, 120)).toBeCloseTo(5) // 120 ticks / 24 tps
    expect(secondsForTick(table, 240)).toBeCloseTo(10)
  })

  it('extrapolates past the last segment using its rate', () => {
    expect(secondsForTick(table, 360)).toBeCloseTo(10 + 120 / 12)
  })

  it('extrapolates before the first segment using its rate', () => {
    expect(secondsForTick(table, -24)).toBeCloseTo(-1)
  })

  it('tickForSeconds is the inverse of secondsForTick', () => {
    expect(tickForSeconds(table, 5)).toBe(120)
    expect(tickForSeconds(table, 10)).toBe(240)
    expect(tickForSeconds(table, 10 + 120 / 12)).toBe(360)
  })
})
