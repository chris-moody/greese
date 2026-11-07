import { describe, expect, it } from 'vitest'
import {
  clampAxis,
  cubicBezier,
  evaluateFrame,
  isEmptyAtFrame,
  isEmptyKeyframe,
  isValidAxisBounds,
  resolveBoundRef,
  sampleTweenedNumber,
  sampleTweenedRecord,
  tweenEaseResolver,
} from './tween.ts'
import { FrameKind, type FrameBase, type LayerTimeline } from '../types/frame.types.ts'
import { TweenType, type Tween } from '../types/tween.types.ts'

const kf = (id: string, frame: number, value?: number): FrameBase => ({
  id,
  frame,
  kind: FrameKind.KEYFRAME,
  value,
})

const recordKf = (
  id: string,
  frame: number,
  values: Record<string, number>
): FrameBase => ({
  id,
  frame,
  kind: FrameKind.KEYFRAME,
  values,
})

const timeline = (frames: FrameBase[], tweens: Tween[] = []): LayerTimeline => ({
  frames,
  tweens,
})
const linear = () => (t: number) => t

describe('evaluateFrame', () => {
  const tl = timeline([kf('a', 0, 0), kf('b', 10, 100)])

  it('is empty before the first keyframe', () => {
    expect(evaluateFrame(tl, -1)).toEqual({ type: 'empty' })
  })

  it('is a keyframe on an exact frame', () => {
    expect(evaluateFrame(tl, 0)).toMatchObject({ type: 'keyframe' })
  })

  it('holds between keyframes when there is no tween', () => {
    expect(evaluateFrame(tl, 5)).toMatchObject({ type: 'hold' })
  })

  it('holds after the last keyframe', () => {
    expect(evaluateFrame(tl, 20)).toMatchObject({ type: 'hold' })
  })

  it('tweens between keyframes when an enabled tween connects them', () => {
    const tween: Tween = {
      id: 't',
      startKeyframeId: 'a',
      endKeyframeId: 'b',
      type: TweenType.LINEAR,
      enabled: true,
    }
    const result = evaluateFrame(timeline([kf('a', 0, 0), kf('b', 10, 100)], [tween]), 5)
    expect(result).toMatchObject({ type: 'tween', local: 0.5 })
  })

  it('holds when the tween is disabled', () => {
    const tween: Tween = {
      id: 't',
      startKeyframeId: 'a',
      endKeyframeId: 'b',
      type: TweenType.LINEAR,
      enabled: false,
    }
    expect(evaluateFrame(timeline([kf('a', 0), kf('b', 10)], [tween]), 5)).toMatchObject({
      type: 'hold',
    })
  })
})

describe('sampleTweenedNumber', () => {
  it('holds the previous value with no tween', () => {
    const tl = timeline([kf('a', 0, 0), kf('b', 10, 100)])
    expect(sampleTweenedNumber(tl, 5, linear)).toBe(0)
  })

  it('interpolates through an enabled tween', () => {
    const tween: Tween = {
      id: 't',
      startKeyframeId: 'a',
      endKeyframeId: 'b',
      type: TweenType.LINEAR,
      enabled: true,
    }
    const tl = timeline([kf('a', 0, 0), kf('b', 10, 100)], [tween])
    expect(sampleTweenedNumber(tl, 5, linear)).toBe(50)
  })

  it('returns the fallback before the first keyframe', () => {
    const tl = timeline([kf('a', 4, 7)])
    expect(sampleTweenedNumber(tl, 0, linear, -1)).toBe(-1)
  })

  describe('angleMode (shortest rotation)', () => {
    const shortTween = (shortestRotation?: boolean): Tween => ({
      id: 't',
      startKeyframeId: 'a',
      endKeyframeId: 'b',
      type: TweenType.LINEAR,
      enabled: true,
      shortestRotation,
    })

    it('takes the shortest arc across the 360° wrap (350°→10° → +20°)', () => {
      const tl = timeline([kf('a', 0, 350), kf('b', 10, 10)], [shortTween()])
      // Midpoint should be 360° (350 + 10), not 180° (the long way).
      expect(sampleTweenedNumber(tl, 5, linear, 0, { angleMode: true })).toBeCloseTo(360)
    })

    it('interpolates linearly when the tween disables shortest rotation', () => {
      const tl = timeline([kf('a', 0, 350), kf('b', 10, 10)], [shortTween(false)])
      expect(sampleTweenedNumber(tl, 5, linear, 0, { angleMode: true })).toBeCloseTo(180)
    })

    it('ignores angle mode for non-angle media (default off)', () => {
      const tl = timeline([kf('a', 0, 350), kf('b', 10, 10)], [shortTween()])
      expect(sampleTweenedNumber(tl, 5, linear)).toBeCloseTo(180)
    })
  })
})

