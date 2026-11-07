import { describe, expect, it } from 'vitest'
import { stampEnvelope, stampPulse } from './curvePresets.ts'
import { FrameKind } from '../types/frame.types.ts'
import { TweenType } from '../types/tween.types.ts'

describe('stampPulse', () => {
  it('produces 2*cycles+1 keyframes alternating trough/peak, evenly spaced', () => {
    const result = stampPulse(0, 100, 2, 10, 5)
    expect(result.frames).toHaveLength(5)
    expect(result.frames.map((f) => f.value)).toEqual([5, 15, 5, 15, 5])
    expect(result.frames.map((f) => f.frame)).toEqual([0, 25, 50, 75, 100])
    expect(result.frames.every((f) => f.kind === FrameKind.KEYFRAME)).toBe(true)
  })

  it('joins every consecutive pair with an enabled tween of the given type', () => {
    const result = stampPulse(0, 40, 1, 0, 1, TweenType.LINEAR)
    expect(result.tweens).toHaveLength(2)
    for (const tween of result.tweens) {
      expect(tween.type).toBe(TweenType.LINEAR)
      expect(tween.enabled).toBe(true)
    }
    expect(result.tweens[0]!.startKeyframeId).toBe(result.frames[0]!.id)
    expect(result.tweens[0]!.endKeyframeId).toBe(result.frames[1]!.id)
  })

  it('defaults to EASE_IN_OUT when no tween type is given', () => {
    const result = stampPulse(0, 40, 1, 0, 1)
    expect(result.tweens.every((t) => t.type === TweenType.EASE_IN_OUT)).toBe(true)
  })

  it('rejects a degenerate (zero-length) range', () => {
    expect(stampPulse(10, 10, 2, 0, 1)).toEqual({ frames: [], tweens: [] })
    expect(stampPulse(10, 5, 2, 0, 1)).toEqual({ frames: [], tweens: [] })
  })

  it('rejects fewer than one cycle', () => {
    expect(stampPulse(0, 100, 0, 0, 1)).toEqual({ frames: [], tweens: [] })
  })
})

describe('stampEnvelope', () => {
  it('produces the classic 5-keyframe ADSR shape at the expected ticks/values', () => {
    const result = stampEnvelope(0, 10, 20, 30, 15, 1, 0.5, 0)
    expect(result.frames).toHaveLength(5)
    expect(result.frames.map((f) => f.frame)).toEqual([0, 10, 30, 60, 75])
    expect(result.frames.map((f) => f.value)).toEqual([0, 1, 0.5, 0.5, 0])
  })

  it('joins the 4 ADSR segments with EASE_OUT/LINEAR/LINEAR/EASE_IN tweens', () => {
    const result = stampEnvelope(0, 10, 20, 30, 15, 1, 0.5, 0)
    expect(result.tweens.map((t) => t.type)).toEqual([
      TweenType.EASE_OUT,
      TweenType.LINEAR,
      TweenType.LINEAR,
      TweenType.EASE_IN,
    ])
    expect(result.tweens.every((t) => t.enabled)).toBe(true)
  })

  it('rejects any non-positive segment length', () => {
    expect(stampEnvelope(0, 0, 20, 30, 15, 1, 0.5, 0)).toEqual({ frames: [], tweens: [] })
    expect(stampEnvelope(0, 10, 0, 30, 15, 1, 0.5, 0)).toEqual({ frames: [], tweens: [] })
    expect(stampEnvelope(0, 10, 20, 0, 15, 1, 0.5, 0)).toEqual({ frames: [], tweens: [] })
    expect(stampEnvelope(0, 10, 20, 30, 0, 1, 0.5, 0)).toEqual({ frames: [], tweens: [] })
  })
})
