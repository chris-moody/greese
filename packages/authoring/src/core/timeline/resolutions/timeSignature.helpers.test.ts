import { describe, expect, it } from 'vitest'
import {
  buildSignatureBarTable,
  barBeatAt,
  barBoundaryTicks,
  type TimeSignatureChange,
} from './timeSignature.helpers.ts'

const TPQ = 960

describe('buildSignatureBarTable', () => {
  it('starts the first entry at bar 0', () => {
    const table = buildSignatureBarTable([{ tick: 0, numerator: 4, denominator: 4 }], TPQ)
    expect(table).toEqual([{ tick: 0, numerator: 4, denominator: 4, barAtTick: 0 }])
  })

  it('accumulates bar count across a signature change', () => {
    // 2 bars of 4/4 (8 beats = 7680 ticks) before switching to 3/4.
    const changes: TimeSignatureChange[] = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 7680, numerator: 3, denominator: 4 },
    ]
    const table = buildSignatureBarTable(changes, TPQ)
    expect(table[1]!.barAtTick).toBe(2)
  })
})

describe('barBeatAt', () => {
  const flatTable = buildSignatureBarTable(
    [{ tick: 0, numerator: 4, denominator: 4 }],
    TPQ
  )

  it('matches the flat 4/4 formula at various ticks', () => {
    expect(barBeatAt(flatTable, TPQ, 0)).toEqual({ bar: 1, beatInBar: 1, tickInBeat: 0 })
    expect(barBeatAt(flatTable, TPQ, 960)).toEqual({
      bar: 1,
      beatInBar: 2,
      tickInBeat: 0,
    })
    expect(barBeatAt(flatTable, TPQ, 960 * 4)).toEqual({
      bar: 2,
      beatInBar: 1,
      tickInBeat: 0,
    })
    expect(barBeatAt(flatTable, TPQ, 1020)).toEqual({
      bar: 1,
      beatInBar: 2,
      tickInBeat: 60,
    })
  })

  it('picks up the new bar numbering after a signature change', () => {
    const changes: TimeSignatureChange[] = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 7680, numerator: 3, denominator: 4 }, // bar 3 starts here
    ]
    const table = buildSignatureBarTable(changes, TPQ)
    expect(barBeatAt(table, TPQ, 7680)).toEqual({ bar: 3, beatInBar: 1, tickInBeat: 0 })
    // 3 beats later (one 3/4 bar) is bar 4.
    expect(barBeatAt(table, TPQ, 7680 + 960 * 3)).toEqual({
      bar: 4,
      beatInBar: 1,
      tickInBeat: 0,
    })
  })
})

describe('barBoundaryTicks', () => {
  it('returns one tick per bar for a flat 4/4 signature, with no duplicates', () => {
    const table = buildSignatureBarTable([{ tick: 0, numerator: 4, denominator: 4 }], TPQ)
    const ticks = barBoundaryTicks(table, TPQ, { startTick: 0, endTick: 960 * 4 * 3 })
    expect(ticks).toEqual([0, 3840, 7680, 11520])
  })

  it('does not duplicate the boundary tick shared by two signature segments', () => {
    const changes: TimeSignatureChange[] = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 7680, numerator: 3, denominator: 4 },
    ]
    const table = buildSignatureBarTable(changes, TPQ)
    const ticks = barBoundaryTicks(table, TPQ, {
      startTick: 0,
      endTick: 7680 + 960 * 3 * 2,
    })
    expect(ticks).toEqual([0, 3840, 7680, 7680 + 2880, 7680 + 5760])
    expect(new Set(ticks).size).toBe(ticks.length)
  })
})
