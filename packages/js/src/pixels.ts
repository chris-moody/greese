import type { Ease } from './ease.ts'
import type { Targets } from './target.ts'
import { Timeline, type TimelineOptions } from './timeline.ts'

/**
 * The parts of a GLOP Pixels layer timeline that `fromPixels` reads. It's
 * structurally compatible with `@beta/ui`'s `LayerTimeline`, so documents
 * can be passed straight through; nothing here depends on GLOP.
 */
export interface PixelsKeyframe {
  id: string
  /** Frame index on the layer's timeline. */
  frame: number
  /** `'span'` frames are skipped; every other kind with values is a key. */
  kind?: string
  /** A single-channel value (see {@link PixelsLayer.channel}). */
  value?: number
  /** Multi-channel values: `{ x, y, rotation, scaleX, scaleY, … }`. */
  values?: Record<string, number>
}

export type PixelsTweenType =
  | 'linear'
  | 'step'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'elastic'
  | 'bounce'
  | 'back'
  | 'bezier'

export interface PixelsTween {
  startKeyframeId: string
  endKeyframeId: string
  type: PixelsTweenType
  enabled?: boolean
  bezier?: [number, number, number, number]
  /** Rotation takes the shortest arc unless this is `false` (Pixels' angle mode). */
  shortestRotation?: boolean
}

export interface PixelsLayer {
  id: string
  timeline: { frames: PixelsKeyframe[]; tweens: PixelsTween[] }
  /** The channel a keyframe's single `value` animates. @default 'value' */
  channel?: string
}

export interface PixelsAnimation {
  /** Frames per second. @default 24 */
  fps?: number
  layers: PixelsLayer[]
  /** Loop forever, like Pixels' playback loop. */
  loop?: boolean
}

export interface FromPixelsOptions extends TimelineOptions {
  /**
   * Pixels channel → greese.js property. Unlisted channels keep their name,
   * so `'--glow'` or `'opacity'` channels work as-is.
   * @default { rotation: 'rotate', alpha: 'opacity' } (x, y, scaleX, scaleY match already)
   */
  channels?: Record<string, string>
}

const CHANNELS: Record<string, string> = { rotation: 'rotate', alpha: 'opacity' }

/**
 * Pixels' tween types as eases. Pixels' own renderer plays elastic, bounce
 * and back as linear; here they get greese.js's real curves.
 */
const easeOf = (tween: PixelsTween | undefined): Ease => {
  if (!tween || tween.enabled === false) return 'steps(1)' // a hold
  switch (tween.type) {
    case 'linear':
      return 'linear'
    case 'step':
      return 'steps(1)'
    case 'easeIn':
      return 'ease-in'
    case 'easeOut':
      return 'ease-out'
    case 'easeInOut':
      return 'ease-in-out'
    case 'bezier':
      return tween.bezier ?? [0.25, 0.1, 0.25, 1]
    default:
      return `${tween.type}.out`
  }
}

/** Shortest arc from `a` to `b`, in degrees. */
const shortest = (a: number, b: number): number => {
  let d = (b - a) % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return a + d
}

/**
 * Plays an animation authored in GLOP's Pixels studio on DOM elements (or any
 * targets): each layer's keyframes become tracks on one greese.js timeline,
 * frame numbers become seconds at the document's fps, and tween types become
 * eases.
 *
 * ```ts
 * const tl = fromPixels(symbol.animations.idle, { body: '.hero', shadow: '.hero-shadow' })
 * tl.play()
 * ```
 *
 * Spans (nested animations) aren't read; nest timelines with `add()` instead.
 */
export const fromPixels = (
  animation: PixelsAnimation,
  targets: Record<string, Targets>,
  { channels = {}, ...options }: FromPixelsOptions = {}
): Timeline => {
  const fps = animation.fps && animation.fps > 0 ? animation.fps : 24
  const map = { ...CHANNELS, ...channels }
  const tl = new Timeline({ paused: true, repeat: animation.loop ? -1 : 0, ...options })

  for (const layer of animation.layers) {
    const target = targets[layer.id]
    if (target == null) continue
    const single = layer.channel ?? 'value'
    const keys = layer.timeline.frames
      .filter((f) => f.kind !== 'span' && (f.value !== undefined || f.values))
      .sort((a, b) => a.frame - b.frame)
    const valueOf = (key: PixelsKeyframe, channel: string): number | undefined =>
      key.values?.[channel] ?? (channel === single ? key.value : undefined)
    const names = new Set<string>()
    for (const key of keys) {
      for (const name of Object.keys(key.values ?? {})) names.add(name)
      if (key.value !== undefined) names.add(single)
    }

    for (const channel of names) {
      const prop = map[channel] ?? channel
      const withValue = keys.filter((k) => valueOf(k, channel) !== undefined)
      if (withValue.length === 1) {
        tl.set(
          target,
          { [prop]: valueOf(withValue[0]!, channel)! },
          withValue[0]!.frame / fps
        )
      }
      for (let i = 0; i + 1 < withValue.length; i++) {
        const a = withValue[i]!
        const b = withValue[i + 1]!
        const tween = layer.timeline.tweens.find(
          (t) => t.startKeyframeId === a.id && t.endKeyframeId === b.id
        )
        const from = valueOf(a, channel)!
        let to = valueOf(b, channel)!
        if (channel === 'rotation' && tween && tween.shortestRotation !== false)
          to = shortest(from, to)
        tl.fromTo(
          target,
          { [prop]: from },
          { [prop]: to, duration: (b.frame - a.frame) / fps, ease: easeOf(tween) },
          a.frame / fps
        )
      }
    }
  }
  return tl
}
