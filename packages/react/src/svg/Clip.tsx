import type { ComponentPropsWithRef, JSX } from 'react'
import { clipPath, mask, type ClipPathOptions, type MaskOptions } from '@greese/svg'
import { toReact } from './render.ts'

export interface ClipPathProps
  extends
    Omit<ClipPathOptions, 'content'>,
    Omit<ComponentPropsWithRef<'clipPath'>, keyof ClipPathOptions> {
  /**
   * Shapes to clip to: path data or `@greese/svg` shape specs. Children (any
   * SVG elements) are added after them.
   */
  content?: ClipPathOptions['content']
}

/**
 * A `<clipPath>`: what lies inside its shapes shows, the rest is cut away.
 * Apply it with `clipPath={url(id)}`.
 *
 * ```tsx
 * <ClipPath id="hex" content={[{ type: 'regularPolygon', cx: 50, cy: 50, r: 50 }]} />
 * ```
 */
export const ClipPath = ({
  id,
  content = [],
  units,
  children,
  ...props
}: ClipPathProps): JSX.Element =>
  toReact(clipPath({ id, content, units }), props, children)

export interface MaskProps
  extends
    Omit<MaskOptions, 'content'>,
    Omit<ComponentPropsWithRef<'mask'>, keyof MaskOptions> {
  /**
   * Shapes that reveal (filled white), as path data or shape specs, or nodes
   * from `@greese/svg` with their own fill. Children are added after them.
   */
  content?: MaskOptions['content']
}

/**
 * A `<mask>`: white reveals, black hides, and grays and gradients fade
 * between. Apply it with `mask={url(id)}`.
 *
 * ```tsx
 * <Mask id="fade"><rect width="100" height="100" fill="url(#fade-gradient)" /></Mask>
 * ```
 */
export const Mask = ({
  id,
  content = [],
  units,
  contentUnits,
  x,
  y,
  width,
  height,
  type,
  children,
  ...props
}: MaskProps): JSX.Element =>
  toReact(
    mask({ id, content, units, contentUnits, x, y, width, height, type }),
    props,
    children
  )
