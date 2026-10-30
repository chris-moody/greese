import type { ComponentPropsWithRef, JSX } from 'react'
import { filter, type FilterOptions } from '@greese/svg'
import { toReact } from './render.ts'

export interface FilterProps
  extends
    Omit<FilterOptions, 'effects'>,
    Omit<ComponentPropsWithRef<'filter'>, keyof FilterOptions> {}

/**
 * A `<filter>`: its children are its primitives, in order. The `Fe…`
 * components (`FeGaussianBlur`, `FeFlood`, `FeComposite`…) and presets
 * (`Glow`, `Goo`, `Grain`, `Distort`) take friendly prop names; native
 * `<fe…>` elements work too. Apply it with `filter={url(id)}`; give it a
 * larger region (`x`, `y`, `width`, `height`) for effects that paint past
 * the shape, like glows.
 *
 * ```tsx
 * <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
 *   <Glow color="gold" blur={6} />
 * </Filter>
 * ```
 */
export const Filter = ({
  id,
  x,
  y,
  width,
  height,
  units,
  colorInterpolation,
  children,
  ...props
}: FilterProps): JSX.Element =>
  toReact(
    filter({ id, effects: [], x, y, width, height, units, colorInterpolation }),
    props,
    children
  )
