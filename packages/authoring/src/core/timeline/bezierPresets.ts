import type { BezierControls } from '../types/tween.types.ts'

/** A named cubic-bézier shape, selectable from the Interpolation dropdown alongside the plain `TweenType`s. */
export interface BezierPreset {
  id: string
  label: string
  bezier: BezierControls
}

/**
 * Common named curves, expressed as `TweenType.BEZIER` control-point presets
 * rather than new `TweenType` enum members — every easing resolver
 * (`propertyTween.helpers.ts`'s `NAMED_EASE`, `@beta/rigatron`'s `EASING`,
 * NeoPixels' `easeFor`) already fully implements `BEZIER`, so a preset needs
 * zero resolver changes.
 */
export const BEZIER_PRESETS: BezierPreset[] = [
  // Classic gradual fade-in: stays low, rises smoothly.
  { id: 'slowRise', label: 'Slow Rise', bezier: [0.12, 0, 0.39, 0] },
  // Flatter for longer, then a steep late rise — feels more natural to the ear.
  { id: 'exponential', label: 'Exponential', bezier: [0.7, 0, 0.84, 0] },
]
