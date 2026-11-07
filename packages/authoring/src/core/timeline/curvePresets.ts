/**
 * Keyframe-stamping curve generators — Pulsing and Envelope Sweep can't be
 * expressed as a single `Tween` (which only ever interpolates between two
 * *adjacent* keyframes — see `tween.helpers.ts`'s `evaluateFrame`), so these
 * write a whole sequence of ordinary keyframes + tweens at once instead of
 * adding a new sampling primitive. Pure and framework-level — usable by any
 * shell, not tied to any one media type.
 */
import { uid } from '../uid.ts'
import { FrameKind, type FrameBase } from '../types/frame.types.ts'
import { TweenType, type Tween } from '../types/tween.types.ts'

export interface StampedCurve {
  frames: FrameBase[]
  tweens: Tween[]
}

const keyframe = (frame: number, value: number): FrameBase => ({
  id: uid(),
  frame,
  kind: FrameKind.KEYFRAME,
  value,
})

const tweenBetween = (start: FrameBase, end: FrameBase, type: TweenType): Tween => ({
  id: uid(),
  startKeyframeId: start.id,
  endKeyframeId: end.id,
  type,
  enabled: true,
})

/**
 * A repeating oscillation between `baseline - amplitude` (trough) and
 * `baseline + amplitude` (peak), `cycles` times, evenly spaced across
 * `[startTick, endTick]` — `2 * cycles + 1` keyframes (trough/peak/trough/…,
 * starting and ending on a trough), each consecutive pair joined by an
 * enabled tween of `tweenType` (default `EASE_IN_OUT`, so it reads as a
 * smooth oscillation, not a saw-tooth). Rejects a degenerate/zero-length
 * range or fewer than one cycle.
 */
export const stampPulse = (
  startTick: number,
  endTick: number,
  cycles: number,
  baseline: number,
  amplitude: number,
  tweenType: TweenType = TweenType.EASE_IN_OUT
): StampedCurve => {
  const roundedCycles = Math.round(cycles)
  if (endTick <= startTick || roundedCycles < 1) return { frames: [], tweens: [] }

  const pointCount = 2 * roundedCycles + 1
  const step = (endTick - startTick) / (pointCount - 1)
  const frames: FrameBase[] = []
  for (let i = 0; i < pointCount; i++) {
    const tick = Math.round(startTick + i * step)
    const value = i % 2 === 0 ? baseline - amplitude : baseline + amplitude
    frames.push(keyframe(tick, value))
  }

  const tweens: Tween[] = []
  for (let i = 0; i < frames.length - 1; i++) {
    tweens.push(tweenBetween(frames[i]!, frames[i + 1]!, tweenType))
  }
  return { frames, tweens }
}

/**
 * A classic attack/decay/sustain/release envelope: 5 keyframes (start =
 * `baseline`, attack-end = `peak`, decay-end = `sustainLevel`, release-start
 * = `sustainLevel`, release-end = `baseline`) joined by
 * EASE_OUT (attack) / LINEAR (decay) / LINEAR (sustain hold) / EASE_IN
 * (release) tweens. Rejects any non-positive segment length (a degenerate,
 * zero-duration segment would violate the framework's tween invariant that
 * a tween's two keyframes have strictly different `frame`s).
 */
export const stampEnvelope = (
  startTick: number,
  attackTicks: number,
  decayTicks: number,
  sustainTicks: number,
  releaseTicks: number,
  peak: number,
  sustainLevel: number,
  baseline: number
): StampedCurve => {
  if (attackTicks <= 0 || decayTicks <= 0 || sustainTicks <= 0 || releaseTicks <= 0) {
    return { frames: [], tweens: [] }
  }

  const attackEnd = startTick + attackTicks
  const decayEnd = attackEnd + decayTicks
  const releaseStart = decayEnd + sustainTicks
  const releaseEnd = releaseStart + releaseTicks

  const start = keyframe(startTick, baseline)
  const attackEndFrame = keyframe(attackEnd, peak)
  const decayEndFrame = keyframe(decayEnd, sustainLevel)
  const releaseStartFrame = keyframe(releaseStart, sustainLevel)
  const releaseEndFrame = keyframe(releaseEnd, baseline)

  return {
    frames: [start, attackEndFrame, decayEndFrame, releaseStartFrame, releaseEndFrame],
    tweens: [
      tweenBetween(start, attackEndFrame, TweenType.EASE_OUT),
      tweenBetween(attackEndFrame, decayEndFrame, TweenType.LINEAR),
      tweenBetween(decayEndFrame, releaseStartFrame, TweenType.LINEAR),
      tweenBetween(releaseStartFrame, releaseEndFrame, TweenType.EASE_IN),
    ],
  }
}
