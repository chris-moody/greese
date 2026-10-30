import { node, type AttributeValue, type SvgNode } from './node.ts'

/** A filter input: a built-in source or a previous primitive's `result`. */
export type FilterInput =
  | 'SourceGraphic'
  | 'SourceAlpha'
  | 'BackgroundImage'
  | 'FillPaint'
  | 'StrokePaint'
  | (string & {})

/** What every primitive takes. */
export interface PrimitiveBase {
  /** The input. @default the previous primitive's output, or the source graphic */
  in?: FilterInput
  /** Names the output, for later primitives to use as an input. */
  result?: string
}

const primitive = (
  tag: string,
  base: PrimitiveBase,
  attrs: Record<string, AttributeValue>,
  children: SvgNode[] = []
) => node(tag, { in: base.in, ...attrs, result: base.result }, children)

/** A value for both axes, or `[x, y]`. */
export type PerAxis = number | readonly [x: number, y: number]

const axes = (v: PerAxis | undefined) => (Array.isArray(v) ? v.join(' ') : (v as number))

/** `blur()`: a Gaussian blur (`feGaussianBlur`). */
export interface BlurOptions extends PrimitiveBase {
  /** How far it spreads (the standard deviation): one value, or `[x, y]` for one axis. */
  deviation: PerAxis
  /** What lies past the input's edges: copies of them, the far side, or nothing. */
  edges?: 'duplicate' | 'wrap' | 'none'
}

/** Gaussian blur. `blur(4)`, or `blur({ deviation: [4, 0] })` for one axis. */
export const blur = (options: number | BlurOptions): SvgNode => {
  const o = typeof options === 'number' ? { deviation: options } : options
  return primitive('feGaussianBlur', o, {
    stdDeviation: axes(o.deviation),
    edgeMode: o.edges,
  })
}

/** `offset()`: shifts the input (`feOffset`). */
export interface OffsetOptions extends PrimitiveBase {
  /** How far right, in the drawing's units. @default 0 */
  x?: number
  /** How far down. @default 0 */
  y?: number
}

/** Shifts the input. */
export const offset = (options: OffsetOptions): SvgNode =>
  primitive('feOffset', options, { dx: options.x, dy: options.y })

/** `flood()`: fills the filter region with a color (`feFlood`). */
export interface FloodOptions extends Omit<PrimitiveBase, 'in'> {
  /** The color (`flood-color`). */
  color: string
  /** Its opacity, 0–1 (`flood-opacity`). @default 1 */
  opacity?: number
}

/** Fills the filter region with a color. */
export const flood = (options: FloodOptions): SvgNode =>
  primitive('feFlood', options, {
    'flood-color': options.color,
    'flood-opacity': options.opacity,
  })

/** `dropShadow()`: a shadow in one primitive (`feDropShadow`). */
export interface DropShadowOptions extends PrimitiveBase {
  /** How far right it falls. @default 0 */
  x?: number
  /** How far down it falls. @default 2 */
  y?: number
  /** How soft it is (the blur's standard deviation). @default 2 */
  blur?: number
  /** Its color. @default 'black' */
  color?: string
  /** Its opacity, 0–1. @default 1 */
  opacity?: number
}

/** A drop shadow in one primitive. */
export const dropShadow = (options: DropShadowOptions = {}): SvgNode =>
  primitive('feDropShadow', options, {
    dx: options.x ?? 0,
    dy: options.y ?? 2,
    stdDeviation: options.blur ?? 2,
    'flood-color': options.color,
    'flood-opacity': options.opacity,
  })

/** `composite()`: combines two inputs (`feComposite`). */
export interface CompositeOptions extends PrimitiveBase {
  /** The second input, under the first. */
  in2: FilterInput
  /** A Porter-Duff operator, or `arithmetic` with `k1`–`k4`. @default 'over' */
  operator?: 'over' | 'in' | 'out' | 'atop' | 'xor' | 'lighter' | 'arithmetic'
  /** Arithmetic: the weight of the two inputs multiplied. */
  k1?: number
  /** Arithmetic: the weight of the first input. */
  k2?: number
  /** Arithmetic: the weight of the second input. */
  k3?: number
  /** Arithmetic: a constant added. */
  k4?: number
}

/** Combines two inputs by Porter-Duff operator, or arithmetically with `k1`–`k4`. */
export const composite = (options: CompositeOptions): SvgNode => {
  const { in2, operator, k1, k2, k3, k4 } = options
  return primitive('feComposite', options, { in2, operator, k1, k2, k3, k4 })
}

/** A blend mode for `blend()`. */
export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity'

/** `blend()`: blends two inputs (`feBlend`). */
export interface BlendOptions extends PrimitiveBase {
  /** The second input, under the first. */
  in2: FilterInput
  /** How they blend, as CSS `mix-blend-mode`. @default 'normal' */
  mode?: BlendMode
}

