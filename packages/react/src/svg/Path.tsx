import type { ComponentPropsWithRef, CSSProperties, JSX } from 'react'
import { dashes, toPath, type PathInput, type Slice } from '@greese/svg'
import { varsStyle, type VarsProps } from './vars.ts'

export interface PathProps extends VarsProps, Omit<ComponentPropsWithRef<'path'>, 'd'> {
  /**
   * What to draw: path data, or a shape from `@greese/svg`
   * (`{ type: 'star', r: 40 }`, `{ type: 'rect', width: 10, height: 4, rx: 1 }`…).
   */
  d: PathInput
  /**
   * Draws only part of the stroke, in percent of its length: `{ end: 60 }`,
   * `{ start: 20, end: 40, offset: 90 }` (wrapping round), or
   * `{ end: 5, repeat: 8 }` for eight evenly spaced dashes. Sets
   * `pathLength="100"`, so nothing is measured and it renders on the server.
   * Changing it with a CSS `transition` on `stroke-dasharray` and
   * `stroke-dashoffset` animates it.
   */
  slice?: Slice
}

/** The props a slice sets: `pathLength` and the two dash styles. */
export const sliceProps = (
  slice: Slice | undefined,
  style?: CSSProperties
): { pathLength?: number; style?: CSSProperties } =>
  slice ? { pathLength: 100, style: { ...dashes(slice), ...style } } : { style }

/**
 * A `<path>` that draws path data or a shape, optionally only a slice of its
 * stroke. Renders on the server: no measuring, no effects.
 *
 * ```tsx
 * <Path d={{ type: 'circle', cx: 50, cy: 50, r: 40 }} slice={{ end: 75 }} stroke="currentColor" fill="none" />
 * ```
 */
export const Path = ({ d, slice, vars, style, ...props }: PathProps): JSX.Element => (
  <path d={toPath(d)} {...props} {...sliceProps(slice, varsStyle(vars, style))} />
)