describe('sampleTweenedRecord', () => {
  const channels = ['rotation', 'length', 'x']
  const tween: Tween = {
    id: 't',
    startKeyframeId: 'a',
    endKeyframeId: 'b',
    type: TweenType.LINEAR,
    enabled: true,
  }

  it('samples each channel through the segment tween', () => {
    const tl = timeline(
      [
        recordKf('a', 0, { rotation: 0, length: 10, x: 0 }),
        recordKf('b', 10, { rotation: 90, length: 30, x: 100 }),
      ],
      [tween]
    )
    expect(sampleTweenedRecord(tl, 5, linear, channels)).toEqual({
      rotation: 45,
      length: 20,
      x: 50,
    })
  })

  it('holds each channel between keyframes with no tween', () => {
    const tl = timeline([
      recordKf('a', 0, { rotation: 0, length: 10, x: 0 }),
      recordKf('b', 10, { rotation: 90, length: 30, x: 100 }),
    ])
    expect(sampleTweenedRecord(tl, 5, linear, channels)).toEqual({
      rotation: 0,
      length: 10,
      x: 0,
    })
  })

  it('applies shortest-arc only to the declared angle channels', () => {
    const shortest: Tween = { ...tween, shortestRotation: true }
    const tl = timeline(
      [
        recordKf('a', 0, { rotation: 350, x: 350 }),
        recordKf('b', 10, { rotation: 10, x: 10 }),
      ],
      [shortest]
    )
    const out = sampleTweenedRecord(tl, 5, linear, ['rotation', 'x'], {
      angleChannels: ['rotation'],
    })
    expect(out.rotation).toBeCloseTo(360) // shortest arc across the wrap
    expect(out.x).toBeCloseTo(180) // plain linear
  })

  it('falls back per channel before the first keyframe', () => {
    const tl = timeline([recordKf('a', 4, { rotation: 7 })])
    expect(
      sampleTweenedRecord(tl, 0, linear, ['rotation', 'length'], {
        fallback: { rotation: -1, length: 5 },
      })
    ).toEqual({
      rotation: -1,
      length: 5,
    })
  })
})

describe('tweenEaseResolver', () => {
  const tween = (type: TweenType, bezier?: Tween['bezier']): Tween => ({
    id: 't',
    startKeyframeId: 'a',
    endKeyframeId: 'b',
    type,
    enabled: true,
    bezier,
  })

  it('draws each type with greese.js: quadratic keywords by default, CSS for Pixels', () => {
    const tl = (type: TweenType, bezier?: Tween['bezier']) =>
      timeline([kf('a', 0, 0), kf('b', 10, 100)], [tween(type, bezier)])
    expect(
      sampleTweenedNumber(tl(TweenType.EASE_IN), 5, tweenEaseResolver())
    ).toBeCloseTo(25)
    expect(
      sampleTweenedNumber(tl(TweenType.EASE_IN), 5, tweenEaseResolver('css'))
    ).toBeCloseTo(100 * cubicBezier(0.42, 0, 1, 1)(0.5))
    expect(sampleTweenedNumber(tl(TweenType.STEP), 5, tweenEaseResolver())).toBe(0)
    expect(
      sampleTweenedNumber(tl(TweenType.BEZIER, [0, 0, 1, 1]), 5, tweenEaseResolver())
    ).toBeCloseTo(50)
  })
})