/** Blends two inputs with a blend mode. */
export const blend = (options: BlendOptions): SvgNode =>
  primitive('feBlend', options, { in2: options.in2, mode: options.mode })

/** Stacks inputs, first at the bottom: `merge(['shadow', 'SourceGraphic'])`. */
export const merge = (inputs: readonly FilterInput[], result?: string): SvgNode =>
  node(
    'feMerge',
    { result },
    inputs.map((i) => node('feMergeNode', { in: i }))
  )

/** `colorMatrix()`: transforms colors (`feColorMatrix`). */
export type ColorMatrixOptions = PrimitiveBase &
  (
    | {
        /** A 4×5 matrix, row by row (20 numbers). */
        type?: 'matrix'
        /** The matrix's 20 numbers. */
        values: readonly number[]
      }
    | {
        /** Saturation (0 is gray, 1 unchanged) or a hue turn in degrees. */
        type: 'saturate' | 'hueRotate'
        /** The saturation, or the degrees. */
        values: number
      }
    | {
        /** Brightness becomes alpha. */
        type: 'luminanceToAlpha'
      }
  )

/** Transforms colors: a matrix, or `saturate`, `hueRotate` or `luminanceToAlpha`. */
export const colorMatrix = (options: ColorMatrixOptions): SvgNode =>
  primitive('feColorMatrix', options, {
    type: options.type ?? 'matrix',
    values:
      'values' in options
        ? Array.isArray(options.values)
          ? options.values.join(' ')
          : (options.values as number)
        : undefined,
  })

/** `turbulence()`: Perlin noise (`feTurbulence`). */
export interface TurbulenceOptions extends Omit<PrimitiveBase, 'in'> {
  /** How fine the noise is (`baseFrequency`): one value, or `[x, y]`. */
  frequency: PerAxis
  /** Layers of detail (`numOctaves`). @default 1 */
  octaves?: number
  /** The random seed: change it for another pattern. @default 0 */
  seed?: number
  /** Smooth `fractalNoise`, or rippling `turbulence`. @default 'turbulence' */
  type?: 'turbulence' | 'fractalNoise'
  /** Make the noise tile seamlessly (`stitchTiles="stitch"`). @default false */
  stitch?: boolean
}

/** Perlin noise: `'turbulence'` or `'fractalNoise'`. */
export const turbulence = (options: TurbulenceOptions): SvgNode =>
  primitive('feTurbulence', options, {
    type: options.type,
    baseFrequency: axes(options.frequency),
    numOctaves: options.octaves,
    seed: options.seed,
    stitchTiles: options.stitch ? 'stitch' : undefined,
  })

/** A color channel. */
export type Channel = 'R' | 'G' | 'B' | 'A'

/** `displacementMap()`: moves pixels by another input (`feDisplacementMap`). */
export interface DisplacementMapOptions extends PrimitiveBase {
  /** The input whose channels say how far each pixel moves (often noise). */
  in2: FilterInput
  /** How far, at most, in the drawing's units. @default 0 */
  scale?: number
  /** The channel that moves pixels across. @default 'A' */
  xChannel?: Channel
  /** The channel that moves pixels down. @default 'A' */
  yChannel?: Channel
}

/** Displaces the input's pixels by another input's channels (often noise). */
export const displacementMap = (options: DisplacementMapOptions): SvgNode =>
  primitive('feDisplacementMap', options, {
    in2: options.in2,
    scale: options.scale,
    xChannelSelector: options.xChannel,
    yChannelSelector: options.yChannel,
  })

/** `morphology()`: thickens or thins the input (`feMorphology`). */
export interface MorphologyOptions extends PrimitiveBase {
  /** Thicken (`dilate`) or thin (`erode`). @default 'erode' */
  operator?: 'erode' | 'dilate'
  /** By how much: one value, or `[x, y]`. */
  radius: PerAxis
}

/** Thickens (`dilate`) or thins (`erode`) the input. */
export const morphology = (options: MorphologyOptions): SvgNode =>
  primitive('feMorphology', options, {
    operator: options.operator,
    radius: axes(options.radius),
  })

/** Region and color space for `filter()`. */
export interface FilterOptions {
  /** The id to reference it by: `filter={url(id)}`. */
  id: string
  /** Its primitives, in order. A preset's array spreads in. */
  effects: readonly SvgNode[]
  /**
   * The region it may paint in, as fractions or percentages of the shape's
   * box: its left edge. Blurs, glows and shadows need room past the box.
   * @default '-10%'
   */
  x?: number | string
  /** The region's top edge. @default '-10%' */
  y?: number | string
  /** The region's width. @default '120%' */
  width?: number | string
  /** The region's height. @default '120%' */
  height?: number | string
  /** The units of the region: fractions of the box, or the drawing's. @default 'objectBoundingBox' */
  units?: 'objectBoundingBox' | 'userSpaceOnUse'
  /** The color space primitives work in. @default 'linearRGB' */
  colorInterpolation?: 'sRGB' | 'linearRGB'
}

