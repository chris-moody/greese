import { node, type AttributeValue, type SvgNode } from './node.ts'
import { toPath, type PathInput } from './shapes.ts'

/** A shape as a `<path>` node: `shape({ type: 'circle', r: 10 }, { fill: 'red' })`. */
export const shape = (
  input: PathInput,
  attrs: Record<string, AttributeValue> = {}
): SvgNode => node('path', { d: toPath(input), ...attrs })

const children = (content: readonly (SvgNode | PathInput)[]) =>
  content.map((c) => (typeof c === 'object' && 'tag' in c ? c : shape(c)))

/** A `<clipPath>`: what's inside its shapes shows; the rest is cut away. */
export interface ClipPathOptions {
  /** The id to reference it by: `clip-path={url(id)}`. */
  id: string
  /** Its shapes: nodes, or anything `toPath` takes. */
  content: readonly (SvgNode | PathInput)[]
  /**
   * `'userSpaceOnUse'` (the drawing's units) or `'objectBoundingBox'`
   * (fractions of the clipped shape's box). @default 'userSpaceOnUse'
   */
  units?: 'userSpaceOnUse' | 'objectBoundingBox'
}

/** A `<clipPath>`. */
export const clipPath = (options: ClipPathOptions): SvgNode =>
  node(
    'clipPath',
    { id: options.id, clipPathUnits: options.units },
    children(options.content)
  )

/** A `<mask>`: white shows, black hides, grays and gradients fade between. */
export interface MaskOptions {
  /** The id to reference it by: `mask={url(id)}`. */
  id: string
  /** Its content: nodes, or shapes (which are filled white unless you give a node). */
  content: readonly (SvgNode | PathInput)[]
  /** The units of `x`, `y`, `width` and `height`. @default 'objectBoundingBox' */
  units?: 'userSpaceOnUse' | 'objectBoundingBox'
  /** The units of its content. @default 'userSpaceOnUse' */
  contentUnits?: 'userSpaceOnUse' | 'objectBoundingBox'
  /** The masked region's left edge. @default '-10%' */
  x?: number | string
  /** The masked region's top edge. @default '-10%' */
  y?: number | string
  /** The masked region's width. @default '120%' */
  width?: number | string
  /** The masked region's height. @default '120%' */
  height?: number | string
  /** Masks by luminance (the default) or by alpha. */
  type?: 'luminance' | 'alpha'
}

/** A `<mask>`. */
export const mask = (options: MaskOptions): SvgNode =>
  node(
    'mask',
    {
      id: options.id,
      maskUnits: options.units,
      maskContentUnits: options.contentUnits,
      x: options.x,
      y: options.y,
      width: options.width,
      height: options.height,
      'mask-type': options.type,
    },
    options.content.map((c) =>
      typeof c === 'object' && 'tag' in c ? c : shape(c, { fill: 'white' })
    )
  )
