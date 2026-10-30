import type { ComponentPropsWithRef, JSX } from 'react'
import {
  linearGradient,
  radialGradient,
  type LinearGradientOptions,
  type RadialGradientOptions,
} from '@greese/svg'
import { toReact } from './render.ts'

type Native<T extends 'linearGradient' | 'radialGradient', O> = Omit<
  ComponentPropsWithRef<T>,
  keyof O
>

export interface LinearGradientProps
  extends LinearGradientOptions, Native<'linearGradient', LinearGradientOptions> {}

/**
 * A `<linearGradient>`, by CSS-style angle or by points, with stops spaced
 * evenly unless they say where. Put it in a `<defs>` and paint with
 * `fill={url(id)}` (`url` is from `@greese/svg`, re-exported here).
 *
 * ```tsx
 * <LinearGradient id="sky" angle={135} stops={['#38bdf8', '#6366f1']} />
 * ```
 */
export const LinearGradient = ({
  id,
  stops,
  angle,
  x1,
  y1,
  x2,
  y2,
  units,
  spread,
  transform,
  ...props
}: LinearGradientProps): JSX.Element =>
  toReact(
    linearGradient({ id, stops, angle, x1, y1, x2, y2, units, spread, transform }),
    props
  )

export interface RadialGradientProps
  extends RadialGradientOptions, Native<'radialGradient', RadialGradientOptions> {}

/**
 * A `<radialGradient>`: colors spread from a focal point out to a circle.
 *
 * ```tsx
 * <RadialGradient id="glow" fx="30%" fy="30%" stops={['white', { color: '#6366f1', offset: 80 }]} />
 * ```
 */
export const RadialGradient = ({
  id,
  stops,
  cx,
  cy,
  r,
  fx,
  fy,
  fr,
  units,
  spread,
  transform,
  ...props
}: RadialGradientProps): JSX.Element =>
  toReact(
    radialGradient({ id, stops, cx, cy, r, fx, fy, fr, units, spread, transform }),
    props
  )
