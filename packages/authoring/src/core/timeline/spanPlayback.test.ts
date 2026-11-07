import { describe, expect, it } from 'vitest'
import { resolveSpanContentFrame, computeSpanRepeatTiles } from './spanPlayback.ts'
import type { SpanPlaybackProperties } from '../types/frame.types.ts'

const resolve = (
  outerFrame: number,
  spanDuration: number,
  contentLength: number,
  playback: SpanPlaybackProperties,
  spanStart = 0
) =>
  resolveSpanContentFrame({
    outerFrame,
    spanStart,
    spanDuration,
    contentLength,
    playback,
  })

describe('resolveSpanContentFrame', () => {
  it('maps 1:1 with no clamp/scale and a single play-through (loopCount: 0)', () => {
    expect(resolve(0, 10, 10, { loopCount: 0 })).toBe(0)
    expect(resolve(5, 10, 10, { loopCount: 0 })).toBe(5)
  })

  it('holds past content end (single play-through) by extrapolating unbounded, not clamping', () => {
    expect(resolve(15, 20, 10, { loopCount: 0 })).toBe(15)
  })

  it('clamp bounds the content unit and offsets from its start', () => {
    const playback: SpanPlaybackProperties = { clamp: { start: 2, end: 8 }, loopCount: 0 }
    expect(resolve(0, 10, 10, playback)).toBe(2)
    expect(resolve(3, 10, 10, playback)).toBe(5)
  })

  it('scaleToFit stretches content across the whole span (matches the old Armature formula)', () => {
    const spanDuration = 20
    const contentLength = 10
    const playback: SpanPlaybackProperties = {
      scaleMode: { type: 'scaleToFit' },
      loopCount: 0,
    }
    const outerFrame = 15
    const oldFormula = outerFrame * (contentLength / spanDuration)
    expect(resolve(outerFrame, spanDuration, contentLength, playback)).toBeCloseTo(
      oldFormula
    )
    expect(resolve(outerFrame, spanDuration, contentLength, playback)).toBeCloseTo(7.5)
  })

  it('scaleWithin stretches content to an independent target length, unrelated to span duration', () => {
    const playback: SpanPlaybackProperties = {
      scaleMode: { type: 'scaleWithin', targetFrames: 4 },
      loopCount: 0,
    }
    // span is much longer than the target — scaleWithin ignores that.
    expect(resolve(2, 20, 10, playback)).toBeCloseTo(5)
    expect(resolve(4, 20, 10, playback)).toBeCloseTo(10)
  })

  it('loopCount + scaleMode: none compresses all finite repeats into one content-length budget', () => {
    // repeats = 3 (loopCount: 2), unitLength = 6, no delay →
    // scaleFactor = 6 / (3*6) = 1/3, periodLength = 2.
    const playback: SpanPlaybackProperties = { loopCount: 2 }
    expect(resolve(0, 6, 6, playback)).toBe(0)
    expect(resolve(1, 6, 6, playback)).toBeCloseTo(3)
    expect(resolve(2, 6, 6, playback)).toBe(0) // second repeat restarts at content 0
    expect(resolve(5, 6, 6, playback)).toBeCloseTo(3)
    expect(resolve(6, 6, 6, playback)).toBeCloseTo(6) // exhausted → holds at content end
  })

  it('loopDelay eats into the scale-to-fit/scale-within budget rather than extending past it', () => {
    // repeats = 2 (loopCount: 1), unitLength = 4, targetFrames = 10, loopDelay = 2 →
    // scaleFactor = 10 / (2*4 + 1*2) = 1 (vs. 10/8 = 1.25 with no delay).
    const withDelay: SpanPlaybackProperties = {
      scaleMode: { type: 'scaleWithin', targetFrames: 10 },
      loopCount: 1,
      loopDelay: 2,
    }
    const withoutDelay: SpanPlaybackProperties = {
      scaleMode: { type: 'scaleWithin', targetFrames: 10 },
      loopCount: 1,
    }
    expect(resolve(1, 20, 4, withoutDelay)).toBeCloseTo(0.8)
    expect(resolve(1, 20, 4, withDelay)).toBeCloseTo(1)
    // second repeat starts right after the gap, at span-offset 6 (= 4 content + 2 delay).
    expect(resolve(6, 20, 4, withDelay)).toBeCloseTo(0)
    expect(resolve(8, 20, 4, withDelay)).toBeCloseTo(2)
  })

  it("matches Sound Studio's existing loop-modulo formula for scaleMode: none, loopCount: -1, clamp = trim", () => {
    const loopStart = 2
    const loopEnd = 9
    const region = loopEnd - loopStart
    const outerFrame = 10
    const oldFormula = loopStart + (outerFrame % region)
    const playback: SpanPlaybackProperties = {
      clamp: { start: loopStart, end: loopEnd },
      loopCount: -1,
    }
    expect(resolve(outerFrame, 100, 12, playback)).toBeCloseTo(oldFormula)
  })

  it('infinite loop (default loopCount) with no scale/clamp is a plain modulo', () => {
    expect(resolve(23, 100, 10, {})).toBeCloseTo(3)
  })
})

describe('computeSpanRepeatTiles', () => {
  it('returns one tile per finite repeat that starts before the span ends', () => {
    const tiles = computeSpanRepeatTiles({
      spanDuration: 6,
      contentLength: 6,
      playback: { loopCount: 2 },
    })
    expect(tiles.map((t) => t.index)).toEqual([0, 1, 2])
    expect(tiles.map((t) => t.spanOffsetStart)).toEqual([0, 2, 4])
  })

  it('caps the infinite case at maxTiles', () => {
    const tiles = computeSpanRepeatTiles({
      spanDuration: 1000,
      contentLength: 10,
      playback: { loopCount: -1 },
      maxTiles: 5,
    })
    expect(tiles).toHaveLength(5)
  })

  it('returns no tiles for a degenerate (zero-length) clamp', () => {
    const tiles = computeSpanRepeatTiles({
      spanDuration: 10,
      contentLength: 10,
      playback: { clamp: { start: 3, end: 3 } },
    })
    expect(tiles).toEqual([])
  })
})
