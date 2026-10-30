import type { ComponentPropsWithRef, JSX } from 'react'
import {
  blend,
  blur,
  colorMatrix,
  composite,
  displacementMap,
  distort,
  dropShadow,
  flood,
  glow,
  goo,
  grain,
  morphology,
  offset,
  turbulence,
  type BlendOptions,
  type BlurOptions,
  type ColorMatrixOptions,
  type CompositeOptions,
  type DisplacementMapOptions,
  type DistortOptions,
  type DropShadowOptions,
  type FilterInput,
  type FloodOptions,
  type GlowOptions,
  type GooOptions,
  type GrainOptions,
  type MorphologyOptions,
  type OffsetOptions,
  type SvgNode,
  type TurbulenceOptions,
} from '@greese/svg'
import { toReact } from './render.ts'

// Filter primitives as components, inside a <Filter>. Their props are
// `@greese/svg`'s names for each primitive's attributes (`color` for
// `flood-color`, `deviation` for `stdDeviation`); anything else is passed on
// to the native element.

/** A primitive's native props, less the ones its own props stand for. */
type Native<E extends keyof JSX.IntrinsicElements, O> = Omit<
  ComponentPropsWithRef<E>,
  keyof O | 'children'
>

/** Several primitives (a preset) as siblings. */
const all = (nodes: SvgNode[]): JSX.Element => (
  <>{nodes.map((n, i) => toReact(n, {}, undefined, i))}</>
)

export interface FeGaussianBlurProps
  extends BlurOptions, Native<'feGaussianBlur', BlurOptions> {}

/**
 * A Gaussian blur. `deviation={[6, 0]}` blurs one axis: motion blur.
 *
 * ```tsx
 * <Filter id="soft"><FeGaussianBlur deviation={4} /></Filter>
 * ```
 */
export const FeGaussianBlur = ({
  in: input,
  result,
  deviation,
  edges,
  ...props
}: FeGaussianBlurProps): JSX.Element =>
  toReact(blur({ in: input, result, deviation, edges }), props)

export interface FeOffsetProps extends OffsetOptions, Native<'feOffset', OffsetOptions> {}

/**
 * Shifts its input by `x` and `y`, in the drawing's units.
 *
 * ```tsx
 * <FeOffset in="SourceAlpha" x={2} y={3} result="moved" />
 * ```
 */
export const FeOffset = ({
  in: input,
  result,
  x,
  y,
  ...props
}: FeOffsetProps): JSX.Element => toReact(offset({ in: input, result, x, y }), props)

export interface FeFloodProps extends FloodOptions, Native<'feFlood', FloodOptions> {}

/**
 * Fills the filter region with a `color` at an `opacity`.
 *
 * ```tsx
 * <FeFlood color="gold" opacity={0.5} result="tint" />
 * ```
 */
export const FeFlood = ({
  result,
  color,
  opacity,
  ...props
}: FeFloodProps): JSX.Element => toReact(flood({ result, color, opacity }), props)

export interface FeDropShadowProps
  extends DropShadowOptions, Native<'feDropShadow', DropShadowOptions> {}

/**
 * A drop shadow in one primitive.
 *
 * ```tsx
 * <Filter id="lift"><FeDropShadow y={4} blur={3} opacity={0.4} /></Filter>
 * ```
 */
export const FeDropShadow = ({
  in: input,
  result,
  x,
  y,
  blur: softness,
  color,
  opacity,
  ...props
}: FeDropShadowProps): JSX.Element =>
  toReact(dropShadow({ in: input, result, x, y, blur: softness, color, opacity }), props)

export interface FeCompositeProps
  extends CompositeOptions, Native<'feComposite', CompositeOptions> {}

/**
 * Combines two inputs by a Porter-Duff `operator`, or arithmetically with
 * `k1`–`k4`.
 *
 * ```tsx
 * <FeComposite in="tint" in2="SourceAlpha" operator="in" />
 * ```
 */
export const FeComposite = ({
  in: input,
  in2,
  result,
  operator,
  k1,
  k2,
  k3,
  k4,
  ...props
}: FeCompositeProps): JSX.Element =>
  toReact(composite({ in: input, in2, result, operator, k1, k2, k3, k4 }), props)

export interface FeBlendProps extends BlendOptions, Native<'feBlend', BlendOptions> {}

/**
 * Blends two inputs with a blend `mode`, as CSS `mix-blend-mode` does.
 *
 * ```tsx
 * <FeBlend in="SourceGraphic" in2="noise" mode="multiply" />
 * ```
 */
export const FeBlend = ({
  in: input,
  in2,
  result,
  mode,
  ...props
}: FeBlendProps): JSX.Element => toReact(blend({ in: input, in2, result, mode }), props)

export interface FeMergeProps extends ComponentPropsWithRef<'feMerge'> {
  /** Names the output, for later primitives to use as an input. */
  result?: string
}