describe('cubicBezier', () => {
  it('pins the endpoints', () => {
    const ease = cubicBezier(0.42, 0, 0.58, 1)
    expect(ease(0)).toBe(0)
    expect(ease(1)).toBe(1)
  })

  it('is the identity for the linear control points', () => {
    const linearCurve = cubicBezier(0, 0, 1, 1)
    expect(linearCurve(0.5)).toBeCloseTo(0.5, 3)
    expect(linearCurve(0.25)).toBeCloseTo(0.25, 3)
  })

  it('ease-in stays below linear in the first half', () => {
    const easeIn = cubicBezier(0.42, 0, 1, 1)
    expect(easeIn(0.5)).toBeLessThan(0.5)
  })
})

describe('isEmptyAtFrame (empty keyframes)', () => {
  const empty = (id: string, frame: number): FrameBase => ({
    id,
    frame,
    kind: FrameKind.EMPTY,
  })

  it('is empty everywhere on a timeline with no keyframes', () => {
    expect(isEmptyAtFrame(timeline([]), 0)).toBe(true)
  })

  it('is empty before the first keyframe and full from it onward', () => {
    const tl = timeline([kf('a', 5, 1)])
    expect(isEmptyAtFrame(tl, 4)).toBe(true)
    expect(isEmptyAtFrame(tl, 5)).toBe(false)
    expect(isEmptyAtFrame(tl, 50)).toBe(false)
  })

  it('empties the empty keyframe and its hold descendants until the next key', () => {
    const tl = timeline([kf('a', 0, 1), empty('e', 5), kf('b', 10, 2)])
    expect(isEmptyAtFrame(tl, 4)).toBe(false)
    expect(isEmptyAtFrame(tl, 5)).toBe(true)
    expect(isEmptyAtFrame(tl, 9)).toBe(true)
    expect(isEmptyAtFrame(tl, 10)).toBe(false)
  })

  it('empties the trailing hold after a final empty keyframe', () => {
    const tl = timeline([kf('a', 0, 1), empty('e', 5)])
    expect(isEmptyAtFrame(tl, 99)).toBe(true)
  })

  it('isEmptyKeyframe distinguishes empty keys from real ones', () => {
    expect(isEmptyKeyframe(empty('e', 0))).toBe(true)
    expect(isEmptyKeyframe(kf('a', 0, 1))).toBe(false)
  })
})

describe('resolveBoundRef', () => {
  it('returns undefined for an unset ref', () => {
    expect(resolveBoundRef(undefined, () => undefined)).toBeUndefined()
  })

  it('returns the literal value for a "value" ref', () => {
    expect(resolveBoundRef({ kind: 'value', value: 42 }, () => undefined)).toBe(42)
  })

  it('looks up the referenced guide\'s position for a "guide" ref', () => {
    const lookup = (id: string) => (id === 'g1' ? 200 : undefined)
    expect(resolveBoundRef({ kind: 'guide', guideId: 'g1' }, lookup)).toBe(200)
  })

  it('returns undefined when the referenced guide no longer exists', () => {
    expect(
      resolveBoundRef({ kind: 'guide', guideId: 'missing' }, () => undefined)
    ).toBeUndefined()
  })
})

describe('clampAxis', () => {
  it('passes the value through unchanged with no bounds', () => {
    expect(clampAxis(5)).toBe(5)
  })

  it('clamps to the minimum', () => {
    expect(clampAxis(-10, 0, 100)).toBe(0)
  })

  it('clamps to the maximum', () => {
    expect(clampAxis(500, 0, 100)).toBe(100)
  })

  it('leaves an in-range value untouched', () => {
    expect(clampAxis(50, 0, 100)).toBe(50)
  })
})

describe('isValidAxisBounds', () => {
  it('is valid when either bound is unset', () => {
    expect(isValidAxisBounds(undefined, 10)).toBe(true)
    expect(isValidAxisBounds(10, undefined)).toBe(true)
    expect(isValidAxisBounds(undefined, undefined)).toBe(true)
  })

  it('is valid when max is strictly greater than min', () => {
    expect(isValidAxisBounds(0, 10)).toBe(true)
  })

  it('is invalid when max equals min', () => {
    expect(isValidAxisBounds(10, 10)).toBe(false)
  })

  it('is invalid when max is less than min', () => {
    expect(isValidAxisBounds(10, 5)).toBe(false)
  })
})
