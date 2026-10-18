/**
 * sauce.js: a small keyframe and timeline animation library for the web.
 * Animates CSS properties, individual transforms, custom properties, text,
 * attributes and plain objects; timelines play, pause, seek, reverse, scale
 * time, repeat, yoyo and nest.
 */
export { cubicBezier, ease, type Ease, type EaseFn } from './ease.ts'
export { splitText, type SplitText, type SplitTextOptions } from './split.ts'
export { toTargets, type Target, type Targets } from './target.ts'
export {
  animate,
  timeline,
  Timeline,
  type AnimateOptions,
  type Keyframe,
  type Keyframes,
  type Position,
  type StaggerOptions,
  type TimelineOptions,
  type Vars,
} from './timeline.ts'
export { mix, parseColor, type Mixer, type Value } from './value.ts'