/**
 * Stacks its `FeMergeNode`s' inputs, the first at the bottom.
 *
 * ```tsx
 * <FeMerge>
 *   <FeMergeNode in="shadow" />
 *   <FeMergeNode in="SourceGraphic" />
 * </FeMerge>
 * ```
 */
export const FeMerge = (props: FeMergeProps): JSX.Element => <feMerge {...props} />

export interface FeMergeNodeProps extends Omit<
  ComponentPropsWithRef<'feMergeNode'>,
  'in'
> {
  /** The input it stacks: a built-in source or an earlier primitive's `result`. */
  in: FilterInput
}

/** One layer of an `FeMerge`. */
export const FeMergeNode = (props: FeMergeNodeProps): JSX.Element => (
  <feMergeNode {...props} />
)

export type FeColorMatrixProps = ColorMatrixOptions &
  Native<
    'feColorMatrix',
    { in: unknown; result: unknown; type: unknown; values: unknown }
  >

/**
 * Transforms colors: a 4×5 matrix, or `type="saturate"`, `"hueRotate"` or
 * `"luminanceToAlpha"`.
 *
 * ```tsx
 * <FeColorMatrix type="saturate" values={0} />
 * ```
 */
export const FeColorMatrix = (props: FeColorMatrixProps): JSX.Element => {
  const {
    in: input,
    result,
    type,
    values,
    ...rest
  } = props as ColorMatrixOptions & {
    values?: number | readonly number[]
  } & Record<string, unknown>
  return toReact(
    colorMatrix({ in: input, result, type, values } as ColorMatrixOptions),
    rest
  )
}

export interface FeTurbulenceProps
  extends TurbulenceOptions, Native<'feTurbulence', TurbulenceOptions> {}

/**
 * Perlin noise, for grain, clouds or (through `FeDisplacementMap`) wobble.
 *
 * ```tsx
 * <FeTurbulence type="fractalNoise" frequency={0.8} octaves={3} stitch result="noise" />
 * ```
 */
export const FeTurbulence = ({
  result,
  frequency,
  octaves,
  seed,
  type,
  stitch,
  ...props
}: FeTurbulenceProps): JSX.Element =>
  toReact(turbulence({ result, frequency, octaves, seed, type, stitch }), props)

export interface FeDisplacementMapProps
  extends DisplacementMapOptions, Native<'feDisplacementMap', DisplacementMapOptions> {}

/**
 * Moves its input's pixels by another input's channels, often noise.
 *
 * ```tsx
 * <FeDisplacementMap in="SourceGraphic" in2="noise" scale={8} xChannel="R" yChannel="G" />
 * ```
 */
export const FeDisplacementMap = ({
  in: input,
  in2,
  result,
  scale,
  xChannel,
  yChannel,
  ...props
}: FeDisplacementMapProps): JSX.Element =>
  toReact(displacementMap({ in: input, in2, result, scale, xChannel, yChannel }), props)

export interface FeMorphologyProps
  extends MorphologyOptions, Native<'feMorphology', MorphologyOptions> {}

/**
 * Thickens (`operator="dilate"`) or thins (`erode`) its input by `radius`.
 *
 * ```tsx
 * <FeMorphology operator="dilate" radius={2} />
 * ```
 */
export const FeMorphology = ({
  in: input,
  result,
  operator,
  radius,
  ...props
}: FeMorphologyProps): JSX.Element =>
  toReact(morphology({ in: input, result, operator, radius }), props)

export type GlowProps = GlowOptions

/**
 * A soft glow in a color, behind the graphic. Give the `Filter` room for
 * it: `x="-50%" y="-50%" width="200%" height="200%"`.
 *
 * ```tsx
 * <Filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><Glow color="gold" blur={6} /></Filter>
 * ```
 */
export const Glow = (props: GlowProps): JSX.Element => all(glow(props))

export type GooProps = GooOptions

/**
 * Shapes that come near each other merge like liquid. Animate the shapes,
 * not the filter.
 *
 * ```tsx
 * <Filter id="goo"><Goo blur={6} threshold={20} /></Filter>
 * ```
 */
export const Goo = (props: GooProps): JSX.Element => all(goo(props))

export type GrainProps = GrainOptions

/**
 * Film grain over the graphic, inside its shape.
 *
 * ```tsx
 * <Filter id="grain"><Grain opacity={0.35} /></Filter>
 * ```
 */
export const Grain = (props: GrainProps): JSX.Element => all(grain(props))

export type DistortProps = DistortOptions

/**
 * Wobbles edges with noise, as if drawn by hand or seen through water.
 *
 * ```tsx
 * <Filter id="wobble"><Distort frequency={0.04} scale={6} /></Filter>
 * ```
 */
export const Distort = (props: DistortProps): JSX.Element => all(distort(props))
