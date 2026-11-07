import type { JSX, SVGProps } from 'react'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /**
   * An accessible name. Without one the icon is decorative (`aria-hidden`):
   * name the button or link around it instead, which is usually better.
   */
  title?: string
  /** Width and height: any CSS length, or a number of pixels. @default '1em' */
  size?: number | string
  /** Line width, in units of the drawing (16 × 16 unless it says otherwise). @default 1.5 */
  strokeWidth?: number | string
}

export interface IconOptions {
  /** The drawing's width and height in its own units. @default 16 */
  viewBox?: number
  /** The line width the icon is drawn for, in those units. @default 1.5 */
  strokeWidth?: number
  /** A solid shape, filled with `currentColor`, not a line drawing. */
  filled?: boolean
}

export type IconComponent = ((props: IconProps) => JSX.Element) & { displayName: string }

/**
 * Makes an icon component from line art: one path's `d`, or several separated
 * by `|`, drawn on a 16 × 16 grid (`options.viewBox` for another). The icon is
 * stroked in `currentColor` and sized to the text around it (1em), so it fits
 * buttons and text with no extra CSS. Rectangles and circles are paths too:
 * write them as arcs. When an icon's paths are styled apart (a sort arrow
 * lights one of two), they are its `path` elements in order.
 *
 * ```tsx
 * export const KiteIcon = createIcon('Kite', 'M8 1l5 6-5 8-5-8z')
 * ```
 */
export const createIcon = (
  name: string,
  d: string,
  { viewBox = 16, strokeWidth: drawn = 1.5, filled = false }: IconOptions = {}
): IconComponent => {
  const paths = d.split('|')
  const Icon = ({
    title,
    size = '1em',
    strokeWidth = drawn,
    style,
    ...props
  }: IconProps) => (
    <svg
      viewBox={`0 0 ${viewBox} ${viewBox}`}
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      // Inline, on the text's baseline, so an icon can sit in a sentence;
      // resets that make every svg a block don't stack it on its own line.
      style={{
        display: 'inline-block',
        verticalAlign: '-0.125em',
        flexShrink: 0,
        ...style,
      }}
      {...props}
    >
      {title && <title>{title}</title>}
      {paths.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
  Icon.displayName = `${name}Icon`
  return Icon
}
