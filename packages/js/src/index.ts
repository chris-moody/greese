/**
 * greese.js: a small keyframe and timeline animation library for the web.
 * Animates CSS properties, individual transforms, custom properties, text,
 * attributes and plain objects; timelines play, pause, seek, reverse, scale
 * time, repeat, yoyo and nest.
 */
export { cubicBezier, ease, type Ease, type EaseFn } from './ease.ts'
export {
  fromPixels,
  type FromPixelsOptions,
  type PixelsAnimation,
  type PixelsKeyframe,
  type PixelsLayer,
  type PixelsTween,
  type PixelsTweenType,
} from './pixels.ts'
export { splitText, type SplitText, type SplitTextOptions } from './split.ts'
export { batch, toTargets, type Target, type Targets } from './target.ts'
export {
  animate,
  timeline,
  Timeline,
  type AnimateOptions,
  type Keyframe,
  type Keyframes,
  type PerTarget,
  type Position,
  type StaggerOptions,
  type TimelineOptions,
  type Vars,
} from './timeline.ts'
export { prefersReducedMotion } from './motion.ts'
export { mix, parseColor, type Mixer, type Value } from './value.ts'