/** A `<filter>` from primitives and presets. */
export const filter = (options: FilterOptions): SvgNode =>
  node(
    'filter',
    {
      id: options.id,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      filterUnits: options.units,
      'color-interpolation-filters': options.colorInterpolation,
    },
    options.effects
  )

/** `glow()`'s options. */
export interface GlowOptions {
  /** How soft the glow is (the blur's standard deviation). @default 4 */
  blur?: number
  /** Its color. @default 'currentColor' */
  color?: string
  /** Its opacity, 0–1. @default 1 */
  opacity?: number
  /** How far it spreads before the blur (a dilation radius). @default 1 */
  strength?: number
}

/**
 * A soft glow in a color, behind the graphic.
 * `filter({ id: 'glow', effects: glow({ color: 'gold', blur: 6 }), x: '-50%', … })`, or
 * `<Glow color="gold" blur={6} />` in React.
 */
export const glow = (options: GlowOptions = {}): SvgNode[] => {
  const { blur: sd = 4, color = 'currentColor', opacity = 1, strength = 1 } = options
  return [
    flood({ color, opacity, result: 'glow-color' }),
    composite({
      in: 'glow-color',
      in2: 'SourceAlpha',
      operator: 'in',
      result: 'glow-shape',
    }),
    morphology({
      in: 'glow-shape',
      operator: 'dilate',
      radius: strength,
      result: 'glow-wide',
    }),
    blur({ in: 'glow-wide', deviation: sd, result: 'glow-blur' }),
    merge(['glow-blur', 'SourceGraphic']),
  ]
}

/** `goo()`'s options. */
export interface GooOptions {
  /** How far shapes reach toward each other (the blur's standard deviation). @default 10 */
  blur?: number
  /** How sharp the merged edge is: higher is crisper. @default 18 */
  threshold?: number
}

/**
 * The gooey effect: blurs shapes together, then sharpens the alpha so
 * nearby shapes merge like liquid. Animate the shapes, not the filter.
 */
export const goo = (options: GooOptions = {}): SvgNode[] => {
  const { blur: sd = 10, threshold = 18 } = options
  return [
    blur({ in: 'SourceGraphic', deviation: sd, result: 'goo-blur' }),
    colorMatrix({
      in: 'goo-blur',
      values: [
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        threshold,
        -threshold / 2,
      ],
      result: 'goo',
    }),
    composite({ in: 'SourceGraphic', in2: 'goo', operator: 'atop' }),
  ]
}

/** `grain()`'s options. */
export interface GrainOptions {
  /** How fine the grain is (the noise's frequency). @default 0.8 */
  frequency?: number
  /** How strong it is, 0–1. @default 0.25 */
  opacity?: number
  /** The random seed: change it for another pattern. */
  seed?: number
}

/** Film grain: noise laid over the graphic, inside its shape. */
export const grain = (options: GrainOptions = {}): SvgNode[] => {
  const { frequency = 0.8, opacity = 0.25, seed } = options
  return [
    turbulence({
      type: 'fractalNoise',
      frequency,
      octaves: 3,
      seed,
      stitch: true,
      result: 'grain-noise',
    }),
    colorMatrix({ in: 'grain-noise', type: 'saturate', values: 0, result: 'grain-gray' }),
    composite({
      in: 'grain-gray',
      in2: 'SourceGraphic',
      operator: 'arithmetic',
      k1: 0,
      k2: opacity,
      k3: 1,
      k4: 0,
      result: 'grain-mix',
    }),
    composite({ in: 'grain-mix', in2: 'SourceGraphic', operator: 'in' }),
  ]
}

/** `distort()`'s options. */
export interface DistortOptions {
  /** How tight the wobble is (the noise's frequency). @default 0.02 */
  frequency?: number
  /** How far edges move, in the drawing's units. @default 8 */
  scale?: number
  /** The random seed: change it for another wobble. */
  seed?: number
}

/** Wobbles edges with noise, as if drawn by hand or seen through water. */
export const distort = (options: DistortOptions = {}): SvgNode[] => {
  const { frequency = 0.02, scale = 8, seed } = options
  return [
    turbulence({
      frequency,
      octaves: 2,
      seed,
      result: 'distort-noise',
    }),
    displacementMap({
      in: 'SourceGraphic',
      in2: 'distort-noise',
      scale,
      xChannel: 'R',
      yChannel: 'G',
    }),
  ]
}
