import { describe, expect, it } from 'vitest'
import {
  buildSignatureBarTable,
  type TimeSignatureChange,
} from './timeSignature.helpers.ts'
import {
  boundaryTicksInRange,
  crossedBoundaries,
  PulseLayerId,
  type PulseBoundaryContext,
} from './pulseBoundaries.helpers.ts'

const TPQ = 960
const flat4x4 = buildSignatureBarTable([{ tick: 0, numerator: 4, denominator: 4 }], TPQ)

describe('boundaryTicksInRange', () => {
  it('beat: emits every beat boundary in range for a flat 4/4 signature', () => {
    const ctx: PulseBoundaryContext = { signatureTable: flat4x4, ticksPerUnit: TPQ }
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: TPQ * 4 }, PulseLayerId.beat, ctx)
    ).toEqual([0, TPQ, TPQ * 2, TPQ * 3, TPQ * 4])
  })

  it('measure: emits one tick per bar (delegates to barBoundaryTicks)', () => {
    const ctx: PulseBoundaryContext = { signatureTable: flat4x4, ticksPerUnit: TPQ }
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: TPQ * 8 }, PulseLayerId.measure, ctx)
    ).toEqual([0, TPQ * 4, TPQ * 8])
  })

  it('measure: respects a signature change mid-timeline', () => {
    const changes: TimeSignatureChange[] = [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: TPQ * 8, numerator: 3, denominator: 4 },
    ]
    const table = buildSignatureBarTable(changes, TPQ)
    const ctx: PulseBoundaryContext = { signatureTable: table, ticksPerUnit: TPQ }
    const ticks = boundaryTicksInRange(
      { startTick: 0, endTick: TPQ * 11 },
      PulseLayerId.measure,
      ctx
    )
    expect(ticks).toEqual([0, TPQ * 4, TPQ * 8, TPQ * 11])
  })

  it('subdivision: steps by the given tick length', () => {
    const ctx: PulseBoundaryContext = {
      signatureTable: flat4x4,
      ticksPerUnit: TPQ,
      subdivisionTicks: TPQ / 4,
    }
    const ticks = boundaryTicksInRange(
      { startTick: 0, endTick: TPQ },
      PulseLayerId.subdivision,
      ctx
    )
    expect(ticks).toEqual([0, 240, 480, 720, 960])
  })

  it('subdivision: returns nothing when the step is 0 (the off sentinel)', () => {
    const ctx: PulseBoundaryContext = {
      signatureTable: flat4x4,
      ticksPerUnit: TPQ,
      subdivisionTicks: 0,
    }
    expect(
      boundaryTicksInRange(
        { startTick: 0, endTick: TPQ * 4 },
        PulseLayerId.subdivision,
        ctx
      )
    ).toEqual([])
  })

  it('frame: flat stepping with no signature table needed', () => {
    const ctx: PulseBoundaryContext = { ticksPerUnit: 1000 }
    expect(
      boundaryTicksInRange({ startTick: 500, endTick: 3200 }, PulseLayerId.frame, ctx)
    ).toEqual([1000, 2000, 3000])
  })

  it('loop: emits start/end only when within range', () => {
    const ctx: PulseBoundaryContext = {
      ticksPerUnit: TPQ,
      loopBounds: { start: 100, end: 900 },
    }
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: 1000 }, PulseLayerId.loop, ctx)
    ).toEqual([100, 900])
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: 500 }, PulseLayerId.loop, ctx)
    ).toEqual([100])
  })

  it('beat/measure: empty signature table yields no boundaries (animation shells)', () => {
    const ctx: PulseBoundaryContext = { ticksPerUnit: 1000 }
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: 5000 }, PulseLayerId.beat, ctx)
    ).toEqual([])
    expect(
      boundaryTicksInRange({ startTick: 0, endTick: 5000 }, PulseLayerId.measure, ctx)
    ).toEqual([])
  })
})

describe('crossedBoundaries', () => {
  const ctx: PulseBoundaryContext = { signatureTable: flat4x4, ticksPerUnit: TPQ }

  it('returns boundaries strictly after prevTick, up to and including nextTick', () => {
    expect(crossedBoundaries(0, TPQ, PulseLayerId.beat, ctx)).toEqual([TPQ])
    expect(crossedBoundaries(TPQ - 1, TPQ + 1, PulseLayerId.beat, ctx)).toEqual([TPQ])
  })

  it('returns nothing when the tick does not change', () => {
    expect(crossedBoundaries(TPQ, TPQ, PulseLayerId.beat, ctx)).toEqual([])
  })

  it('detects a beat boundary crossed while scrubbing backward', () => {
    expect(crossedBoundaries(TPQ + 1, TPQ - 1, PulseLayerId.beat, ctx)).toEqual([TPQ])
  })
})
